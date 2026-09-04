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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-blue-600" />
            Canteen Food Menu
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Select food items and quantities for your daily meal order.
          </p>
        </div>

        {/* Meal Type selection */}
        <div className="flex items-center space-x-2 text-xs">
          <label className="font-semibold text-gray-700">Meal Type:</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-800 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="Tea / Coffee">Tea / Milk</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          ALL ITEMS ({menuItems.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Menu Items Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading canteen menu items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-xs">No items found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isAvailable = item.is_available_today;
            const qtyInCart = cart[item.menu_id] || 0;

            return (
              <div
                key={item._id}
                className={`bg-white border rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all ${
                  isAvailable ? 'border-gray-200 hover:border-blue-300' : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-gray-900">{item.item_name}</h3>
                    </div>
                    <StatusBadge
                      status={isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                      type="menu"
                    />
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-600 mb-3">
                    <span>Qty: <strong className="text-gray-800">{item.quantity}</strong></span>
                    <span className="text-base font-bold text-blue-700">₹{item.price}</span>
                  </div>

                  {!isAvailable && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 mb-2">
                      Available on: {item.available_days.join(', ')}
                    </div>
                  )}
                </div>

                {/* Patient Quantity Selector */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  {isAvailable ? (
                    <div className="flex items-center space-x-2 w-full justify-between">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menu_id, -1)}
                          disabled={qtyInCart === 0}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-gray-800 min-w-[2rem] text-center">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.menu_id, 1)}
                          className="px-2.5 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.menu_id, qtyInCart > 0 ? 0 : 1)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          qtyInCart > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {qtyInCart > 0 ? 'Added ✓' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">Item Unavailable Today</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Order Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 max-w-4xl mx-auto bg-gray-900 text-white rounded-xl p-4 shadow-xl border border-gray-800 flex items-center justify-between z-40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Selected Items: {cartCount}</div>
              <div className="text-lg font-bold text-white">Total: ₹{calculateTotal()}</div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {submitting ? 'Placing Order...' : 'PLACE ORDER'}
          </button>
        </div>
      )}
    </div>
  );
};
