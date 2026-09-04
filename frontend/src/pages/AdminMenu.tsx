import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MenuItem, Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit, Trash2, Utensils, Check, X } from 'lucide-react';

export const AdminMenu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const categories: Category[] = ['TEA / MILK', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];

  const [formData, setFormData] = useState({
    item_name: '',
    category: 'BREAKFAST' as Category,
    description: '',
    quantity: '1 portion',
    price: '',
    availability: true,
    available_days: daysOfWeek,
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
      alert(err.response?.data?.message || 'Error saving menu item.');
    }
  };

  const handleDelete = async (menuId: number) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/admin/menu/${menuId}`);
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete item.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-600" />
            Menu Management (Admin Only)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Add, edit, delete menu items, modify prices, quantities, and day-wise availability.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Menu Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading menu items...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Item Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Available Days</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-600">#{item.menu_id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{item.item_name}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{item.category}</td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">₹{item.price}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.available_days.length === 7
                        ? 'All Days'
                        : item.available_days.join(', ')}
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
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.menu_id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Item"
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
                {editingItem ? `Edit Menu Item #${editingItem.menu_id}` : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Name *</label>
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
                  <label className="block font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Quantity Format *</label>
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
                <label className="block font-semibold text-gray-700 mb-1">Price (₹) *</label>
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
                <label className="block font-semibold text-gray-700 mb-1">Description</label>
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
                  Item Enabled (Available for Ordering)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-2">Available Days</label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => {
                    const checked = formData.available_days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`py-1.5 px-2 rounded text-center border font-semibold ${
                          checked
                            ? 'bg-blue-50 border-blue-400 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                      >
                        {day.slice(0, 3)} {checked ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
