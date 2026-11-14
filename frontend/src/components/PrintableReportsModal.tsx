import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { FoodOrder, FoodItemToPrepare } from '../types';
import {
  Printer,
  X,
  ChefHat,
  Building2,
  Calendar,
  Clock,
  Coffee,
  Sun,
  Utensils,
  Moon,
  Cookie,
  RefreshCw,
} from 'lucide-react';

interface PrintableReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'ROOM_WISE' | 'ITEMS_TO_PREPARE';
  orders: FoodOrder[];
  foodItemsToPrepare: FoodItemToPrepare[];
  autoPrint?: boolean;
}

interface KitchenItem {
  menu_id: number;
  item_name: string;
  category: string;
  portion_size: string;
  unit: string;
  total_quantity: number;
  order_count?: number;
}

interface KitchenSection {
  category: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  items: KitchenItem[];
  subtotal: number;
}

export const PrintableReportsModal: React.FC<PrintableReportsModalProps> = ({
  isOpen,
  onClose,
  reportType,
  orders,
  foodItemsToPrepare,
  autoPrint = true,
}) => {
  const [kitchenReportData, setKitchenReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const { t, language, translateFood, translateSlot } = useLanguage();

  const isTa = language === 'ta';

  // Fetch direct database-calculated kitchen report whenever modal is opened for items to prepare
  const fetchKitchenReportData = async () => {
    try {
      setLoadingReport(true);
      const res = await api.get('/admin/kitchen-report');
      if (res.data) {
        setKitchenReportData(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch /admin/kitchen-report, relying on active orders prop:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (isOpen && reportType === 'ITEMS_TO_PREPARE') {
      fetchKitchenReportData();
    }
  }, [isOpen, reportType]);

  // Auto-trigger browser print dialog when Kitchen Report is opened
  useEffect(() => {
    if (isOpen && reportType === 'ITEMS_TO_PREPARE' && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reportType, autoPrint]);

  if (!isOpen) return null;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString(isTa ? 'ta-IN' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Filter valid active orders: strictly exclude PENDING, CANCELLED, DELIVERED, and cleared orders
  const validActiveOrders = (orders || []).filter((o) => {
    const status = (o.order_status || '').toUpperCase().trim();
    const isCleared = (o as any).is_cleared_from_active_view === true;
    return !isCleared && status !== 'PENDING' && status !== 'CANCELLED' && status !== 'DELIVERED';
  });

  // ----------------------------------------------------
  // ROOM-WISE DATA CALCULATION
  // ----------------------------------------------------
  const roomMap = new Map<string, Array<{ order: FoodOrder; patient_name: string; patient_id: string }>>();
  validActiveOrders.forEach((order) => {
    const room = order.room_number || (isTa ? 'அறை ஒதுக்கப்படவில்லை' : 'Unassigned');
    if (!roomMap.has(room)) {
      roomMap.set(room, []);
    }
    roomMap.get(room)!.push({
      order,
      patient_name: order.patient_name || (isTa ? 'நோயாளி' : 'Patient'),
      patient_id: order.patient_id,
    });
  });

  const sortedRooms = Array.from(roomMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // ----------------------------------------------------
  // KITCHEN PREPARATION SECTIONS (5 Standard Meal Sessions)
  // 1. Tea / Milk
  // 2. Breakfast
  // 3. Lunch
  // 4. Dinner
  // 5. Snacks
  // ----------------------------------------------------
  const standardSectionMeta: Array<{
    key: string;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: 'TEA / MILK',
      title: isTa ? 'தேநீர் / பால் மற்றும் காபி தயாரிப்பு' : 'Tea / Milk and Coffee Preparation',
      desc: isTa
        ? 'சூடான பானங்கள் & பால் சேவை – காலை 7:00, முற்பகல் 11:00, மாலை 4:00 மற்றும் இரவு 7:00 என பிரிக்கப்பட்டுள்ளது'
        : 'Hot Beverages & Milk Service – Separated by 7:00 AM, 11:00 AM, 4:00 PM and 7:00 PM',
      icon: Coffee,
    },
    {
      key: 'BREAKFAST',
      title: isTa ? 'காலை உணவு தயாரிப்பு' : 'Breakfast Preparation',
      desc: isTa
        ? 'காலை உணவு தயாரிப்பு (காலை உணவிற்கான பொது மெனு உருப்படிகள் உட்பட)'
        : 'Morning Meal Preparation (Includes Common Menu items ordered for Breakfast)',
      icon: Sun,
    },
    {
      key: 'LUNCH',
      title: isTa ? 'மதிய உணவு தயாரிப்பு' : 'Lunch Preparation',
      desc: isTa
        ? 'மதிய உணவு தயாரிப்பு (மதிய உணவிற்கான பொது மெனு உருப்படிகள் உட்பட)'
        : 'Afternoon Meal Preparation (Includes Common Menu items ordered for Lunch)',
      icon: Utensils,
    },
    {
      key: 'DINNER',
      title: isTa ? 'இரவு உணவு தயாரிப்பு' : 'Dinner Preparation',
      desc: isTa
        ? 'இரவு உணவு தயாரிப்பு (இரவு உணவிற்கான பொது மெனு உருப்படிகள் உட்பட)'
        : 'Night Meal Preparation (Includes Common Menu items ordered for Dinner)',
      icon: Moon,
    },
    {
      key: 'SNACKS',
      title: isTa ? 'சிற்றுண்டி தயாரிப்பு' : 'Snacks Preparation',
      desc: isTa
        ? 'மாலை சிற்றுண்டிகள் மற்றும் இலகுவான உணவுகள்'
        : 'Evening Snacks & Light Refreshments',
      icon: Cookie,
    },
  ];

  const normalizeSlot = (rawSlot?: string): string => {
    const s = (rawSlot || '').trim().toUpperCase();
    if (/^7(\.00|:00)?\s*AM/i.test(s) || /^07:00/i.test(s)) return '7:00 AM';
    if (/^11(\.00|:00)?\s*AM/i.test(s)) return '11:00 AM';
    if (/^4(\.00|:00)?\s*PM/i.test(s) || /^16:00/i.test(s)) return '4:00 PM';
    if (/^7(\.00|:00)?\s*PM/i.test(s) || /^19:00/i.test(s)) return '7:00 PM';
    return '7:00 AM';
  };

  const normalizeMealCategory = (rawMeal: string, fallbackCat?: string): string => {
    let t = (rawMeal || '').trim().toUpperCase();
    if (!t || t === 'GENERAL' || t === 'COMMON MENU') {
      t = (fallbackCat || 'BREAKFAST').trim().toUpperCase();
    }
    if (/^TEA/i.test(t) || /^MILK/i.test(t) || /^COFFEE/i.test(t)) return 'TEA / MILK';
    if (/^BREAKFAST/i.test(t)) return 'BREAKFAST';
    if (/^LUNCH/i.test(t)) return 'LUNCH';
    if (/^DINNER/i.test(t)) return 'DINNER';
    if (/^SNACK/i.test(t)) return 'SNACKS';
    return 'BREAKFAST';
  };

  // Build lookup map for menu item portion sizes and units from foodItemsToPrepare prop
  const itemMetaMap = new Map<string, { portion_size: string; unit: string; menu_id: number }>();
  (foodItemsToPrepare || []).forEach((f) => {
    const key = f.item_name.trim().toLowerCase();
    const portionSize = f.portion_size || '1 portion';
    let unit = 'Nos';
    if (/ml/i.test(portionSize)) unit = 'ml';
    else if (/plate/i.test(portionSize)) unit = 'Plate(s)';
    else if (/cup/i.test(portionSize)) unit = 'Cup(s)';
    else if (/nos/i.test(portionSize) || /no\b/i.test(portionSize)) unit = 'Nos';

    itemMetaMap.set(key, { portion_size: portionSize, unit, menu_id: f.menu_id });
  });

  // Calculate local aggregation from active orders
  const localPrepMap = new Map<string, KitchenItem>();
  const localTeaSlotMap = new Map<string, {
    menu_id: number;
    item_name: string;
    serving_time: string;
    portion_size: string;
    unit: string;
    total_quantity: number;
  }>();

  validActiveOrders.forEach((o) => {
    const orderCategory = normalizeMealCategory(o.meal_type);

    o.items?.forEach((it) => {
      const itemName = (it.item_name_snapshot || '').trim();
      const cat = orderCategory;
      const meta = itemMetaMap.get(itemName.toLowerCase());
      const portionSize = meta?.portion_size || '1 portion';
      let unit = meta?.unit || 'Nos';
      if (/ml/i.test(portionSize)) unit = 'ml';
      else if (/plate/i.test(portionSize)) unit = 'Plate(s)';
      else if (/cup/i.test(portionSize)) unit = 'Cup(s)';
      else if (/nos/i.test(portionSize) || /no\b/i.test(portionSize)) unit = 'Nos';

      if (cat === 'TEA / MILK') {
        const slot = normalizeSlot(it.serving_time || o.serving_time || '7:00 AM');
        const key = `${slot}::${itemName.toLowerCase()}`;
        const existing = localTeaSlotMap.get(key);
        if (existing) {
          existing.total_quantity += it.quantity;
        } else {
          localTeaSlotMap.set(key, {
            menu_id: it.menu_id || meta?.menu_id || 0,
            item_name: itemName,
            serving_time: slot,
            portion_size: portionSize,
            unit,
            total_quantity: it.quantity,
          });
        }
      } else {
        const key = `${cat}::${itemName.toLowerCase()}`;
        const existing = localPrepMap.get(key);
        if (existing) {
          existing.total_quantity += it.quantity;
          existing.order_count = (existing.order_count || 1) + 1;
        } else {
          localPrepMap.set(key, {
            menu_id: it.menu_id || meta?.menu_id || 0,
            item_name: itemName,
            category: cat,
            portion_size: portionSize,
            unit,
            total_quantity: it.quantity,
            order_count: 1,
          });
        }
      }
    });
  });

  // Construct structured teaCoffeeSlots (from backend or local)
  const standardTeaSlots = ['7:00 AM', '11:00 AM', '4:00 PM', '7:00 PM'];
  const teaCoffeeSlots = standardTeaSlots.map((slot) => {
    const backendSlot = kitchenReportData?.tea_coffee_slots?.find((s: any) => s.serving_time === slot);
    if (backendSlot && Array.isArray(backendSlot.items)) {
      return {
        serving_time: slot,
        items: backendSlot.items,
        subtotal: backendSlot.subtotal ?? backendSlot.items.reduce((sum: number, it: any) => sum + (it.total_quantity || 0), 0),
      };
    }

    const items = Array.from(localTeaSlotMap.values())
      .filter((it) => it.serving_time === slot)
      .sort((a, b) => a.item_name.localeCompare(b.item_name));
    const subtotal = items.reduce((sum, it) => sum + it.total_quantity, 0);
    return {
      serving_time: slot,
      items,
      subtotal,
    };
  });

  const totalTeaPortions = teaCoffeeSlots.reduce((sum, s) => sum + s.subtotal, 0);

  // Construct the 5 sections using backend data if available, or fallback to local calculation
  const kitchenSections: KitchenSection[] = standardSectionMeta.map((meta) => {
    if (meta.key === 'TEA / MILK') {
      const allTeaItems: KitchenItem[] = [];
      teaCoffeeSlots.forEach((slotGroup) => {
        (slotGroup.items || []).forEach((it: any) => {
          allTeaItems.push({
            menu_id: it.menu_id || 0,
            item_name: it.item_name,
            category: 'TEA / MILK',
            portion_size: it.portion_size || '100 ml',
            unit: it.unit || 'Nos',
            total_quantity: it.total_quantity,
          });
        });
      });

      return {
        category: meta.key,
        title: meta.title,
        desc: meta.desc,
        icon: meta.icon,
        items: allTeaItems.filter((it) => it.total_quantity > 0),
        subtotal: totalTeaPortions,
      };
    }

    const backendSec = kitchenReportData?.sections?.find((s: any) => s.category === meta.key);

    let items: KitchenItem[] = [];
    let subtotal = 0;

    if (backendSec && Array.isArray(backendSec.items)) {
      items = backendSec.items
        .filter((it: any) => (it.total_quantity || 0) > 0)
        .map((it: any) => ({
          menu_id: it.menu_id || 0,
          item_name: it.item_name,
          category: meta.key,
          portion_size: it.portion_size || '1 portion',
          unit: it.unit || 'Nos',
          total_quantity: it.total_quantity,
          order_count: it.order_count,
        }));
      subtotal = backendSec.subtotal || items.reduce((sum, it) => sum + it.total_quantity, 0);
    } else {
      items = Array.from(localPrepMap.values())
        .filter((it) => it.category === meta.key && it.total_quantity > 0)
        .sort((a, b) => a.item_name.localeCompare(b.item_name));
      subtotal = items.reduce((sum, it) => sum + it.total_quantity, 0);
    }

    return {
      category: meta.key,
      title: meta.title,
      desc: meta.desc,
      icon: meta.icon,
      items,
      subtotal,
    };
  });

  const overallTotalPortions = kitchenSections.reduce((sum, s) => sum + s.subtotal, 0);
  const overallDistinctDishes = kitchenSections.reduce((sum, s) => sum + s.items.length, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar - Excluded from Print */}
        <div className="no-print p-4 bg-procare-900 text-white flex justify-between items-center shrink-0 border-b border-procare-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-celadon text-slate-950 rounded-lg">
              {reportType === 'ROOM_WISE' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {reportType === 'ROOM_WISE'
                  ? isTa
                    ? 'அறை வாரியான நோயாளி ஆர்டர் அறிக்கை'
                    : 'Room-Wise Patient Order Report'
                  : isTa
                  ? 'சமையல் துறை – சமையலறை தயாரிப்பு அறிக்கை'
                  : 'Cooking Department – Kitchen Preparation Report'}
              </h2>
              <p className="text-xs text-procare-200">
                {isTa
                  ? `A4 அறிக்கை • உருவாக்கப்பட்ட நேரம்: ${dateFormatted} அன்று ${timeFormatted}`
                  : `Print-ready A4 Sheet • Generated on ${dateFormatted} at ${timeFormatted}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {reportType === 'ITEMS_TO_PREPARE' && (
              <button
                onClick={fetchKitchenReportData}
                disabled={loadingReport}
                className="bg-procare-800 hover:bg-procare-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-procare-700 cursor-pointer disabled:opacity-50"
                title="Refresh Kitchen Report Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReport ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isTa ? 'புதுப்பி' : 'Refresh'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="bg-celadon hover:bg-procare-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isTa ? 'அறிக்கையை அச்சிடுக (A4)' : 'PRINT REPORT (A4)'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-procare-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 AREA */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1" id="printable-report-area">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-report-area, #printable-report-area * {
                visibility: visible !important;
                font-family: 'Noto Sans Tamil', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
              }
              #printable-report-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 6mm 8mm !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
            }
          `}</style>

          {/* ProCare Print Header */}
          <div className="border-b-2 border-procare-900 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <img
                  src="/procare-logo.png"
                  alt="ProCare Logo"
                  className="h-12 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                    {t('appName')} • {t('clinicName')}
                  </h1>
                  <p className="text-xs text-procare-800 font-extrabold tracking-wide uppercase">
                    {isTa
                      ? 'கேன்டீன் மேலாண்மை அமைப்பு • உணவு மற்றும் சமையலறை சேவைத் துறை'
                      : 'Canteen Management System • Department of Dietary & Kitchen Services'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="flex items-center justify-end gap-1 font-extrabold text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-procare-700" />
                  <span>{dateFormatted}</span>
                </div>
                <div className="flex items-center justify-end gap-1 font-semibold mt-0.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-procare-700" />
                  <span>{timeFormatted}</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-black text-procare-950 uppercase bg-procare-100 px-3 py-1 rounded-md border border-procare-300">
                {reportType === 'ROOM_WISE'
                  ? isTa
                    ? '📋 அறை வாரியான நேரலை நோயாளி ஆர்டர் அறிக்கை'
                    : '📋 ROOM-WISE ACTIVE PATIENT ORDER REPORT'
                  : isTa
                  ? '👨‍🍳 சமையலறை தயாரிப்பு மற்றும் சமையல் மொத்த அறிக்கை'
                  : '👨‍🍳 KITCHEN COOKING & PREPARATION AGGREGATE REPORT'}
              </span>
              <span className="text-xs text-slate-700 font-extrabold font-mono">
                {reportType === 'ROOM_WISE'
                  ? isTa
                    ? `செயலில் உள்ள அறைகள்: ${sortedRooms.length} | ஆர்டர்கள்: ${validActiveOrders.length}`
                    : `Active Rooms: ${sortedRooms.length} | Orders: ${validActiveOrders.length}`
                  : isTa
                  ? `சமைக்க வேண்டிய மொத்த அளவு: ${overallTotalPortions} | உணவுகள்: ${overallDistinctDishes}`
                  : `Total Portions to Cook: ${overallTotalPortions} Nos | Total Dishes: ${overallDistinctDishes}`}
              </span>
            </div>
          </div>

          {/* REPORT 1: ROOM-WISE ORDER REPORT */}
          {reportType === 'ROOM_WISE' && (
            <div>
              {sortedRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-200 rounded-xl">
                  {isTa ? 'டெலிவரிக்காக காத்திருக்கும் செயலில் உள்ள ஆர்டர்கள் எதுவும் இல்லை.' : 'No active orders currently awaiting delivery.'}
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedRooms.map((roomNum) => {
                    const roomEntries = roomMap.get(roomNum) || [];
                    return (
                      <div
                        key={roomNum}
                        className="border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid shadow-xs"
                      >
                        <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-md">
                              {isTa ? 'அறை' : 'ROOM'} #{roomNum}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">
                              ({roomEntries.length} {isTa ? 'நோயாளி ஆர்டர்கள்' : roomEntries.length === 1 ? 'Patient Order' : 'Patient Orders'})
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {roomEntries.map(({ order, patient_name, patient_id }) => (
                            <div key={order._id} className="p-3 bg-white space-y-2">
                              <div className="flex justify-between items-start text-xs">
                                <div>
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {patient_name}
                                  </span>
                                  <span className="text-slate-500 font-semibold ml-2">
                                    ({isTa ? 'அடையாள எண்' : 'ID'}: {patient_id})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-bold text-blue-700">{order.order_id}</span>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {order.order_date} • {order.order_time} ({order.meal_type})
                                  </div>
                                </div>
                              </div>

                              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left text-[11px]">
                                    <th className="p-1.5 border-r border-slate-200">{isTa ? 'உணவு' : 'Food Item'}</th>
                                    <th className="p-1.5 text-center border-r border-slate-200 w-16">{isTa ? 'அளவு' : 'Qty'}</th>
                                    <th className="p-1.5 text-right border-r border-slate-200 w-20">{isTa ? 'விலை' : 'Unit Price'}</th>
                                    <th className="p-1.5 text-right w-24">{isTa ? 'தொகை' : 'Subtotal'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                                  {order.items?.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50">
                                      <td className="p-1.5 border-r border-slate-200 font-semibold">
                                        {translateFood(item.item_name_snapshot)}
                                      </td>
                                      <td className="p-1.5 text-center border-r border-slate-200 font-bold bg-slate-50">
                                        {item.quantity}
                                      </td>
                                      <td className="p-1.5 text-right border-r border-slate-200 text-slate-600">
                                        ₹{item.unit_price}
                                      </td>
                                      <td className="p-1.5 text-right font-bold">₹{item.subtotal}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50 text-slate-900 font-bold text-xs border-t border-slate-200">
                                    <td colSpan={3} className="p-1.5 text-right border-r border-slate-200">
                                      {isTa ? 'ஆர்டர் மொத்தம்:' : 'Order Total:'}
                                    </td>
                                    <td className="p-1.5 text-right font-black text-blue-800">
                                      ₹{order.total_amount}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REPORT 2: KITCHEN PREPARATION REPORT */}
          {reportType === 'ITEMS_TO_PREPARE' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {kitchenSections.map((sec, secIdx) => {
                  const IconComp = sec.icon;
                  return (
                    <div
                      key={sec.category}
                      className="border border-slate-300 rounded-xl overflow-hidden page-break-inside-avoid shadow-xs bg-white"
                    >
                      {/* Section Header */}
                      <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <span className="p-1 bg-emerald-600 text-white rounded-md">
                            <IconComp className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">
                              {secIdx + 1}. {sec.title}
                            </h3>
                            <p className="text-[10px] text-slate-300 font-medium">
                              {sec.desc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                            {sec.items.length} {isTa ? 'உணவுகள்' : sec.items.length === 1 ? 'Dish' : 'Dishes'}
                          </span>
                          <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded font-mono">
                            {isTa ? 'மொத்தம்:' : 'Total:'} {sec.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                          </span>
                        </div>
                      </div>

                      {/* Items Table */}
                      {sec.category === 'TEA / MILK' ? (
                        <div className="divide-y-2 divide-slate-300">
                          {teaCoffeeSlots.map((slotGroup: any) => {
                            const slotItems = (slotGroup.items || []).filter((it: any) => it.total_quantity > 0);
                            return (
                              <div key={slotGroup.serving_time} className="p-0">
                                <div className="bg-amber-100/90 px-4 py-1.5 flex justify-between items-center border-b border-amber-200">
                                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Clock className="w-3.5 h-3.5 text-amber-800" />
                                    {isTa ? 'வழங்கும் நேரம்:' : 'Serving Time:'} {translateSlot(slotGroup.serving_time)}
                                  </span>
                                  <span className="text-[11px] font-black bg-amber-200/80 text-amber-950 px-2.5 py-0.5 rounded font-mono border border-amber-300">
                                    {isTa ? 'பிரிவு மொத்தம்:' : 'Slot Subtotal:'} {slotGroup.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                                  </span>
                                </div>

                                {slotItems.length === 0 ? (
                                  <div className="py-2 px-4 text-center text-[11px] font-semibold text-slate-400 bg-slate-50 italic">
                                    {isTa
                                      ? `${translateSlot(slotGroup.serving_time)} நேரத்திற்கு தேநீர் / காபி ஆர்டர்கள் எதுவும் இல்லை (0 தேவை)`
                                      : `No Tea / Coffee orders scheduled for ${slotGroup.serving_time} (0 required)`}
                                  </div>
                                ) : (
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px] uppercase">
                                        <th className="p-2 w-28 border-r border-slate-200">{isTa ? 'வழங்கும் நேரம்' : 'Serving Time'}</th>
                                        <th className="p-2 border-r border-slate-200">{isTa ? 'உணவு' : 'Food Item'}</th>
                                        <th className="p-2 border-r border-slate-200 w-32">{isTa ? 'அளவு' : 'Portion Size'}</th>
                                        <th className="p-2 text-center bg-emerald-100/70 text-emerald-950 font-black w-36 border-r border-slate-200">
                                          {isTa ? 'தேவைப்படும் மொத்த அளவு' : 'Total Required'}
                                        </th>
                                        <th className="p-2 text-center w-28 bg-slate-100 text-slate-700 font-bold">
                                          {isTa ? 'சமையலறை நிலை' : 'Kitchen Status'}
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                                      {slotItems.map((it: any, itIdx: number) => (
                                        <tr key={`${slotGroup.serving_time}-${it.item_name}`} className={itIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                          <td className="p-2 border-r border-slate-200 font-black text-amber-900 font-mono text-xs">
                                            {translateSlot(slotGroup.serving_time)}
                                          </td>
                                          <td className="p-2 border-r border-slate-200 font-extrabold text-xs text-slate-900">
                                            {translateFood(it.item_name)}
                                          </td>
                                          <td className="p-2 border-r border-slate-200 text-slate-600 font-medium text-[11px]">
                                            {it.portion_size || '100 ml'}
                                          </td>
                                          <td className="p-2 text-center font-black text-sm font-mono bg-emerald-50 text-emerald-950 border-r border-slate-200">
                                            {it.total_quantity} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                                          </td>
                                          <td className="p-2 text-center">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 border border-slate-300 rounded px-2 py-0.5 bg-white">
                                              <span className="inline-block w-3 h-3 border border-slate-400 rounded-xs"></span>
                                              <span>{isTa ? 'தயார்' : 'Ready'}</span>
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            );
                          })}

                          {/* Section 1 Total */}
                          <div className="bg-slate-100 p-2.5 px-4 flex justify-between items-center text-xs font-black text-slate-900 border-t-2 border-slate-300">
                            <span className="uppercase tracking-wider">
                              {isTa
                                ? 'தேநீர் / பால் & காபி ஒட்டுமொத்த தேவைப்படும் அளவு:'
                                : 'Tea / Milk & Coffee Overall Subtotal Required:'}
                            </span>
                            <span className="text-sm font-black font-mono bg-emerald-100 text-emerald-950 px-3 py-1 rounded-lg border border-emerald-300">
                              {sec.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                            </span>
                          </div>
                        </div>
                      ) : sec.items.length === 0 ? (
                        <div className="py-3 px-4 text-center text-xs font-semibold text-slate-400 bg-slate-50">
                          {isTa
                            ? `${sec.title} அமர்வுக்கு ஆர்டர் எதுவும் இல்லை (0 தேவை)`
                            : `No items ordered for ${sec.title} session (0 portions required)`}
                        </div>
                      ) : (
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px] uppercase">
                              <th className="p-2 w-10 text-center border-r border-slate-200">#</th>
                              <th className="p-2 border-r border-slate-200">{isTa ? 'உணவுப் பெயர்' : 'Food Item Name'}</th>
                              <th className="p-2 border-r border-slate-200 w-36">{isTa ? 'அளவு' : 'Portion / Unit Size'}</th>
                              <th className="p-2 text-center bg-emerald-100/70 text-emerald-950 font-black w-36 border-r border-slate-200">
                                {isTa ? 'தேவைப்படும் மொத்த அளவு' : 'Total Required'}
                              </th>
                              <th className="p-2 text-center w-28 bg-slate-100 text-slate-700 font-bold">
                                {isTa ? 'சமையலறை நிலை' : 'Kitchen Status'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                            {sec.items.map((it, itIdx) => (
                              <tr key={it.item_name} className={itIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-500 font-mono">
                                  {itIdx + 1}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-extrabold text-xs text-slate-900">
                                  <span>{translateFood(it.item_name)}</span>
                                </td>
                                <td className="p-2 border-r border-slate-200 text-slate-600 font-medium text-[11px]">
                                  {it.portion_size}
                                </td>
                                <td className="p-2 text-center font-black text-sm font-mono bg-emerald-50 text-emerald-950 border-r border-slate-200">
                                  {it.total_quantity} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                                </td>
                                <td className="p-2 text-center">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 border border-slate-300 rounded px-2 py-0.5 bg-white">
                                    <span className="inline-block w-3 h-3 border border-slate-400 rounded-xs"></span>
                                    <span>{isTa ? 'தயார்' : 'Ready'}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-100 text-slate-900 font-bold text-xs border-t-2 border-slate-300">
                              <td colSpan={3} className="p-2 text-right uppercase tracking-wider border-r border-slate-200">
                                {sec.title} {isTa ? 'தேவைப்படும் மொத்த அளவு:' : 'Subtotal Required:'}
                              </td>
                              <td className="p-2 text-center font-black text-xs font-mono bg-emerald-100 text-emerald-950 border-r border-slate-200">
                                {sec.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                              </td>
                              <td className="p-2 text-center text-[10px] text-slate-500 font-semibold">
                                {sec.items.length} {isTa ? 'உணவுகள்' : 'items'}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall Grand Total & Sign-off Block */}
              <div className="mt-6 border-2 border-slate-900 rounded-xl p-4 bg-slate-50 page-break-inside-avoid">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-300">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      {isTa ? 'ஒட்டுமொத்த சமையல் & தயாரிப்பு சுருக்கம்' : 'Overall Cooking & Preparation Summary'}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {isTa
                        ? 'செல்லுபடியாகும் நேரலை ஆர்டர்களில் இருந்து கணக்கிடப்பட்டது. ரத்து செய்யப்பட்ட மற்றும் டெலிவரி செய்யப்பட்ட ஆர்டர்கள் தவிர்க்கப்பட்டுள்ளன.'
                        : 'Calculated from valid active patient orders. Excludes cancelled, pending, cleared, and delivered orders.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold uppercase text-slate-600 mr-2">
                      {isTa ? 'மொத்த அளவுகள்:' : 'Grand Total Portions:'}
                    </span>
                    <span className="text-base font-black bg-emerald-700 text-white px-3 py-1 rounded-lg font-mono">
                      {overallTotalPortions} {isTa ? 'எண்ணிக்கை' : 'Nos'}
                    </span>
                  </div>
                </div>

                {/* Session Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-xs">
                  {kitchenSections.map((s) => (
                    <div key={s.category} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase">{s.title}</span>
                      <span className="block text-sm font-black text-slate-900 font-mono mt-0.5">{s.subtotal} {isTa ? 'எண்ணிக்கை' : 'Nos'}</span>
                      <span className="block text-[10px] text-slate-400 font-medium">{s.items.length} {isTa ? 'உணவுகள்' : 'items'}</span>
                    </div>
                  ))}
                </div>

                {/* Signatures */}
                <div className="pt-6 mt-2 border-t border-slate-300 text-xs text-slate-700 flex justify-between items-end">
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {isTa ? 'அறிக்கை உருவாக்கப்பட்ட நேரம்:' : 'Report Generated:'} {dateFormatted} {isTa ? 'அன்று' : 'at'} {timeFormatted}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t('appName')} • {t('clinicName')}
                    </p>
                  </div>
                  <div className="flex gap-8 text-center">
                    <div>
                      <div className="w-40 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-700 text-[11px]">
                        {isTa ? 'உணவுக்கட்டுப்பாடு / கேன்டீன் நிர்வாகி' : 'Dietary / Canteen Admin'}
                      </p>
                    </div>
                    <div>
                      <div className="w-40 border-b border-slate-400 mb-1"></div>
                      <p className="font-bold text-slate-700 text-[11px]">
                        {isTa ? 'சமையலறை மேற்பார்வையாளர் / செஃப்' : 'Kitchen Supervisor / Chef'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer for Room-Wise Sheet */}
          {reportType === 'ROOM_WISE' && (
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs text-slate-600 flex justify-between items-end page-break-inside-avoid">
              <div>
                <p className="font-bold text-slate-800">
                  {isTa ? 'உருவாக்கியவர்: கேன்டீன் நிர்வாக அமைப்பு' : 'Generated By: Canteen Admin System'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {t('appName')} • {t('clinicName')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-44 border-b border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-700">
                  {isTa ? 'டெலிவரி மேற்பார்வையாளர் கையொப்பம்' : 'Delivery Supervisor Signature'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
