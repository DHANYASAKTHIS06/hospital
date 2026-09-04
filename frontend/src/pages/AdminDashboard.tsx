import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/StatusBadge';
import { FoodOrder } from '../types';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<FoodOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Food item unavailable');
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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Hospital Canteen Manager
          </span>
          <h1 className="text-2xl font-bold mt-1">ADMIN DASHBOARD</h1>
          <p className="text-xs text-slate-300">Live canteen order receiving and status management portal.</p>
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
