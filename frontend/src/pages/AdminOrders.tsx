import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder, OrderStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, Check, X, Truck, AlertCircle, Star, MessageSquare } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const [cancellingOrder, setCancellingOrder] = useState<FoodOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Food item unavailable');

  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders');
      setOrders(response.data);
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

      return () => {
        socket.off('new_order');
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
      };
    }
  }, [socket]);

  const handleAccept = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/accept`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept order.');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingOrder) return;
    try {
      await api.post(`/admin/orders/${cancellingOrder.order_id}/cancel`, {
        reason: cancelReason,
      });
      setCancellingOrder(null);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleAdminConfirmDelivery = async (orderId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/confirm-delivery`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm admin delivery.');
    }
  };

  const tabs: { label: string; value: OrderStatus | 'ALL' }[] = [
    { label: 'ALL ORDERS', value: 'ALL' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'ACCEPTED', value: 'ACCEPTED' },
    { label: 'DELIVERY CONFIRMATION PENDING', value: 'DELIVERY CONFIRMATION PENDING' },
    { label: 'DELIVERED', value: 'DELIVERED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
  ];

  const filteredOrders =
    activeTab === 'ALL' ? orders : orders.filter((o) => o.order_status === activeTab);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Admin Order Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Process incoming orders, confirm food delivery, or manage cancellations.
          </p>
        </div>
        <div className="text-xs font-semibold text-gray-600">
          Total Records: <strong className="text-gray-900">{orders.length}</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => {
          const count =
            t.value === 'ALL'
              ? orders.length
              : orders.filter((o) => o.order_status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No orders found in "{activeTab}" category.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-gray-100 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                    <span className="text-xs font-bold text-gray-900 bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded">
                      Patient: {order.patient_name} ({order.patient_id})
                    </span>
                    <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded">
                      Room: {order.room_number}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Date: {order.order_date} • Time: {order.order_time} • Meal: {order.meal_type}
                  </div>
                </div>

                <StatusBadge status={order.order_status} />
              </div>

              {/* Items Table */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 pb-1">
                      <th className="pb-1 font-semibold">Item</th>
                      <th className="pb-1 font-semibold text-center">Qty</th>
                      <th className="pb-1 font-semibold text-right">Price</th>
                      <th className="pb-1 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/60">
                    {order.items?.map((it) => (
                      <tr key={it._id} className="text-gray-800">
                        <td className="py-1.5 font-medium">{it.item_name_snapshot}</td>
                        <td className="py-1.5 text-center font-semibold">{it.quantity}</td>
                        <td className="py-1.5 text-right text-gray-600">₹{it.unit_price}</td>
                        <td className="py-1.5 text-right font-semibold">₹{it.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Patient Feedback Section if Submitted */}
              {order.has_feedback && (
                <div className="bg-amber-50/70 rounded-lg p-3 border border-amber-200/70 text-xs space-y-1">
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-gray-100">
                <div className="text-xs space-y-1">
                  <div className="text-gray-700 font-semibold">
                    Delivery Status:
                  </div>
                  <div>
                    {order.order_status === 'DELIVERED' ? (
                      <span className="text-emerald-700 font-bold">✓ DELIVERED</span>
                    ) : order.admin_delivery_confirmed ? (
                      <span className="text-emerald-700 font-bold">✓ Admin Confirmed</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">In Progress / Pending</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {order.order_status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAccept(order.order_id)}
                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>ACCEPT ORDER</span>
                      </button>
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>CANCEL ORDER</span>
                      </button>
                    </>
                  )}

                  {(order.order_status === 'ACCEPTED' ||
                    order.order_status === 'DELIVERY CONFIRMATION PENDING') && (
                    <>
                      <button
                        onClick={() => handleAdminConfirmDelivery(order.order_id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Truck className="w-4 h-4" />
                        <span>MARK ORDER AS DELIVERED</span>
                      </button>
                      <button
                        onClick={() => setCancellingOrder(order)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>CANCEL ORDER</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Cancel Order #{cancellingOrder.order_id}
            </h3>

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
                onClick={handleCancelSubmit}
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
