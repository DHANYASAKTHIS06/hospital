import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { MenuItem, Category } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Utensils,
  AlertCircle,
  Lock,
  Wallet,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Sparkles,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getKolkataDatesFrontend, DAYS_OF_WEEK_TA } from '../utils/dateUtils';

export const TEA_TIME_SLOTS = [
  { slot: '7:00 AM', label: '7:00 AM', periodKey: 'morningService', periodEn: 'Morning Service', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  { slot: '11:00 AM', label: '11:00 AM', periodKey: 'midMorningService', periodEn: 'Mid-Morning Service', color: 'text-sky-800 bg-sky-50 border-sky-200' },
  { slot: '4:00 PM', label: '4:00 PM', periodKey: 'eveningTeaService', periodEn: 'Evening Tea Service', color: 'text-orange-800 bg-orange-50 border-orange-200' },
  { slot: '7:00 PM', label: '7:00 PM', periodKey: 'nightMilkService', periodEn: 'Night Milk / Hot Beverage', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
] as const;

export const PatientMenu: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { t, language, translateFood, translateCategory, translateSlot } = useLanguage();

  const isTa = language === 'ta';

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
  const [patientInfo, setPatientInfo] = useState<{ name?: string; patient_id?: string; room_number?: string } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOrderingLocked, setIsOrderingLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const kolkataDates = getKolkataDatesFrontend();

  const mealSessions: Array<{ label: string; value: string; icon: any; categoryFilter: Category | 'ALL' }> = [
    { label: isTa ? 'பொது மெனு' : 'Common Menu', value: 'Common Menu', icon: Sparkles, categoryFilter: 'COMMON MENU' },
    { label: isTa ? 'காலை உணவு' : 'Breakfast', value: 'Breakfast', icon: Coffee, categoryFilter: 'BREAKFAST' },
    { label: isTa ? 'மதிய உணவு' : 'Lunch', value: 'Lunch', icon: Sun, categoryFilter: 'LUNCH' },
    { label: isTa ? 'இரவு உணவு' : 'Dinner', value: 'Dinner', icon: Moon, categoryFilter: 'DINNER' },
    { label: isTa ? 'தேநீர் / பால்' : 'Tea / Milk', value: 'Tea / Milk', icon: Coffee, categoryFilter: 'TEA / MILK' },
    { label: isTa ? 'சிற்றுண்டி' : 'Snacks', value: 'Snacks', icon: Cookie, categoryFilter: 'SNACKS' },
    { label: isTa ? 'அனைத்து உணவுகள்' : 'All Items', value: 'ALL', icon: Utensils, categoryFilter: 'ALL' },
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
      setPatientInfo(profileRes.data || null);
    } catch (err: any) {
      setError(isTa ? 'மெனு உருப்படிகளை ஏற்றுவதில் தோல்வி.' : 'Failed to load menu items and profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndMenu();

    if (socket) {
      const handleLockChange = (data: { is_ordering_locked: boolean }) => {
        setIsOrderingLocked(data.is_ordering_locked);
      };
      const handleBalanceUpdate = (data: { advance_balance: number }) => {
        setAdvanceBalance(data.advance_balance);
      };

      socket.on('ordering_status_changed', handleLockChange);
      socket.on('patient_balance_updated', handleBalanceUpdate);

      return () => {
        socket.off('ordering_status_changed', handleLockChange);
        socket.off('patient_balance_updated', handleBalanceUpdate);
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

  const buildMealsPayload = () => {
    const mealsPayload: Array<{
      meal_type: string;
      serving_time?: string;
      items: Array<{
        menu_id: number;
        quantity: number;
        serving_time?: string;
        item_name?: string;
        unit_price?: number;
        subtotal?: number;
      }>;
    }> = [];

    // 1. Regular meal sessions (Breakfast, Lunch, Dinner, Snacks)
    Object.entries(cartByMeal).forEach(([mealType, mealCart]) => {
      if (mealType === 'Tea / Milk') return;
      const mealItems = Object.entries(mealCart).map(([menuIdStr, qty]) => {
        const item = menuItems.find((m) => m.menu_id === Number(menuIdStr));
        return {
          menu_id: Number(menuIdStr),
          quantity: qty,
          item_name: item?.item_name || 'Food Item',
          unit_price: item?.price || 0,
          subtotal: (item?.price || 0) * qty,
        };
      });

      if (mealItems.length > 0) {
        mealsPayload.push({
          meal_type: mealType,
          items: mealItems,
        });
      }
    });

    // 2. Tea / Milk and Coffee items grouped separately by each selected serving time slot
    TEA_TIME_SLOTS.forEach(({ slot }) => {
      const slotItems: Array<{
        menu_id: number;
        quantity: number;
        serving_time: string;
        item_name?: string;
        unit_price?: number;
        subtotal?: number;
      }> = [];

      Object.entries(teaSlotsCart).forEach(([menuIdStr, slots]) => {
        const qty = slots[slot] || 0;
        if (qty > 0) {
          const item = menuItems.find((m) => m.menu_id === Number(menuIdStr));
          slotItems.push({
            menu_id: Number(menuIdStr),
            quantity: qty,
            serving_time: slot,
            item_name: item?.item_name || 'Hot Beverage',
            unit_price: item?.price || 0,
            subtotal: (item?.price || 0) * qty,
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

    return mealsPayload;
  };

  const handleOpenReviewModal = () => {
    setError(null);
    setSuccessMsg(null);

    if (isOrderingLocked) {
      setError(t('orderingLockedMsg'));
      return;
    }

    const grandTotal = calculateGrandTotal();
    if (grandTotal === 0) {
      setError(t('emptyCartNotice'));
      return;
    }

    if (advanceBalance < grandTotal) {
      setError(
        isTa
          ? `போதிய முன்பண இருப்பு இல்லை! உங்கள் இருப்பு ₹${advanceBalance}, ஆனால் ஆர்டர் தொகை ₹${grandTotal}. இருப்பை ரீசார்ஜ் செய்ய நிர்வாகியிடம் கேட்கவும்.`
          : `Insufficient advance balance! Your available balance is ₹${advanceBalance}, but your order total is ₹${grandTotal}. Please ask Admin to recharge your balance.`
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmAndPlaceOrder = async () => {
    setError(null);
    setSuccessMsg(null);

    const mealsPayload = buildMealsPayload();
    const grandTotal = calculateGrandTotal();

    setSubmitting(true);
    try {
      const response = await api.post('/patient/orders', {
        meals: mealsPayload,
        delivery_date: kolkataDates.deliveryDate,
      });

      setIsConfirmModalOpen(false);
      setSuccessMsg(
        isTa
          ? 'நாளைக்கான உங்கள் உணவு ஆர்டர் வெற்றிகரமாக வைக்கப்பட்டது.'
          : 'Your food order for tomorrow has been placed successfully.'
      );
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
      setError(err.response?.data?.message || (isTa ? 'ஆர்டர் வைப்பதில் பிழை ஏற்பட்டது.' : 'Failed to place order.'));
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
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            {isTa ? 'அடுத்த நாள் முன்பதிவு உணவு முறை' : 'Next-Day Advance Food Ordering System'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex flex-wrap items-center gap-2 mt-1">
            <div className="p-1.5 rounded-lg bg-celadon text-slate-950">
              <Utensils className="w-5 h-5 text-slate-950" />
            </div>
            <span>
              {isTa
                ? `நாளைக்கான உணவு ஆர்டர் – ${kolkataDates.formattedTomorrowTa}`
                : `Order Food for Tomorrow – ${kolkataDates.formattedTomorrowEn}`}
            </span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {isTa
                ? `விநியோக தேதி: ${kolkataDates.deliveryDate} (${kolkataDates.tomorrowDayTa}) • இன்றைய உணவு ஆர்டர் முடிந்துவிட்டது`
                : `Delivery Date: ${kolkataDates.deliveryDate} (${kolkataDates.tomorrowDay}) • Today's food ordering is closed`}
            </span>
          </p>
        </div>

        {/* Available Advance Balance Display Card */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 w-full md:w-auto shrink-0 ${
            isLowBalance
              ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-400/50'
              : 'bg-procare-50 border-procare-300 text-procare-950'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl font-bold ${
              isLowBalance ? 'bg-rose-600 text-white' : 'bg-celadon text-slate-950'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-procare-800">
              {t('advanceBalance')}
            </div>
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
            <h3 className="font-extrabold text-sm text-rose-900">
              ⚠️ {isTa ? 'குறைந்த முன்பண இருப்பு எச்சரிக்கை (< ₹500)' : 'LOW ADVANCE BALANCE ALERT (< ₹500)'}
            </h3>
            <p className="text-xs text-rose-800 font-semibold">
              {isTa
                ? `உங்கள் மீதமுள்ள முன்பண இருப்பு ₹${advanceBalance} ஆக உள்ளது, இது ₹500-க்குக் குறைவாக உள்ளது. உணவை தொடர்ந்து ஆர்டர் செய்ய தயவுசெய்து கேன்டீன் நிர்வாகியிடம் இருப்பை ரீசார்ஜ் செய்யுமாறு கேட்கவும்.`
                : `Your remaining advance balance is ₹${advanceBalance}, which is below ₹500. Please ask the ProCare canteen admin to recharge your account balance so you can continue ordering meals.`}
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
            <h3 className="font-black text-base text-rose-950">
              {isTa ? 'ஆர்டர் தற்போது மூடப்பட்டுள்ளது' : 'Ordering is currently closed'}
            </h3>
            <p className="text-xs font-semibold text-rose-800 mt-0.5">
              {t('orderingLockedMsg')}
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
          {isTa ? 'மெனு உருப்படிகள் ஏற்றப்படுகின்றன...' : 'Loading canteen menu items...'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs font-medium bg-white rounded-2xl border border-slate-200/80">
          {isTa
            ? `"${translateCategory(selectedMealSession)}" பிரிவில் உணவுகள் எதுவும் கிடைக்கவில்லை.`
            : `No items found in "${selectedMealSession}" section.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isAvailable =
              !isOrderingLocked &&
              (item.is_available_tomorrow !== undefined
                ? item.is_available_tomorrow
                : Boolean(item.availability && item.available_days?.includes(kolkataDates.tomorrowDay)));
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
                        {translateCategory(item.category)}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{translateFood(item.item_name)}</h3>
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
                    <span className="font-semibold">
                      {t('portion')}: <strong className="text-slate-800 font-bold">{item.quantity}</strong>
                    </span>
                    <span className="text-base font-black text-blue-700">₹{item.price}</span>
                  </div>

                  {!isAvailable && (
                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-xl border border-rose-200/80 mb-2 font-medium">
                      {isTa
                        ? `நாளை (${kolkataDates.tomorrowDayTa}) கிடைக்காது`
                        : `Not Available Tomorrow (${kolkataDates.tomorrowDay})`}
                    </div>
                  )}
                </div>

                {/* Patient Quantity Selector */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {isAvailable ? (
                    item.category === 'COMMON MENU' ? (
                      <div className="space-y-2 w-full">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          {isTa ? 'உணவு அமர்வு வாரியாக அளவைத் தேர்ந்தெடுக்கவும்:' : 'Select Quantities Per Meal Session:'}
                        </div>
                        {[
                          { mealName: 'Breakfast', labelTa: 'காலை உணவு', icon: Coffee, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                          { mealName: 'Lunch', labelTa: 'மதிய உணவு', icon: Sun, color: 'text-orange-700 bg-orange-50 border-orange-200' },
                          { mealName: 'Dinner', labelTa: 'இரவு உணவு', icon: Moon, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                        ].map(({ mealName, labelTa, icon: MealIcon, color }) => {
                          const mealCart = cartByMeal[mealName] || {};
                          const q = mealCart[item.menu_id] || 0;
                          return (
                            <div key={mealName} className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded-md border ${color}`}>
                                  <MealIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-extrabold text-slate-800">
                                  {isTa ? `${labelTa} அளவு` : `${mealName} Qty`}
                                </span>
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
                            {t('chooseServingTime')}
                          </span>
                          {(() => {
                            const itemSlots = teaSlotsCart[item.menu_id] || {};
                            const totalItemQty = Object.values(itemSlots).reduce((a, b) => a + b, 0);
                            return totalItemQty > 0 ? (
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                                {totalItemQty} {isTa ? 'கப்புகள்' : 'cups selected'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                {t('required')}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TEA_TIME_SLOTS.map(({ slot, label, periodKey, periodEn }) => {
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
                                    {translateSlot(label)}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-medium">
                                    {isTa ? t(periodKey) : periodEn}
                                  </span>
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
                          {qtyInCart > 0
                            ? isTa
                              ? `${translateCategory(currentMealName)} சேர்க்கப்பட்டது ✓`
                              : `Added for ${currentMealName} ✓`
                            : isTa
                            ? `${translateCategory(currentMealName)} சேர்க்கவும்`
                            : `Add for ${currentMealName}`}
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-rose-600 font-extrabold italic bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                      {isOrderingLocked
                        ? (isTa ? 'ஆர்டர் மூடப்பட்டுள்ளது' : 'Ordering Closed')
                        : (isTa ? `நாளை (${kolkataDates.tomorrowDayTa}) கிடைக்காது` : `Not Available Tomorrow (${kolkataDates.tomorrowDay})`)}
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
                {isTa ? 'தேர்ந்தெடுக்கப்பட்ட உருப்படிகள்' : 'Items Selected'}: <strong className="text-white">{totalItemCount}</strong> | {t('advanceBalance')}: <strong className="text-celadon font-bold">₹{advanceBalance}</strong>
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                {t('orderTotal')}: ₹{grandTotal}{' '}
                <span className="text-xs font-semibold text-procare-300">
                  ({t('remaining')}: ₹{advanceBalance - grandTotal})
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
                      {translateCategory(mName)}: <strong>{cnt}</strong>
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
                      {isTa ? 'தேநீர்/காபி' : 'Tea/Coffee'} ({translateSlot(slot)}): <strong>{slotCount}</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenReviewModal}
            disabled={submitting || isOrderingLocked || advanceBalance < grandTotal}
            className="w-full sm:w-auto bg-celadon hover:bg-procare-400 active:bg-procare-500 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {submitting
              ? isTa
                ? 'ஆர்டர் செய்யப்படுகிறது...'
                : 'Placing Order & Deducting Balance...'
              : isOrderingLocked
              ? isTa
                ? 'ஆர்டர் மூடப்பட்டுள்ளது'
                : 'Ordering Closed'
              : advanceBalance < grandTotal
              ? isTa
                ? 'போதிய இருப்பு இல்லை'
                : 'Insufficient Balance'
              : isTa
              ? 'நாளைக்கான ஆர்டரை மதிப்பாய்வு செய்து உறுதிப்படுத்துக'
              : 'REVIEW & CONFIRM FOR TOMORROW'}
          </button>
        </div>
      )}

      {/* ORDER SUMMARY CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-celadon text-slate-950 rounded-2xl shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {isTa ? 'நாளைக்கான உணவு ஆர்டர் சுருக்கம்' : 'Order Summary for Tomorrow'}
                  </h3>
                  <p className="text-xs text-procare-800 font-bold mt-0.5">
                    {isTa ? 'அடுத்த நாள் முன்பதிவு உறுதிப்படுத்தல்' : 'Strict Next-Day Advance Food Order Confirmation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Date & Patient Info Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isTa ? 'உணவு விநியோக தேதி (நாளை)' : 'Food Delivery Date (Tomorrow)'}</span>
                </div>
                <div className="text-sm font-black text-emerald-950">
                  {isTa ? kolkataDates.formattedTomorrowTa : kolkataDates.formattedTomorrowEn}
                </div>
                <div className="text-[11px] text-emerald-800 font-bold">
                  {isTa ? `தேதி: ${kolkataDates.deliveryDate}` : `Date: ${kolkataDates.deliveryDate}`}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isTa ? 'நோயாளி விவரங்கள்' : 'Patient Details'}</span>
                </div>
                <div className="text-sm font-black text-slate-900 truncate">
                  {patientInfo?.name || 'Patient'} ({patientInfo?.patient_id || 'ID'})
                </div>
                <div className="text-[11px] text-slate-600 font-bold">
                  {isTa ? 'அறை எண்' : 'Room Number'}: #{patientInfo?.room_number || 'N/A'}
                </div>
              </div>
            </div>

            {/* Ordered Food Items Breakdown */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                {isTa ? 'தேர்ந்தெடுக்கப்பட்ட உணவுகள் & அளவுகள்:' : 'Selected Meals & Quantities:'}
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                {buildMealsPayload().map((meal, mIdx) => (
                  <div key={mIdx} className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
                      <span className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-procare-700" />
                        <span>{translateCategory(meal.meal_type)}</span>
                        {meal.serving_time && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                            {translateSlot(meal.serving_time)}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1 pl-2">
                      {meal.items.map((it, itIdx) => (
                        <div key={itIdx} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">
                            {translateFood(it.item_name || '')}{' '}
                            <strong className="text-slate-950 font-black">× {it.quantity}</strong>
                            {it.serving_time && (
                              <span className="ml-1 text-[10px] text-amber-800 font-bold">
                                ({translateSlot(it.serving_time)})
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{it.subtotal || (it.unit_price || 0) * it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total & Advance Balance Summary */}
            <div className="bg-procare-50 p-4 rounded-2xl border border-procare-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>{isTa ? 'தற்போதைய முன்பண இருப்பு:' : 'Current Advance Balance:'}</span>
                <span className="font-mono font-bold text-slate-900">₹{advanceBalance}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-950 border-t border-procare-200/80 pt-2">
                <span>{isTa ? 'நாளைக்கான ஆர்டர் மொத்தத் தொகை:' : 'Tomorrow Order Grand Total:'}</span>
                <span className="font-mono text-base text-blue-700 font-black">₹{grandTotal}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-extrabold text-emerald-800 border-t border-procare-200/80 pt-1.5">
                <span>{isTa ? 'ஆர்டருக்குப் பின் மீதமிருக்கும் இருப்பு:' : 'Remaining Balance After Order:'}</span>
                <span className="font-mono font-black">₹{advanceBalance - grandTotal}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={submitting}
                className="w-full sm:w-1/3 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                {isTa ? 'தேர்வை திருத்து' : 'Edit Selection'}
              </button>

              <button
                type="button"
                onClick={handleConfirmAndPlaceOrder}
                disabled={submitting || advanceBalance < grandTotal}
                className="w-full sm:w-2/3 bg-celadon hover:bg-procare-400 active:bg-procare-500 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>{isTa ? 'ஆர்டர் உறுதிப்படுத்தப்படுகிறது...' : 'Confirming & Saving Order...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{isTa ? 'நாளைக்கான ஆர்டரை உறுதிசெய்க' : 'Confirm & Place Order for Tomorrow'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
