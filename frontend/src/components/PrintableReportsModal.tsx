import React from 'react';
import { FoodOrder, FoodItemToPrepare } from '../types';
import { Printer, X, ChefHat, Building2, Calendar, Clock } from 'lucide-react';

interface PrintableReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'ROOM_WISE' | 'ITEMS_TO_PREPARE';
  orders: FoodOrder[];
  foodItemsToPrepare: FoodItemToPrepare[];
}

export const PrintableReportsModal: React.FC<PrintableReportsModalProps> = ({
  isOpen,
  onClose,
  reportType,
  orders,
  foodItemsToPrepare,
}) => {
  if (!isOpen) return null;

  const activeOrders = orders.filter((o) => o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED');
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Group active orders by room number
  const roomMap = new Map<string, Array<{ order: FoodOrder; patient_name: string; patient_id: string }>>();
  activeOrders.forEach((order) => {
    const room = order.room_number || 'Unassigned';
    if (!roomMap.has(room)) {
      roomMap.set(room, []);
    }
    roomMap.get(room)!.push({
      order,
      patient_name: order.patient_name || 'Patient',
      patient_id: order.patient_id,
    });
  });

  // Sort rooms numerically/alphabetically
  const sortedRooms = Array.from(roomMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Calculate meal-wise preparation list directly from active orders & foodItemsToPrepare prop
  const activeOrderPrepMap = new Map<string, { menu_id: number; item_name: string; meal_type: string; category: string; portion_size: string; total_preparation_quantity: number }>();

  // 1. Populate directly from active orders
  activeOrders.forEach((o) => {
    const rawMeal = (o.meal_type || 'Breakfast').trim();
    let mealName = rawMeal;
    if (/^breakfast$/i.test(rawMeal)) mealName = 'Breakfast';
    else if (/^lunch$/i.test(rawMeal)) mealName = 'Lunch';
    else if (/^dinner$/i.test(rawMeal)) mealName = 'Dinner';
    else if (/^tea/i.test(rawMeal)) mealName = 'Tea / Milk';
    else if (/^snack/i.test(rawMeal)) mealName = 'Snacks';

    const mealCategory = mealName.toUpperCase();

    o.items?.forEach((it) => {
      const key = `${mealCategory}::${it.item_name_snapshot.trim().toLowerCase()}`;
      const existing = activeOrderPrepMap.get(key);
      if (existing) {
        existing.total_preparation_quantity += it.quantity;
      } else {
        activeOrderPrepMap.set(key, {
          menu_id: it.menu_id || 0,
          item_name: it.item_name_snapshot,
          meal_type: mealName,
          category: mealCategory,
          portion_size: '1 portion',
          total_preparation_quantity: it.quantity,
        });
      }
    });
  });

  // 2. Also merge from foodItemsToPrepare prop if items with qty > 0 are present
  foodItemsToPrepare.forEach((item) => {
    if (item.total_preparation_quantity > 0) {
      const rawMeal = (item.meal_type || item.category || 'Breakfast').trim();
      let mealName = rawMeal;
      if (/^breakfast$/i.test(rawMeal)) mealName = 'Breakfast';
      else if (/^lunch$/i.test(rawMeal)) mealName = 'Lunch';
      else if (/^dinner$/i.test(rawMeal)) mealName = 'Dinner';
      else if (/^tea/i.test(rawMeal)) mealName = 'Tea / Milk';
      else if (/^snack/i.test(rawMeal)) mealName = 'Snacks';

      const mealCategory = mealName.toUpperCase();
      const key = `${mealCategory}::${item.item_name.trim().toLowerCase()}`;
      if (!activeOrderPrepMap.has(key)) {
        activeOrderPrepMap.set(key, {
          menu_id: item.menu_id,
          item_name: item.item_name,
          meal_type: mealName,
          category: mealCategory,
          portion_size: item.portion_size || '1 portion',
          total_preparation_quantity: item.total_preparation_quantity,
        });
      }
    }
  });

  const itemsNeedingPreparation = Array.from(activeOrderPrepMap.values());
  const totalItemsToCook = itemsNeedingPreparation.reduce(
    (sum, item) => sum + item.total_preparation_quantity,
    0
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar - No Print */}
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
                  ? 'Room-Wise Patient Order Report'
                  : 'Cooking Department - Items to Be Prepared'}
              </h2>
              <p className="text-xs text-procare-200">
                A4 Print Preview • Generated on {dateFormatted} at {timeFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-celadon hover:bg-procare-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT REPORT</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-procare-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="p-6 md:p-8 overflow-y-auto bg-white flex-1" id="printable-report-area">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-report-area, #printable-report-area * {
                visibility: visible !important;
              }
              #printable-report-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            }
          `}</style>

          {/* ProCare Print Header */}
          <div className="border-b-2 border-procare-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <img
                  src="/procare-logo.png"
                  alt="ProCare Logo"
                  className="h-14 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                    PROCARE PHYSIOTHERAPY & REHABILITATION CENTRE
                  </h1>
                  <p className="text-xs text-procare-800 font-extrabold tracking-wide uppercase">
                    Canteen Management System Report
                  </p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-procare-700" />
                  <span>{dateFormatted}</span>
                </div>
                <div className="flex items-center justify-end gap-1 font-medium mt-0.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeFormatted}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-black text-procare-950 uppercase bg-procare-100 px-3 py-1 rounded-md border border-procare-300">
                {reportType === 'ROOM_WISE'
                  ? '📋 ROOM-WISE ACTIVE PATIENT ORDER REPORT'
                  : '👨‍🍳 COOKING DEPARTMENT - TOTAL ITEMS TO BE PREPARED'}
              </span>
              <span className="text-xs text-slate-600 font-bold">
                {reportType === 'ROOM_WISE'
                  ? `Total Active Rooms: ${sortedRooms.length} | Orders: ${activeOrders.length}`
                  : `Total Dishes to Cook: ${itemsNeedingPreparation.length} | Total Portion Count: ${totalItemsToCook}`}
              </span>
            </div>
          </div>

          {/* REPORT 1: ROOM-WISE ORDER REPORT */}
          {reportType === 'ROOM_WISE' && (
            <div>
              {sortedRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-200 rounded-xl">
                  No active orders currently awaiting delivery.
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
                        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md">
                              ROOM #{roomNum}
                            </span>
                            <span className="text-xs font-semibold text-slate-300">
                              ({roomEntries.length} {roomEntries.length === 1 ? 'Patient Order' : 'Patient Orders'})
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {roomEntries.map(({ order, patient_name, patient_id }) => (
                            <div key={order._id} className="p-4 bg-white space-y-3">
                              <div className="flex justify-between items-start text-xs">
                                <div>
                                  <span className="font-extrabold text-slate-900 text-sm">
                                    {patient_name}
                                  </span>
                                  <span className="text-slate-500 font-semibold ml-2">
                                    (ID: {patient_id})
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
                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                                    <th className="p-2 border-r border-slate-200">Food Item</th>
                                    <th className="p-2 text-center border-r border-slate-200 w-16">Qty</th>
                                    <th className="p-2 text-right border-r border-slate-200 w-20">Unit Price</th>
                                    <th className="p-2 text-right w-24">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                                  {order.items?.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50">
                                      <td className="p-2 border-r border-slate-200 font-semibold">
                                        {item.item_name_snapshot}
                                      </td>
                                      <td className="p-2 text-center border-r border-slate-200 font-bold bg-slate-50">
                                        {item.quantity}
                                      </td>
                                      <td className="p-2 text-right border-r border-slate-200 text-slate-600">
                                        ₹{item.unit_price}
                                      </td>
                                      <td className="p-2 text-right font-bold">₹{item.subtotal}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-slate-50 text-slate-900 font-bold text-xs border-t border-slate-200">
                                    <td colSpan={3} className="p-2 text-right border-r border-slate-200">
                                      Order Total:
                                    </td>
                                    <td className="p-2 text-right font-black text-blue-800">
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

          {/* REPORT 2: ITEMS TO BE PREPARED REPORT */}
          {reportType === 'ITEMS_TO_PREPARE' && (
            <div>
              {itemsNeedingPreparation.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-semibold border-2 border-dashed border-slate-200 rounded-xl">
                  No food items currently require preparation.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Box */}
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex justify-between items-center text-xs text-emerald-950 font-bold">
                    <div>
                      <span className="text-sm font-black uppercase text-emerald-900">
                        👨‍🍳 MEAL-WISE KITCHEN COOKING & PREPARATION LIST
                      </span>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        Common Menu items are automatically merged into Breakfast, Lunch, and Dinner quantities.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-900 bg-white px-3 py-1 rounded-lg border border-emerald-300 font-mono">
                        TOTAL PORTIONS TO COOK: {totalItemsToCook}
                      </span>
                    </div>
                  </div>

                  {/* Meal-Wise Preparation Breakdown */}
                  {(() => {
                    const mealOrder = ['BREAKFAST', 'LUNCH', 'DINNER', 'TEA / MILK', 'SNACKS'];
                    const prepByMealGroup = mealOrder
                      .map((mealCat) => {
                        const items = itemsNeedingPreparation.filter((item) => {
                          const c = (item.category || item.meal_type || '').trim().toUpperCase();
                          return c === mealCat || c.replace(/\s+/g, '') === mealCat.replace(/\s+/g, '');
                        });
                        const subtotal = items.reduce((sum, item) => sum + item.total_preparation_quantity, 0);
                        return { mealCat, items, subtotal };
                      })
                      .filter((group) => group.items.length > 0);

                    const handledCategories = new Set(mealOrder);
                    const otherPrepItems = itemsNeedingPreparation.filter((item) => {
                      const c = (item.category || item.meal_type || '').trim().toUpperCase();
                      return !handledCategories.has(c) && !handledCategories.has(c.replace(/\s+/g, ''));
                    });
                    if (otherPrepItems.length > 0) {
                      prepByMealGroup.push({
                        mealCat: 'OTHER MEALS',
                        items: otherPrepItems,
                        subtotal: otherPrepItems.reduce((sum, item) => sum + item.total_preparation_quantity, 0),
                      });
                    }

                    return prepByMealGroup.map((group) => (
                      <div key={group.mealCat} className="border-2 border-slate-800 rounded-xl overflow-hidden shadow-xs page-break-inside-avoid">
                        <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center text-xs font-black uppercase">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-celadon"></span>
                            {group.mealCat}
                          </span>
                          <span className="bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-0.5 rounded font-mono">
                            Section Total: {group.subtotal} Portions
                          </span>
                        </div>

                        {/* Bulleted Preparation Summary */}
                        <div className="p-3 bg-slate-50 border-b border-slate-200">
                          <ul className="space-y-1 text-xs font-extrabold text-slate-900">
                            {group.items.map((item) => (
                              <li key={`bullet-${item.item_name}`} className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold">•</span>
                                <span>{item.item_name} – <strong className="text-emerald-800 font-mono text-sm">{item.total_preparation_quantity}</strong></span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                              <th className="p-2.5 w-12 text-center border-r border-slate-200">#</th>
                              <th className="p-2.5 border-r border-slate-200">Food Item Name</th>
                              <th className="p-2.5 border-r border-slate-200">Portion Size</th>
                              <th className="p-2.5 text-center bg-emerald-100 text-emerald-950 font-black text-xs w-36">
                                QTY TO PREPARE
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                            {group.items.map((item, index) => (
                              <tr key={`${item.menu_id}-${group.mealCat}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                                <td className="p-2.5 text-center border-r border-slate-200 font-bold text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="p-2.5 border-r border-slate-200 font-bold text-sm text-slate-900">
                                  {item.item_name}
                                </td>
                                <td className="p-2.5 border-r border-slate-200 text-slate-600">
                                  {item.portion_size}
                                </td>
                                <td className="p-2.5 text-center font-black text-base font-mono bg-emerald-50 text-emerald-950">
                                  {item.total_preparation_quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ));
                  })()}

                  {/* Grand Total Footer */}
                  <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs font-bold">
                    <span className="uppercase tracking-wider">Grand Total Prepared Portions Required:</span>
                    <span className="text-lg font-black font-mono bg-emerald-600 text-white px-4 py-1 rounded-lg">
                      {totalItemsToCook} PORTIONS
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Signature Block for Printed Sheet */}
          <div className="mt-12 pt-6 border-t border-slate-300 text-xs text-slate-600 flex justify-between items-end page-break-inside-avoid">
            <div>
              <p className="font-bold text-slate-800">Generated By: Canteen Admin System</p>
              <p className="text-[11px] text-slate-500">Hospital Canteen Management Portal</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-700">Kitchen Supervisor Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
