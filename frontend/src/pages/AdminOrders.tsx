import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder, FoodItemToPrepare } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PrintableReportsModal } from '../components/PrintableReportsModal';
import { ShoppingBag, Truck, Star, MessageSquare, Printer, Building2, Coffee, Sun, Moon, Cookie, AlertTriangle, Wallet } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [foodItemsToPrepare, setFoodItemsToPrepare] = useState<FoodItemToPrepare[]>([]);
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Print Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'ROOM_WISE' | 'ITEMS_TO_PREPARE'>('ROOM_WISE');

  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/dashboard'),
      ]);
      setOrders(ordersRes.data || []);
      setFoodItemsToPrepare(statsRes.data?.foodItemsToPrepare || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('new_order', () => fetchOrders());
      socket.on('order_status_updated', () => fetchOrders());
      socket.on('delivery_status_updated', () => fetchOrders());
      socket.on('patient_balance_updated', () => fetchOrders());

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
        socket.off('patient_balance_updated');
      };
    }
  }, [socket]);

  const handleAdminConfirmDelivery = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm-delivery`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm admin delivery.');
    }
  };

  const openReport = (type: 'ROOM_WISE' | 'ITEMS_TO_PREPARE') => {
    setReportType(type);
    setIsReportModalOpen(true);
  };

  const activeOrdersCount = orders.filter(
    (o) => o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED'
  ).length;
  const deliveredOrdersCount = orders.filter((o) => o.order_status === 'DELIVERED').length;

  // Filter orders by delivery status & meal filter
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      activeTab === 'ALL'
        ? true
        : activeTab === 'ACTIVE'
        ? o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED'
        : o.order_status === 'DELIVERED';

    const mealTypeNormalized = (o.meal_type || '').trim().toUpperCase();
    const filterNormalized = selectedMealFilter.trim().toUpperCase();

    const matchesMeal =
      filterNormalized === 'ALL'
        ? true
        : mealTypeNormalized === filterNormalized ||
          mealTypeNormalized.replace(/\s+/g, '') === filterNormalized.replace(/\s+/g, '');

    return matchesStatus && matchesMeal;
  });

  // Group filtered orders by Meal Session (Breakfast, Lunch, Dinner, Snacks, Other)
  const mealSections = ['Breakfast', 'Lunch', 'Dinner', 'Tea / Milk', 'Snacks'];

  const groupedByMealSession = mealSections.map((session) => {
    const sessionOrders = filteredOrders.filter((o) => {
      const m = (o.meal_type || '').trim().toUpperCase();
      const s = session.trim().toUpperCase();
      return m === s || m.replace(/\s+/g, '') === s.replace(/\s+/g, '');
    });
    return {
      meal_type: session,
      orders: sessionOrders,
    };
  }).filter((group) => group.orders.length > 0);

  // Catch any order with other meal_type
  const otherOrders = filteredOrders.filter((o) => {
    const m = (o.meal_type || '').trim().toUpperCase();
    return !mealSections.some((s) => s.toUpperCase() === m || s.toUpperCase().replace(/\s+/g, '') === m.replace(/\s+/g, ''));
  });

  if (otherOrders.length > 0) {
    groupedByMealSession.push({
      meal_type: 'General Orders',
      orders: otherOrders,
    });
  }

  // Count low balance patients in current order list
  const lowBalanceOrdersCount = orders.filter(
    (o) => (o.patient_advance_balance !== undefined && o.patient_advance_balance < 500)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Print Report Actions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Admin Order Management (Meal-Wise View)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View patient food orders grouped by Breakfast, Lunch, and Dinner with live balance alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openReport('ROOM_WISE')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Print Room-Wise Report</span>
          </button>

          <button
            onClick={() => openReport('ITEMS_TO_PREPARE')}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Items to Be Prepared</span>
          </button>
        </div>
      </div>

      {/* Low Balance Alert Banner for Admin */}
      {lowBalanceOrdersCount > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs rounded-2xl font-bold flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-rose-900">⚠️ LOW BALANCE PATIENTS DETECTED</h3>
            <p className="text-xs text-rose-800 font-semibold mt-0.5">
              Some patients with orders have a remaining advance balance below ₹500. Please recharge their balance under the Manage Patients tab.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar: Status & Meal Session Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'ALL ORDERS', value: 'ALL', count: orders.length },
            { label: 'ACTIVE ORDERS', value: 'ACTIVE', count: activeOrdersCount },
            { label: 'DELIVERED', value: 'DELIVERED', count: deliveredOrdersCount },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === t.value
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-gray-700 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Meal Session Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-500 mr-1">Filter Meal:</span>
          {['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'].map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMealFilter(meal)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedMealFilter === meal
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {meal}
            </button>
          ))}
        </div>
      </div>

      {/* MEAL-WISE GROUPED ORDERS LIST */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs font-semibold">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 text-xs font-semibold">
          No orders found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByMealSession.map((section) => {
            const mealTitle = section.meal_type.toUpperCase();
            let MealIcon = Coffee;
            let headerBg = 'bg-amber-900 text-white';

            if (mealTitle.includes('BREAKFAST')) {
              MealIcon = Coffee;
              headerBg = 'bg-amber-900 text-white';
            } else if (mealTitle.includes('LUNCH')) {
              MealIcon = Sun;
              headerBg = 'bg-orange-800 text-white';
            } else if (mealTitle.includes('DINNER')) {
              MealIcon = Moon;
              headerBg = 'bg-indigo-900 text-white';
            } else if (mealTitle.includes('SNACK') || mealTitle.includes('TEA')) {
              MealIcon = Cookie;
              headerBg = 'bg-emerald-900 text-white';
            }

            return (
              <div key={section.meal_type} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                {/* Meal Section Header Bar */}
                <div className={`px-6 py-3.5 ${headerBg} flex justify-between items-center`}>
                  <div className="flex items-center space-x-2">
                    <MealIcon className="w-5 h-5 text-amber-300" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">
                      {section.meal_type} ORDERS
                    </h2>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full border border-white/20">
                    {section.orders.length} {section.orders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                {/* Orders within this Meal Session */}
                <div className="divide-y divide-gray-200 p-6 space-y-6">
                  {section.orders.map((order) => {
                    const isDelivered = order.order_status === 'DELIVERED';
                    const balance = order.patient_advance_balance !== undefined ? order.patient_advance_balance : null;
                    const isLowBalance = balance !== null && balance < 500;

                    return (
                      <div key={order._id} className="bg-slate-50/70 rounded-2xl border border-gray-200 p-5 space-y-4 hover:shadow-xs transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-gray-200 gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center space-x-3 gap-y-1">
                              <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                              <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-0.5 rounded shadow-2xs">
                                Patient: {order.patient_name} ({order.patient_id})
                              </span>
                              <span className="text-xs font-extrabold text-slate-900 bg-slate-200 px-2.5 py-0.5 rounded">
                                Room #{order.room_number || 'N/A'}
                              </span>

                              {/* Patient Remaining Balance Indicator */}
                              {balance !== null && (
                                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded flex items-center gap-1 border ${
                                  isLowBalance
                                    ? 'bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-rose-400'
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                }`}>
                                  <Wallet className="w-3 h-3 text-emerald-700" />
                                  <span>Balance: ₹{balance}</span>
                                  {isLowBalance && <span className="text-[10px] font-extrabold text-rose-600 ml-1">⚠️ LOW</span>}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 font-medium">
                              Date: {order.order_date} • Time: {order.order_time} • Meal Session: <strong className="text-slate-800">{order.meal_type}</strong>
                            </div>
                          </div>

                          <StatusBadge status={order.order_status} />
                        </div>

                        {/* Items Table */}
                        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-200 pb-1">
                                <th className="pb-1 font-semibold">Food Item</th>
                                <th className="pb-1 font-semibold text-center">Qty</th>
                                <th className="pb-1 font-semibold text-right">Price</th>
                                <th className="pb-1 font-semibold text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                              {order.items?.map((it) => (
                                <tr key={it._id} className="text-gray-800 font-medium">
                                  <td className="py-1.5 font-bold">{it.item_name_snapshot}</td>
                                  <td className="py-1.5 text-center font-bold bg-slate-50">{it.quantity}</td>
                                  <td className="py-1.5 text-right text-gray-600">₹{it.unit_price}</td>
                                  <td className="py-1.5 text-right font-bold">₹{it.subtotal}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200 font-extrabold text-slate-900 text-xs">
                                <td colSpan={3} className="pt-2 text-right">Total Meal Order Amount:</td>
                                <td className="pt-2 text-right font-black text-blue-800">₹{order.total_amount}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Feedback if any */}
                        {order.has_feedback && (
                          <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/70 text-xs space-y-1">
                            <div className="flex items-center gap-1 text-amber-700 font-bold">
                              <span className="text-gray-700">Patient Rating & Feedback:</span>
                              <div className="flex items-center gap-0.5 ml-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${
                                      star <= (order.rating || 0)
                                        ? 'text-amber-500 fill-amber-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-gray-900 font-extrabold ml-1">({order.rating}/5)</span>
                            </div>
                            {order.feedback_comment && (
                              <div className="text-gray-700 font-medium italic flex items-start gap-1 pt-0.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>"{order.feedback_comment}"</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Delivery Checklist & Admin Control Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-gray-200/80">
                          <div className="text-xs space-y-1">
                            <div className="text-gray-700 font-semibold">
                              Delivery Status:
                            </div>
                            <div>
                              {isDelivered ? (
                                <span className="text-emerald-700 font-bold">✓ DELIVERED</span>
                              ) : (
                                <span className="text-blue-700 font-bold">Active / Pending Delivery</span>
                              )}
                            </div>
                          </div>

                          {!isDelivered && (
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => handleAdminConfirmDelivery(order.order_id)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Truck className="w-4 h-4" />
                                <span>MARK ORDER AS DELIVERED</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Reports Modal Component */}
      <PrintableReportsModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportType={reportType}
        orders={orders}
        foodItemsToPrepare={foodItemsToPrepare}
      />
    </div>
  );
};
