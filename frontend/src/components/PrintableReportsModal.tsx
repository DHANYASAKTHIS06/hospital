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

  // Filter items needing preparation (qty > 0)
  const itemsNeedingPreparation = foodItemsToPrepare.filter(
    (item) => item.total_preparation_quantity > 0
  );
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
        <div className="no-print p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg">
              {reportType === 'ROOM_WISE' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <ChefHat className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {reportType === 'ROOM_WISE'
                  ? 'Room-Wise Patient Order Report'
                  : 'Cooking Department - Items to Be Prepared'}
              </h2>
              <p className="text-xs text-slate-300">
                A4 Print Preview • Generated on {dateFormatted} at {timeFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT REPORT</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
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

          {/* Hospital Print Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  HOSPITAL CANTEEN MANAGEMENT SYSTEM
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Official Kitchen & Dietary Delivery Operations Report
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dateFormatted}</span>
                </div>
                <div className="flex items-center justify-end gap-1 font-medium mt-0.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeFormatted}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-extrabold text-blue-900 uppercase bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                {reportType === 'ROOM_WISE'
                  ? '📋 ROOM-WISE ACTIVE PATIENT ORDER REPORT'
                  : '👨‍🍳 COOKING DEPARTMENT - TOTAL ITEMS TO BE PREPARED'}
              </span>
              <span className="text-xs text-slate-500 font-bold">
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
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex justify-between items-center text-xs text-emerald-950 font-bold">
                    <div>
                      <span>Aggregate Kitchen Cooking List</span>
                      <p className="text-[11px] text-emerald-800 font-normal mt-0.5">
                        Quantities are summed across all current active orders.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-900 bg-white px-3 py-1 rounded-lg border border-emerald-300 font-mono">
                        TOTAL ITEMS TO COOK: {totalItemsToCook}
                      </span>
                    </div>
                  </div>

                  <table className="w-full text-xs border-2 border-slate-900 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-left">
                        <th className="p-3 w-12 text-center border-r border-slate-700">#</th>
                        <th className="p-3 border-r border-slate-700">Category</th>
                        <th className="p-3 border-r border-slate-700">Food Item Name</th>
                        <th className="p-3 border-r border-slate-700">Portion Size</th>
                        <th className="p-3 text-center bg-emerald-800 text-white font-black text-sm w-36">
                          TOTAL QTY TO COOK
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                      {itemsNeedingPreparation.map((item, index) => (
                        <tr key={item.menu_id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                          <td className="p-3 text-center border-r border-slate-200 font-bold text-slate-500">
                            {index + 1}
                          </td>
                          <td className="p-3 border-r border-slate-200">
                            <span className="font-extrabold uppercase text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 border-r border-slate-200 font-bold text-sm text-slate-900">
                            {item.item_name}
                          </td>
                          <td className="p-3 border-r border-slate-200 text-slate-600">
                            {item.portion_size}
                          </td>
                          <td className="p-3 text-center font-black text-base font-mono bg-emerald-100/70 text-emerald-950">
                            {item.total_preparation_quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold text-xs">
                        <td colSpan={4} className="p-3 text-right uppercase tracking-wider border-r border-slate-700">
                          Total Prepared Portions Required:
                        </td>
                        <td className="p-3 text-center font-black text-lg font-mono bg-emerald-700 text-white">
                          {totalItemsToCook}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
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
