import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { MenuItem, Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, Plus, Minus, Check, Utensils, AlertCircle, Lock, Wallet, AlertTriangle, Coffee, Sun, Moon, Cookie, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TEA_TIME_SLOTS = [
  { slot: '7:00 AM', label: '7:00 AM', period: 'Morning Service', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  { slot: '11:00 AM', label: '11:00 AM', period: 'Mid-Morning Service', color: 'text-sky-800 bg-sky-50 border-sky-200' },
  { slot: '4:00 PM', label: '4:00 PM', period: 'Evening Service', color: 'text-orange-800 bg-orange-50 border-orange-200' },
  { slot: '7:00 PM', label: '7:00 PM', period: 'Night Service', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
] as const;

export const PatientMenu: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMealSession, setSelectedMealSession] = useState<'COMMON MENU' | 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'TEA / MILK' | 'SNACKS' | 'ALL'>('COMMON MENU');
  
  // Cart structure for meal sessions: { [meal_type]: { [menu_id]: quantity } }
  const [cartByMeal, setCartByMeal] = useState<{ [mealType: string]: { [menuId: number]: number } }>({
    Breakfast: {},
    Lunch: {},
    Dinner: {},
    'Tea / Milk': {},
    Snacks: {},
  });

  // Dedicated time-slot cart for Tea/Milk and Coffee items: { [menu_id]: { [slot]: quantity } }
  const [teaSlotsCart, setTeaSlotsCart] = useState<{ [menuId: number]: { [slot: string]: number } }>({});

  const [advanceBalance, setAdvanceBalance] = useState<number>(0);
  const [isOrderingLocked, setIsOrderingLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mealSessions: Array<{ label: string; value: string; icon: any; categoryFilter: Category | 'ALL' }> = [
    { label: 'Common Menu', value: 'Common Menu', icon: Sparkles, categoryFilter: 'COMMON MENU' },
    { label: 'Breakfast', value: 'Breakfast', icon: Coffee, categoryFilter: 'BREAKFAST' },
    { label: 'Lunch', value: 'Lunch', icon: Sun, categoryFilter: 'LUNCH' },
    { label: 'Dinner', value: 'Dinner', icon: Moon, categoryFilter: 'DINNER' },
    { label: 'Tea / Milk', value: 'Tea / Milk', icon: Coffee, categoryFilter: 'TEA / MILK' },
    { label: 'Snacks', value: 'Snacks', icon: Cookie, categoryFilter: 'SNACKS' },
    { label: 'All Items', value: 'ALL', icon: Utensils, categoryFilter: 'ALL' },
  ];

  const fetchProfileAndMenu = async () => {
    try {
      const [menuRes, statusRes, profileRes] = await Promise.all([
        api.get('/patient/menu'),
        api.get('/patient/system-status'),
        api.get('/patient/profile'),
      ]);
      setMenuItems(menuRes.data || []);
      setIsOrderingLocked(Boolean(statusRes.data?.is_ordering_locked));
      setAdvanceBalance(profileRes.data?.advance_balance || 0);
    } catch (err: any) {
      setError('Failed to load menu items and profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndMenu();

    if (socket) {
      socket.on('ordering_status_changed', (data: { is_ordering_locked: boolean }) => {
        setIsOrderingLocked(data.is_ordering_locked);
      });

      socket.on('patient_balance_updated', (data: { advance_balance: number }) => {
        setAdvanceBalance(data.advance_balance);
      });

      return () => {
        socket.off('ordering_status_changed');
        socket.off('patient_balance_updated');
      };
    }
  }, [socket]);

  // Helper to identify Tea / Milk & Coffee items
  const isTeaMilkOrCoffee = (item: MenuItem): boolean => {
    const cat = (item.category || '').trim().toUpperCase();
    if (cat === 'TEA / MILK' || cat === 'TEA/MILK' || cat === 'TEA' || cat === 'COFFEE') return true;
    const name = (item.item_name || '').trim().toLowerCase();
    if (/\b(tea|coffee|milk|boost|horlicks)\b/i.test(name)) return true;
    return false;
  };

  // Current active meal tab name
  const currentMealName = selectedMealSession === 'ALL' ? 'Breakfast' : selectedMealSession === 'TEA / MILK' ? 'Tea / Milk' : selectedMealSession.charAt(0) + selectedMealSession.slice(1).toLowerCase();

  const handleQtyChange = (menu_id: number, delta: number, targetMeal: string) => {
    if (isOrderingLocked) return;

    setCartByMeal((prev) => {
      const mealCart = prev[targetMeal] || {};
      const currentQty = mealCart[menu_id] || 0;
      const nextQty = Math.max(0, currentQty + delta);

      const updatedMealCart = { ...mealCart };
      if (nextQty === 0) {
        delete updatedMealCart[menu_id];
      } else {
        updatedMealCart[menu_id] = nextQty;
      }

      return {
        ...prev,
        [targetMeal]: updatedMealCart,
      };
    });
  };

  // Quantity change for Tea/Milk and Coffee items with specific serving time slots
  const handleTeaSlotQtyChange = (menu_id: number, slot: string, delta: number) => {
    if (isOrderingLocked) return;

    setTeaSlotsCart((prev) => {
      const itemSlots = prev[menu_id] || {};
      const currentQty = itemSlots[slot] || 0;
      const nextQty = Math.max(0, currentQty + delta);

      const updatedItemSlots = { ...itemSlots };
      if (nextQty === 0) {
        delete updatedItemSlots[slot];
      } else {
        updatedItemSlots[slot] = nextQty;
      }

      const updated = { ...prev };
      if (Object.keys(updatedItemSlots).length === 0) {
        delete updated[menu_id];
      } else {
        updated[menu_id] = updatedItemSlots;
      }
      return updated;
    });
  };

  // Calculate total price across all meal sessions and tea time slots
  const calculateGrandTotal = () => {
    let grandTotal = 0;

    // Regular meals (exclude 'Tea / Milk' key from cartByMeal to prevent any conflict)
    Object.entries(cartByMeal).forEach(([mealType, mealCart]) => {
      if (mealType === 'Tea / Milk') return;
      Object.entries(mealCart).forEach(([menuIdStr, qty]) => {
        const item = menuItems.find((m) => m.menu_id === Number(menuIdStr));
        if (item) {
          grandTotal += item.price * qty;
        }
      });
    });

    // Tea / Milk and Coffee items across all selected serving times
    Object.entries(teaSlotsCart).forEach(([menuIdStr, slots]) => {
      const item = menuItems.find((m) => m.menu_id === Number(menuIdStr));
      const price = item?.price || 0;
      Object.values(slots).forEach((qty) => {
        grandTotal += price * qty;
      });
    });

    return grandTotal;
  };

  // Calculate total item count across all meal sessions and tea time slots
  const calculateTotalItemCount = () => {
    let count = 0;
    Object.entries(cartByMeal).forEach(([mealType, mealCart]) => {
      if (mealType === 'Tea / Milk') return;
      Object.values(mealCart).forEach((qty) => {
        count += qty;
      });
    });

    Object.values(teaSlotsCart).forEach((slots) => {
      Object.values(slots).forEach((qty) => {
        count += qty;
      });
    });

    return count;
  };

  const handlePlaceOrder = async () => {
    setError(null);
    setSuccessMsg(null);

    if (isOrderingLocked) {
      setError('Ordering is currently closed by the admin. Please try again later.');
      return;
    }

    const grandTotal = calculateGrandTotal();
    if (grandTotal === 0) {
      setError('Please select at least one item before placing an order.');
      return;
    }

    if (advanceBalance < grandTotal) {
      setError(`Insufficient advance balance! Your available balance is ₹${advanceBalance}, but your order total is ₹${grandTotal}. Please ask Admin to recharge your balance.`);
      return;
    }

    // Format multi-meal order payload: [{ meal_type, serving_time, items: [{ menu_id, quantity, serving_time }] }]
    const mealsPayload: Array<{
      meal_type: string;
      serving_time?: string;
      items: Array<{ menu_id: number; quantity: number; serving_time?: string }>;
    }> = [];

    // 1. Regular meal sessions (Breakfast, Lunch, Dinner, Snacks)
    Object.entries(cartByMeal).forEach(([mealType, mealCart]) => {
      if (mealType === 'Tea / Milk') return;
      const mealItems = Object.entries(mealCart).map(([menuIdStr, qty]) => ({
        menu_id: Number(menuIdStr),
        quantity: qty,
      }));

      if (mealItems.length > 0) {
        mealsPayload.push({
          meal_type: mealType,
          items: mealItems,
        });
      }
    });

    // 2. Tea / Milk and Coffee items grouped separately by each selected serving time slot
    TEA_TIME_SLOTS.forEach(({ slot }) => {
      const slotItems: Array<{ menu_id: number; quantity: number; serving_time: string }> = [];

      Object.entries(teaSlotsCart).forEach(([menuIdStr, slots]) => {
        const qty = slots[slot] || 0;
        if (qty > 0) {
          slotItems.push({
            menu_id: Number(menuIdStr),
            quantity: qty,
            serving_time: slot,
          });
        }
      });

      if (slotItems.length > 0) {
        mealsPayload.push({
          meal_type: 'Tea / Milk',
          serving_time: slot,
          items: slotItems,
        });
      }
    });

    setSubmitting(true);
    try {
      const response = await api.post('/patient/orders', {
        meals: mealsPayload,
      });

      setSuccessMsg(`Orders placed successfully for ${mealsPayload.length} meal/serving slot(s)! Amount ₹${grandTotal} deducted from advance balance.`);
      setAdvanceBalance(response.data.remaining_balance);
      setCartByMeal({
        Breakfast: {},
        Lunch: {},
        Dinner: {},
        'Tea / Milk': {},
        Snacks: {},
      });
      setTeaSlotsCart({});

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
    selectedMealSession === 'ALL'
      ? menuItems
      : menuItems.filter((item) => {
          const cat = (item.category || '').trim().toUpperCase();
          const sel = selectedMealSession.trim().toUpperCase();
          if (cat === 'COMMON MENU' || cat === 'COMMONMENU') {
            return true;
          }
          return cat === sel || cat.replace(/\s+/g, '') === sel.replace(/\s+/g, '');
        });

  const isLowBalance = advanceBalance < 500;
  const grandTotal = calculateGrandTotal();
  const totalItemCount = calculateTotalItemCount();

  return (
    <div className="space-y-5 sm:space-y-6 pb-32">
      {/* Header with Balance Badge */}
      <div className="bg-white p-5 rounded-2xl border border-procare-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            PROCARE PHYSIOTHERAPY & REHABILITATION CENTRE
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <div className="p-1.5 rounded-lg bg-celadon text-slate-950">
              <Utensils className="w-5 h-5" />
            </div>
            PROCARE CANTEEN MEAL MENU
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Order Breakfast, Lunch, and Dinner separately or together in one transaction.
          </p>
        </div>

        {/* Available Advance Balance Display Card */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 w-full md:w-auto shrink-0 ${
          isLowBalance ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-400/50' : 'bg-procare-50 border-procare-300 text-procare-950'
        }`}>
          <div className={`p-2.5 rounded-xl font-bold ${isLowBalance ? 'bg-rose-600 text-white' : 'bg-celadon text-slate-950'}`}>
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-procare-800">Available Advance Balance</div>
            <div className="text-lg font-black font-mono text-procare-950">₹{advanceBalance}</div>
          </div>
        </div>
      </div>

      {/* LOW BALANCE ALERT BANNER (< ₹500) */}
      {isLowBalance && (
        <div className="p-4 bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs rounded-2xl font-bold flex items-center gap-3 shadow-xs animate-in fade-in">
          <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm text-rose-900">⚠️ LOW ADVANCE BALANCE ALERT (&lt; ₹500)</h3>
            <p className="text-xs text-rose-800 font-semibold">
              Your remaining advance balance is <strong>₹{advanceBalance}</strong>, which is below ₹500. Please ask the ProCare canteen admin to recharge your account balance so you can continue ordering meals.
            </p>
          </div>
        </div>
      )}

      {/* ORDERING LOCKED WARNING BANNER */}
      {isOrderingLocked && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm rounded-2xl font-bold flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-rose-600 text-white rounded-xl">
            <Lock className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="font-black text-base text-rose-950">Ordering is currently closed</h3>
            <p className="text-xs font-semibold text-rose-800 mt-0.5">
              The admin has temporarily locked food ordering. Please wait until the admin unlocks ordering.
            </p>
          </div>
        </div>
      )}

      {/* MEAL-WISE SESSION NAVIGATION TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {mealSessions.map((session) => {
          const Icon = session.icon;
          const keyVal = session.categoryFilter;
          const isSelected = selectedMealSession === keyVal;

          // Count items in cart for this meal session
          const sessionMealName = session.value === 'ALL' ? 'Breakfast' : session.value;
          const countInMeal =
            session.value === 'Tea / Milk'
              ? Object.values(teaSlotsCart).reduce(
                  (sum, slots) => sum + Object.values(slots).reduce((a, b) => a + b, 0),
                  0
                )
              : Object.values(cartByMeal[sessionMealName] || {}).reduce((a, b) => a + b, 0);

          return (
            <button
              key={session.value}
              onClick={() => setSelectedMealSession(keyVal as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-celadon text-slate-950 shadow-xs ring-1 ring-procare-400'
                  : 'bg-white text-slate-700 hover:bg-procare-50 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-procare-700'}`} />
              <span>{session.label}</span>
              {countInMeal > 0 && (
                <span className="bg-procare-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-black">
                  {countInMeal}
                </span>
              )}
            </button>
          );
        })}
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
          No items found in "{selectedMealSession}" section.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isAvailable = item.is_available_today && !isOrderingLocked;
            const currentMealCart = cartByMeal[currentMealName] || {};
            const qtyInCart = currentMealCart[item.menu_id] || 0;

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
                      status={isOrderingLocked ? 'UNAVAILABLE' : isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
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

                  {!item.is_available_today && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/80 mb-2 font-medium">
                      Available on: {item.available_days.join(', ')}
                    </div>
                  )}
                </div>

                {/* Patient Quantity Selector */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isAvailable ? (
                    item.category === 'COMMON MENU' ? (
                      <div className="space-y-2 w-full">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Select Quantities Per Meal Session:
                        </div>
                        {[
                          { mealName: 'Breakfast', icon: Coffee, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                          { mealName: 'Lunch', icon: Sun, color: 'text-orange-700 bg-orange-50 border-orange-200' },
                          { mealName: 'Dinner', icon: Moon, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                        ].map(({ mealName, icon: MealIcon, color }) => {
                          const mealCart = cartByMeal[mealName] || {};
                          const q = mealCart[item.menu_id] || 0;
                          return (
                            <div key={mealName} className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded-md border ${color}`}>
                                  <MealIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800">{mealName} Qty</span>
                              </div>
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.menu_id, -1, mealName)}
                                  disabled={q === 0 || isOrderingLocked}
                                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 py-1 text-xs font-black text-slate-900 min-w-[1.75rem] text-center font-mono">
                                  {q}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.menu_id, 1, mealName)}
                                  disabled={isOrderingLocked}
                                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : isTeaMilkOrCoffee(item) ? (
                      <div className="space-y-2.5 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Choose Serving Time (Today):
                          </span>
                          {(() => {
                            const itemSlots = teaSlotsCart[item.menu_id] || {};
                            const totalItemQty = Object.values(itemSlots).reduce((a, b) => a + b, 0);
                            return totalItemQty > 0 ? (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                                {totalItemQty} cups selected
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TEA_TIME_SLOTS.map(({ slot, label, period }) => {
                            const itemSlots = teaSlotsCart[item.menu_id] || {};
                            const q = itemSlots[slot] || 0;
                            return (
                              <div
                                key={slot}
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                  q > 0
                                    ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-300'
                                    : 'bg-slate-50/80 border-slate-200/80'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    {label}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-medium">{period}</span>
                                </div>

                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => handleTeaSlotQtyChange(item.menu_id, slot, -1)}
                                    disabled={q === 0 || isOrderingLocked}
                                    className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                                    aria-label={`Decrease ${label}`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 py-1 text-xs font-black text-slate-900 min-w-[1.5rem] text-center font-mono">
                                    {q}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleTeaSlotQtyChange(item.menu_id, slot, 1)}
                                    disabled={isOrderingLocked}
                                    className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                                    aria-label={`Increase ${label}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 w-full justify-between">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.menu_id, -1, currentMealName)}
                            disabled={qtyInCart === 0 || isOrderingLocked}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 py-1.5 text-xs font-black text-slate-800 min-w-[2rem] text-center font-mono">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.menu_id, 1, currentMealName)}
                            disabled={isOrderingLocked}
                            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isOrderingLocked}
                          onClick={() => handleQtyChange(item.menu_id, qtyInCart > 0 ? -qtyInCart : 1, currentMealName)}
                          className={`text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                            qtyInCart > 0
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                          }`}
                        >
                          {qtyInCart > 0 ? `Added for ${currentMealName} ✓` : `Add for ${currentMealName}`}
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-rose-500 font-extrabold italic">
                      {isOrderingLocked ? 'Ordering Closed' : 'Unavailable Today'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Order Cart Bar with Advance Balance Summary & Selected Serving Times */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-72 max-w-4xl mx-auto bg-procare-950/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-procare-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-celadon text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-procare-200 font-semibold">
                Items Selected: <strong className="text-white">{totalItemCount}</strong> | Balance: <strong className="text-celadon font-bold">₹{advanceBalance}</strong>
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                Order Total: ₹{grandTotal}{' '}
                <span className="text-xs font-semibold text-procare-300">
                  (Remaining Balance: ₹{advanceBalance - grandTotal})
                </span>
              </div>

              {/* Breakdown of Selected Meal Sessions & Serving Times */}
              <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                {Object.entries(cartByMeal).map(([mName, mCart]) => {
                  if (mName === 'Tea / Milk') return null;
                  const cnt = Object.values(mCart).reduce((a, b) => a + b, 0);
                  if (cnt === 0) return null;
                  return (
                    <span key={mName} className="bg-procare-900 border border-procare-700 px-2 py-0.5 rounded-md font-semibold text-procare-100">
                      {mName}: <strong>{cnt}</strong>
                    </span>
                  );
                })}
                {TEA_TIME_SLOTS.map(({ slot }) => {
                  let slotCount = 0;
                  Object.values(teaSlotsCart).forEach((slots) => {
                    slotCount += slots[slot] || 0;
                  });
                  if (slotCount === 0) return null;
                  return (
                    <span key={slot} className="bg-amber-900/90 border border-amber-500/60 px-2 py-0.5 rounded-md font-semibold text-amber-200 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-300" />
                      Tea/Coffee ({slot}): <strong>{slotCount}</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || isOrderingLocked || advanceBalance < grandTotal}
            className="w-full sm:w-auto bg-celadon hover:bg-procare-400 active:bg-procare-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {submitting
              ? 'Placing Order & Deducting Balance...'
              : isOrderingLocked
              ? 'Ordering Closed'
              : advanceBalance < grandTotal
              ? 'Insufficient Balance'
              : 'PLACE MEAL ORDERS NOW'}
          </button>
        </div>
      )}
    </div>
  );
};
