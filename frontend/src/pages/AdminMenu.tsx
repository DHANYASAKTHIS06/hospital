import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { MenuItem, Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit, Trash2, Utensils, X } from 'lucide-react';

export const AdminMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { t, language, translateFood, translateCategory, translateSlot } = useLanguage();
  const isTa = language === 'ta';

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabelsTa: Record<string, string> = {
    Monday: 'திங்கள்',
    Tuesday: 'செவ்வாய்',
    Wednesday: 'புதன்',
    Thursday: 'வியாழன்',
    Friday: 'வெள்ளி',
    Saturday: 'சனி',
    Sunday: 'ஞாயிறு',
  };

  const standardTimeSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];
  const categories: Category[] = ['COMMON MENU', 'TEA / MILK', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'BREAKFAST' as Category,
    description: '',
    quantity: '1 portion',
    price: '',
    availability: true,
    available_days: daysOfWeek,
    requires_serving_time: false,
    serving_time_slots: standardTimeSlots,
  });

  const fetchMenu = async () => {
    try {
      const response = await api.get('/admin/menu');
      setMenuItems(response.data);
    } catch (err) {
      console.error('Error fetching admin menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      category: 'BREAKFAST',
      description: '',
      quantity: '1 portion',
      price: '',
      availability: true,
      available_days: daysOfWeek,
      requires_serving_time: false,
      serving_time_slots: standardTimeSlots,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      description: item.description || '',
      quantity: item.quantity,
      price: String(item.price),
      availability: item.availability,
      available_days: item.available_days || daysOfWeek,
      requires_serving_time: item.requires_serving_time ?? (item.category === 'TEA / MILK'),
      serving_time_slots: item.serving_time_slots && item.serving_time_slots.length > 0
        ? item.serving_time_slots
        : standardTimeSlots,
    });
    setModalOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const days = [...prev.available_days];
      if (days.includes(day)) {
        return { ...prev, available_days: days.filter((d) => d !== day) };
      } else {
        return { ...prev, available_days: [...days, day] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/menu/${editingItem.menu_id}`, formData);
      } else {
        await api.post('/admin/menu', formData);
      }
      setModalOpen(false);
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'மெனு உருப்படியைச் சேமிப்பதில் பிழை.' : 'Error saving menu item.'));
    }
  };

  const handleDelete = async (menuId: number) => {
    if (!window.confirm(isTa ? 'இந்த மெனு உருப்படியை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/admin/menu/${menuId}`);
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'உருப்படியை நீக்குவதில் தோல்வி.' : 'Failed to delete item.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-procare-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            {t('appName')} • {t('clinicName')}
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <Utensils className="w-5 h-5 text-procare-700" />
            {isTa ? 'மெனு மேலாண்மை (நிர்வாகி மட்டும்)' : 'Menu Management (Admin Only)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'மெனு உருப்படிகளைச் சேர்க்கவும், திருத்தவும், நீக்கவும், விலைகள், அளவுகள் மற்றும் கிடைக்கும் நாட்களை மாற்றவும்.'
              : 'Add, edit, delete menu items, modify prices, quantities, and day-wise availability.'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-celadon hover:bg-procare-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>{isTa ? 'புதிய உருப்படியைச் சேர்' : 'Add Menu Item'}</span>
        </button>
      </div>

      {/* Menu Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">
          {isTa ? 'மெனு உருப்படிகள் ஏற்றப்படுகின்றன...' : 'Loading menu items...'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{isTa ? 'எண்' : 'ID'}</th>
                  <th className="px-4 py-3">{isTa ? 'உணவின் பெயர்' : 'Item Name'}</th>
                  <th className="px-4 py-3">{isTa ? 'பிரிவு' : 'Category'}</th>
                  <th className="px-4 py-3">{isTa ? 'அளவு' : 'Quantity'}</th>
                  <th className="px-4 py-3">{isTa ? 'விலை' : 'Price'}</th>
                  <th className="px-4 py-3">{isTa ? 'கிடைக்கும் நாட்கள்' : 'Available Days'}</th>
                  <th className="px-4 py-3 text-center">{isTa ? 'நிலை' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isTa ? 'செயல்கள்' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-600">#{item.menu_id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{translateFood(item.item_name)}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">
                      <div>
                        <span>
                          {item.category === 'COMMON MENU'
                            ? isTa
                              ? 'அனைத்து உணவுகள் (காலை / மதிய / இரவு)'
                              : 'ALL MEALS (BREAKFAST / LUNCH / DINNER)'
                            : translateCategory(item.category)}
                        </span>
                        {(item.requires_serving_time || item.category === 'TEA / MILK') && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(item.serving_time_slots && item.serving_time_slots.length > 0 ? item.serving_time_slots : standardTimeSlots).map((slot) => (
                              <span key={slot} className="inline-block text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                                {translateSlot(slot)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₹{item.price}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.available_days.length === 7
                        ? isTa
                          ? 'அனைத்து நாட்கள்'
                          : 'All Days'
                        : item.available_days.map((d) => (isTa ? dayLabelsTa[d] || d : d)).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={item.availability ? 'AVAILABLE' : 'UNAVAILABLE'}
                        type="menu"
                      />
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title={isTa ? 'திருத்து' : 'Edit Item'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.menu_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title={isTa ? 'நீக்கு' : 'Delete Item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editingItem
                  ? isTa
                    ? `மெனு உருப்படி #${editingItem.menu_id}-ஐ திருத்து`
                    : `Edit Menu Item #${editingItem.menu_id}`
                  : isTa
                  ? 'புதிய மெனு உருப்படியைச் சேர்க்கவும்'
                  : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? 'உணவின் பெயர் *' : 'Item Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="e.g. Idly / Meals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? 'பிரிவு *' : 'Category *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value as Category;
                      setFormData({
                        ...formData,
                        category: newCat,
                        requires_serving_time: newCat === 'TEA / MILK' ? true : formData.requires_serving_time,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'COMMON MENU'
                          ? isTa
                            ? 'அனைத்து உணவுகள் (காலை / மதிய / இரவு)'
                            : 'ALL MEALS (BREAKFAST / LUNCH / DINNER)'
                          : translateCategory(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    {isTa ? 'அளவு வடிவம் *' : 'Quantity Format *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 2 Nos / 100 ml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? 'விலை (₹) *' : 'Price (₹) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Price in INR"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? 'விளக்கம்' : 'Description'}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details (e.g. Rice 350g, Sambar 100ml)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="availability"
                  checked={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="availability" className="font-semibold text-gray-800">
                  {isTa ? 'உருப்படி இயக்கப்பட்டது (ஆர்டர் செய்ய கிடைக்கும்)' : 'Item Enabled (Available for Ordering)'}
                </label>
              </div>

              {/* Requires Serving Time Config */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_serving_time"
                    checked={formData.requires_serving_time}
                    onChange={(e) => setFormData({ ...formData, requires_serving_time: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <label htmlFor="requires_serving_time" className="font-bold text-amber-950">
                    {isTa ? 'வழங்கும் நேரம் தேவை (எ.கா. தேநீர், காபி, பால்)' : 'Requires Serving Time (e.g., Tea, Coffee, Milk)'}
                  </label>
                </div>
                {formData.requires_serving_time && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-amber-900 mb-1.5">
                      {isTa ? 'கிடைக்கும் நேர இடங்கள்' : 'Available Serving Time Slots (Select enabled slots)'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {standardTimeSlots.map((slot) => {
                        const checked = formData.serving_time_slots.includes(slot);
                        return (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => {
                              setFormData((prev) => {
                                const slots = [...prev.serving_time_slots];
                                return {
                                  ...prev,
                                  serving_time_slots: checked ? slots.filter((s) => s !== slot) : [...slots, slot],
                                };
                              });
                            }}
                            className={`py-1.5 px-2 rounded-lg text-center border font-bold text-xs transition-all cursor-pointer ${
                              checked
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            {translateSlot(slot)} {checked ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  {isTa ? 'கிடைக்கும் நாட்கள்' : 'Available Days'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => {
                    const checked = formData.available_days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`py-1.5 px-2 rounded text-center border font-semibold cursor-pointer ${
                          checked
                            ? 'bg-blue-50 border-blue-400 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                      >
                        {isTa ? dayLabelsTa[day] : day.slice(0, 3)} {checked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm cursor-pointer"
                >
                  {isTa ? 'உருப்படியைச் சேமி' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
