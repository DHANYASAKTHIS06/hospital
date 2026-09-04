import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      const response = await api.get('/patient/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching patient orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('order_status_updated', () => fetchOrders());
      socket.on('delivery_status_updated', () => fetchOrders());

      return () => {
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
      };
    }
  }, [socket]);

  const handlePatientConfirmDelivery = async (orderId: string) => {
    setConfirmingId(orderId);
    try {
      await api.post(`/patient/orders/${orderId}/confirm-delivery`);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            My Orders
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track live food order status and confirm physical delivery.
          </p>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Total Orders: <strong className="text-gray-900">{orders.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-base font-semibold text-gray-700">No Orders Found</p>
          <p className="text-xs text-gray-400">You haven't placed any food canteen orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isAccepted = order.order_status === 'ACCEPTED';
            const isDeliveryPending = order.order_status === 'DELIVERY CONFIRMATION PENDING';
            const canConfirmDelivery =
              (isAccepted || isDeliveryPending) && !order.patient_delivery_confirmed;

            return (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-base font-bold text-blue-700">{order.order_id}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                        Meal: {order.meal_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Ordered on: {order.order_date} at {order.order_time}
                    </div>
                  </div>

                  <StatusBadge status={order.order_status} />
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Food Items</h4>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                        {order.items?.map((item) => (
                          <tr key={item._id} className="text-gray-800">
                            <td className="py-1.5 font-medium">{item.item_name_snapshot}</td>
                            <td className="py-1.5 text-center font-semibold">{item.quantity}</td>
                            <td className="py-1.5 text-right text-gray-600">₹{item.unit_price}</td>
                            <td className="py-1.5 text-right font-semibold">₹{item.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivery Confirmation Box */}
                <div className="bg-blue-50/60 rounded-lg p-4 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <span>Delivery Status Checklist:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-gray-700 font-medium">
                      <span>
                        Admin Confirmation:{' '}
                        {order.admin_delivery_confirmed ? (
                          <span className="text-emerald-700 font-bold">✓ Confirmed</span>
                        ) : (
                          <span className="text-amber-700">Pending</span>
                        )}
                      </span>
                      <span>
                        Patient Confirmation:{' '}
                        {order.patient_delivery_confirmed ? (
                          <span className="text-emerald-700 font-bold">✓ Confirmed</span>
                        ) : (
                          <span className="text-amber-700">Pending</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {canConfirmDelivery && (
                    <button
                      onClick={() => handlePatientConfirmDelivery(order.order_id)}
                      disabled={confirmingId === order.order_id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm text-xs shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{confirmingId === order.order_id ? 'Confirming...' : '[ORDER DELIVERED]'}</span>
                    </button>
                  )}
                </div>

                {/* Cancellation Details if Cancelled */}
                {order.order_status === 'CANCELLED' && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-xs text-red-800 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Order Cancelled Information:
                    </div>
                    <div>Cancelled by: <strong className="text-gray-900">{order.cancelled_by}</strong></div>
                    <div>Reason: <strong className="text-gray-900">{order.cancellation_reason}</strong></div>
                  </div>
                )}

                {/* Footer Total */}
                <div className="pt-2 flex justify-between items-center text-sm border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">
                    Order Total (Snapshot Price Preserved):
                  </span>
                  <span className="font-bold text-gray-900 text-base">₹{order.total_amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
