import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { MenuItem, Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, Plus, Minus, Check, Utensils, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PatientMenu: React.FC = () => {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [cart, setCart] = useState<{ [menu_id: number]: number }>({});
  const [mealType, setMealType] = useState<string>('Breakfast');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories: Category[] = ['TEA / MILK', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];

  const fetchMenu = async () => {
    try {
      const response = await api.get('/patient/menu');
      setMenuItems(response.data);
    } catch (err: any) {
      setError('Failed to fetch menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleQtyChange = (menu_id: number, delta: number) => {
    setCart((prev) => {
      const current = prev[menu_id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[menu_id];
        return copy;
      }
      return { ...prev, [menu_id]: next };
    });
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([idStr, qty]) => {
      const item = menuItems.find((m) => m.menu_id === Number(idStr));
      if (item) {
        total += item.price * qty;
      }
    });
    return total;
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setSuccessMsg(null);

    const itemsToOrder = Object.entries(cart).map(([menu_id, quantity]) => ({
      menu_id: Number(menu_id),
      quantity,
    }));

    if (itemsToOrder.length === 0) {
      setError('Please select at least one item before placing an order.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/patient/orders', {
        items: itemsToOrder,
        meal_type: mealType,
      });

      setSuccessMsg('Order placed successfully! Order status set to PENDING.');
      setCart({});
      setTimeout(() => {
        navigate('/patient/orders');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems =
    selectedCategory === 'ALL'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5 sm:space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Utensils className="w-5 h-5" />
            </div>
            Canteen Food Menu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Select food items and quantities for your daily meal order.
          </p>
        </div>

        {/* Meal Type selection */}
        <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
          <label className="font-bold text-slate-700 whitespace-nowrap">Meal Type:</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tea / Coffee">Tea / Milk</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Category Horizontal Scroll Bar on Mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          ALL ITEMS ({menuItems.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs rounded-xl font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Menu Items Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
          Loading canteen menu items...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs font-medium bg-white rounded-2xl border border-slate-200/80">
          No items found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isAvailable = item.is_available_today;
            const qtyInCart = cart[item.menu_id] || 0;

            return (
              <div
                key={item._id}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
                  isAvailable ? 'border-slate-200/80' : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{item.item_name}</h3>
                    </div>
                    <StatusBadge
                      status={isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      type="menu"
                    />
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 mb-2 leading-relaxed font-medium">{item.description}</p>
                  )}

                  <div className="flex justify-between items-center text-xs text-slate-600 mb-3">
                    <span className="font-semibold">Portion: <strong className="text-slate-800 font-bold">{item.quantity}</strong></span>
                    <span className="text-base font-black text-blue-700">₹{item.price}</span>
                  </div>

                  {!isAvailable && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/80 mb-2 font-medium">
                      Available on: {item.available_days.join(', ')}
                    </div>
                  )}
                </div>

                {/* Patient Quantity Selector */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isAvailable ? (
                    <div className="flex items-center space-x-2 w-full justify-between">
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menu_id, -1)}
                          disabled={qtyInCart === 0}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1.5 text-xs font-black text-slate-800 min-w-[2rem] text-center">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menu_id, 1)}
                          className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menu_id, qtyInCart > 0 ? 0 : 1)}
                        className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all ${
                          qtyInCart > 0
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                        }`}
                      >
                        {qtyInCart > 0 ? 'Added ✓' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-semibold italic">Unavailable Today</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Order Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-72 max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between z-40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold">Selected Items: {cartCount}</div>
              <div className="text-base sm:text-lg font-black text-white">Total: ₹{calculateTotal()}</div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow transition-colors disabled:opacity-50"
          >
            {submitting ? 'Placing Order...' : 'PLACE ORDER'}
          </button>
        </div>
      )}
    </div>
  );
};
