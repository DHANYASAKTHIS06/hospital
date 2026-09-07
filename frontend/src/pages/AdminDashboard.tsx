import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder, FoodItemToPrepare, Category } from '../types';
import {
  Users,
  Clock,
  CheckCircle,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  Check,
  X,
  AlertCircle,
  ChefHat,
  Utensils,
  Filter,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<FoodOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Food item unavailable');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showOnlyRequired, setShowOnlyRequired] = useState<boolean>(false);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (socket) {
      socket.on('new_order', () => fetchStats());
      socket.on('order_status_updated', () => fetchStats());
      socket.on('delivery_status_updated', () => fetchStats());
      socket.on('payment_status_updated', () => fetchStats());

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
        socket.off('payment_status_updated');
      };
    }
  }, [socket]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/accept`);
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept order.');
    }
  };

  const handleCancelOrderSubmit = async () => {
    if (!cancellingOrder) return;
    try {
      await api.post(`/admin/orders/${cancellingOrder.order_id}/cancel`, {
        reason: cancelReason,
      });
      setCancellingOrder(null);
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-xs">Loading Admin Dashboard...</div>;
  }

  const foodItemsToPrepare: FoodItemToPrepare[] = stats?.foodItemsToPrepare || [];

  const categories: string[] = ['ALL', 'TEA / MILK', 'BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS'];

  const filteredItems = foodItemsToPrepare.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesRequired = !showOnlyRequired || item.total_preparation_quantity > 0;
    return matchesCategory && matchesRequired;
  });

  const totalPreparationQuantity = foodItemsToPrepare.reduce(
    (sum, item) => sum + item.total_preparation_quantity,
    0
  );

  const distinctItemsToPrepareCount = foodItemsToPrepare.filter(
    (item) => item.total_preparation_quantity > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Hospital Canteen Manager
          </span>
          <h1 className="text-2xl font-bold mt-1">ADMIN DASHBOARD</h1>
          <p className="text-xs text-slate-300">Live canteen order receiving and preparation management portal.</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Patients</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.totalPatients || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-amber-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700">{stats?.pendingOrders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-blue-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">Accepted Orders</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700">{stats?.acceptedOrders || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span className="text-xs font-semibold">Today's Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats?.todayOrdersCount || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-emerald-700 mb-2">
            <span className="text-xs font-semibold text-gray-500">Today's Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800">₹{stats?.todaysRevenue || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-rose-600 mb-2">
            <span className="text-xs font-semibold text-gray-500">Pending Payments</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-700">{stats?.pendingPaymentsCount || 0}</div>
        </div>
      </div>

      {/* FOOD ITEMS TO PREPARE SECTION */}
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-700" />
              FOOD ITEMS TO PREPARE
            </h2>
            <p className="text-xs text-emerald-800 mt-0.5">
              Live preparation counts aggregated automatically from accepted orders. Deducted upon delivery confirmation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <span>Items to Cook:</span>
              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-md font-mono text-sm">
                {totalPreparationQuantity}
              </span>
            </div>
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <span>Active Dishes:</span>
              <span className="bg-emerald-900 text-white px-2 py-0.5 rounded-md font-mono text-sm">
                {distinctItemsToPrepareCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gray-500" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <label className="inline-flex items-center cursor-pointer text-xs font-semibold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <input
              type="checkbox"
              checked={showOnlyRequired}
              onChange={(e) => setShowOnlyRequired(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-2"
            />
            Show Only Items Needing Preparation ({distinctItemsToPrepareCount})
          </label>
        </div>

        {/* Preparation Items Grid */}
        <div className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No food items match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isRequired = item.total_preparation_quantity > 0;
                return (
                  <div
                    key={item.menu_id}
                    className={`p-4 rounded-xl border transition-all flex justify-between items-center ${
                      isRequired
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-400/50'
                        : 'bg-white border-gray-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Utensils className={`w-3.5 h-3.5 ${isRequired ? 'text-emerald-700' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${isRequired ? 'text-emerald-950' : 'text-gray-700'}`}>
                          {item.item_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-gray-500">{item.portion_size}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-lg font-black font-mono px-3 py-1 rounded-lg flex items-center justify-center min-w-[3rem] ${
                          isRequired
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {item.total_preparation_quantity}
                      </div>
                      <span className="text-[9px] font-semibold text-gray-400 block mt-0.5">
                        {isRequired ? 'REQUIRED' : 'NONE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* NEW ORDERS / PENDING ORDERS SECTION */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            NEW ORDERS / PENDING ORDERS
          </h2>
          <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
            {stats?.recentPendingOrders?.length || 0} Pending
          </span>
        </div>

        {!stats?.recentPendingOrders || stats.recentPendingOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            No pending order requests at the moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {stats.recentPendingOrders.map((order: FoodOrder) => (
              <div key={order._id} className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-amber-50/30 transition-colors">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded">
                      Patient: {order.patient_name} ({order.patient_id})
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded">
                      Room No: {order.room_number}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.order_date} • {order.order_time}
                    </span>
                  </div>

                  {/* Food Items Summary */}
                  <div className="text-xs text-gray-700 font-medium">
                    {order.items?.map((it) => (
                      <span key={it._id} className="inline-block bg-white border border-gray-200 px-2.5 py-1 rounded mr-2 my-0.5">
                        <strong>{it.item_name_snapshot}</strong> × {it.quantity} (₹{it.subtotal})
                      </span>
                    ))}
                  </div>

                  <div className="text-xs font-bold text-gray-900">
                    Total Amount: ₹{order.total_amount}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleAcceptOrder(order.order_id)}
                    className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>[ACCEPT ORDER]</span>
                  </button>

                  <button
                    onClick={() => setCancellingOrder(order)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>[CANCEL ORDER]</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Cancel Order #{cancellingOrder.order_id}
            </h3>
            <p className="text-xs text-gray-600">
              Only Admin can cancel orders. Please provide a reason for cancelling this order for patient {cancellingOrder.patient_name}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cancellation Reason *</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Food item unavailable"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleCancelOrderSubmit}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
