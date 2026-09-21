import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FoodOrder } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, Clock, AlertTriangle, Star, MessageSquare, X, CheckCircle2 } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  // Feedback Modal State
  const [feedbackOrder, setFeedbackOrder] = useState<FoodOrder | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

  const handleOpenFeedback = (order: FoodOrder) => {
    setFeedbackOrder(order);
    setRating(5);
    setHoverRating(0);
    setComment('');
    setFeedbackError(null);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackOrder) return;
    setFeedbackError(null);
    setFeedbackLoading(true);

    try {
      await api.post(`/patient/orders/${feedbackOrder.order_id}/feedback`, {
        rating,
        feedback_comment: comment,
      });

      setFeedbackOrder(null);
      fetchOrders();
    } catch (err: any) {
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
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
            Track live food order status and share feedback on delivered orders.
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
            const isDelivered = order.order_status === 'DELIVERED';

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

                {/* Patient Feedback Section for DELIVERED orders */}
                {isDelivered && (
                  <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-xl p-4 border border-blue-200/60 space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-bold text-slate-800">Patient Feedback & Food Rating:</span>
                      </div>

                      {order.has_feedback ? (
                        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Feedback Submitted</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenFeedback(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>Leave Feedback</span>
                        </button>
                      )}
                    </div>

                    {order.has_feedback && (
                      <div className="bg-white/90 p-3 rounded-xl border border-blue-100 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (order.rating || 0)
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-slate-700 font-bold text-xs ml-1">({order.rating}/5)</span>
                        </div>
                        {order.feedback_comment && (
                          <div className="text-slate-600 font-medium italic flex items-start gap-1.5 pt-1">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>"{order.feedback_comment}"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

      {/* FEEDBACK SUBMISSION MODAL */}
      {feedbackOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Food & Delivery Feedback</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Order #{feedbackOrder.order_id}</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {feedbackError}
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-2xl border border-slate-200/80">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Written Feedback / Comments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about food taste, temperature, portion, or delivery service..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
