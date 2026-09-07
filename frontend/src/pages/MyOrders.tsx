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
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            My Food Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Track live food order status and confirm physical delivery.
          </p>
        </div>

        <div className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 font-semibold">
          Total Orders: <strong className="text-slate-900">{orders.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-700">No Orders Found</p>
          <p className="text-xs text-slate-400">You haven't placed any canteen food orders yet.</p>
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
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-4 sm:p-6 space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-black text-blue-700">{order.order_id}</span>
                      <span className="text-xs bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 font-bold">
                        Meal: {order.meal_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      Ordered on: {order.order_date} at {order.order_time}
                    </div>
                  </div>

                  <StatusBadge status={order.order_status} />
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Food Items Ordered</h4>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 overflow-x-auto">
                    <table className="w-full text-xs min-w-[280px]">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200/60 pb-1">
                          <th className="pb-1.5 font-bold">Item</th>
                          <th className="pb-1.5 font-bold text-center">Qty</th>
                          <th className="pb-1.5 font-bold text-right">Price</th>
                          <th className="pb-1.5 font-bold text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50">
                        {order.items?.map((item) => (
                          <tr key={item._id} className="text-slate-800">
                            <td className="py-2 font-semibold">{item.item_name_snapshot}</td>
                            <td className="py-2 text-center font-bold">{item.quantity}</td>
                            <td className="py-2 text-right text-slate-600 font-medium">₹{item.unit_price}</td>
                            <td className="py-2 text-right font-bold text-slate-900">₹{item.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Delivery Confirmation Box */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>Delivery Status Checklist:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-700 font-medium">
                      <span>
                        Admin:{' '}
                        {order.admin_delivery_confirmed ? (
                          <span className="text-emerald-700 font-bold">✓ Confirmed</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Pending</span>
                        )}
                      </span>
                      <span>
                        Patient:{' '}
                        {order.patient_delivery_confirmed ? (
                          <span className="text-emerald-700 font-bold">✓ Confirmed</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Pending</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {canConfirmDelivery && (
                    <button
                      onClick={() => handlePatientConfirmDelivery(order.order_id)}
                      disabled={confirmingId === order.order_id}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs text-xs shrink-0 active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{confirmingId === order.order_id ? 'Confirming...' : 'CONFIRM DELIVERY'}</span>
                    </button>
                  )}
                </div>

                {/* Cancellation Details if Cancelled */}
                {order.order_status === 'CANCELLED' && (
                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Order Cancelled Information:
                    </div>
                    <div>Cancelled by: <strong className="text-slate-900">{order.cancelled_by}</strong></div>
                    <div>Reason: <strong className="text-slate-900">{order.cancellation_reason}</strong></div>
                  </div>
                )}

                {/* Footer Total */}
                <div className="pt-2 flex justify-between items-center text-sm border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">
                    Total Amount:
                  </span>
                  <span className="font-black text-slate-900 text-base">₹{order.total_amount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
