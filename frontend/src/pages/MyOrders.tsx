import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { FoodOrder } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, Clock, AlertTriangle, Star, MessageSquare, X, CheckCircle2, Calendar } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { t, language, translateFood, translateCategory, translateSlot } = useLanguage();

  const isTa = language === 'ta';

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
      const handleOrdersRefresh = () => fetchOrders();
      socket.on('order_status_updated', handleOrdersRefresh);
      socket.on('delivery_status_updated', handleOrdersRefresh);

      return () => {
        socket.off('order_status_updated', handleOrdersRefresh);
        socket.off('delivery_status_updated', handleOrdersRefresh);
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
      setFeedbackError(err.response?.data?.message || (isTa ? 'கருத்தை சமர்ப்பிப்பதில் தோல்வி.' : 'Failed to submit feedback.'));
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-procare-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            {t('appName')} • {t('clinicName')}
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <div className="p-1.5 rounded-lg bg-celadon text-slate-950">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {isTa ? 'எனது கேன்டீன் உணவு ஆர்டர்கள்' : 'MY CANTEEN FOOD ORDERS'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'நேரலை ஆர்டர் நிலையைக் கண்காணிக்கவும் மற்றும் டெலிவரி செய்யப்பட்ட ஆர்டர்களுக்கு கருத்து தெரிவிக்கவும்.'
              : 'Track live food order status and share feedback on delivered orders.'}
          </p>
        </div>

        <div className="text-xs bg-procare-50 border border-procare-200 px-3 py-1.5 rounded-xl text-procare-900 font-bold">
          {isTa ? 'மொத்த ஆர்டர்கள்:' : 'Total Orders:'}{' '}
          <strong className="text-procare-950 font-black">{orders.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
          {isTa ? 'ஆர்டர்கள் ஏற்றப்படுகின்றன...' : 'Loading orders...'}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-700">{t('noOrdersYet')}</p>
          <p className="text-xs text-slate-400">{t('noOrdersYetSub')}</p>
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
                        {isTa ? 'உணவு:' : 'Meal:'} {translateCategory(order.meal_type)}
                      </span>
                      {order.serving_time && (
                        <span className="text-xs bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md text-amber-900 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {isTa ? 'வழங்கும் நேரம்:' : 'Serving Time:'} {translateSlot(order.serving_time)}
                        </span>
                      )}
                      {/* Delivery Date Badge */}
                      <span className="text-xs bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-700" />
                        <span>
                          {isTa ? 'விநியோக தேதி:' : 'Delivery Date:'} {order.delivery_date || order.order_date}
                          {order.delivery_day && ` (${order.delivery_day})`}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      {isTa
                        ? `ஆர்டர் செய்த நேரம்: ${order.order_placed_date || order.order_date} • ${order.order_time}`
                        : `Ordered on: ${order.order_placed_date || order.order_date} at ${order.order_time}`}
                    </div>
                  </div>

                  <StatusBadge status={order.order_status} />
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    {isTa ? 'ஆர்டர் செய்யப்பட்ட உணவுகள்' : 'Food Items Ordered'}
                  </h4>
                  <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 overflow-x-auto">
                    <table className="w-full text-xs min-w-[280px]">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200/60 pb-1">
                          <th className="pb-1.5 font-bold">{isTa ? 'உணவு' : 'Item'}</th>
                          <th className="pb-1.5 font-bold text-center">{isTa ? 'அளவு' : 'Qty'}</th>
                          <th className="pb-1.5 font-bold text-right">{isTa ? 'விலை' : 'Price'}</th>
                          <th className="pb-1.5 font-bold text-right">{isTa ? 'தொகை' : 'Subtotal'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50">
                        {order.items?.map((item) => (
                          <tr key={item._id} className="text-slate-800">
                            <td className="py-2 font-semibold">
                              {translateFood(item.item_name_snapshot)}
                              {item.serving_time && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold ml-1.5 inline-flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-amber-700" />
                                  {translateSlot(item.serving_time)}
                                </span>
                              )}
                            </td>
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
                        <span className="text-xs font-bold text-slate-800">
                          {isTa ? 'நோயாளி கருத்து & உணவு மதிப்பீடு:' : 'Patient Feedback & Food Rating:'}
                        </span>
                      </div>

                      {order.has_feedback ? (
                        <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isTa ? 'கருத்து சமர்ப்பிக்கப்பட்டது' : 'Feedback Submitted'}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenFeedback(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{isTa ? 'கருத்து தெரிவிக்கவும்' : 'Leave Feedback'}</span>
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
                      {isTa ? 'ஆர்டர் ரத்து செய்யப்பட்ட விவரம்:' : 'Order Cancelled Information:'}
                    </div>
                    <div>
                      {isTa ? 'ரத்து செய்தவர்:' : 'Cancelled by:'}{' '}
                      <strong className="text-slate-900">{order.cancelled_by}</strong>
                    </div>
                    <div>
                      {isTa ? 'காரணம்:' : 'Reason:'}{' '}
                      <strong className="text-slate-900">{order.cancellation_reason}</strong>
                    </div>
                  </div>
                )}

                {/* Footer Total */}
                <div className="pt-2 flex justify-between items-center text-sm border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold">
                    {isTa ? 'மொத்தத் தொகை:' : 'Total Amount:'}
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
                  <h3 className="text-base font-extrabold text-slate-900">
                    {isTa ? 'உணவு & டெலிவரி கருத்து' : 'Food & Delivery Feedback'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {isTa ? 'ஆர்டர் எண்' : 'Order #'} {feedbackOrder.order_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isTa ? 'மதிப்பீடு (1 முதல் 5 நட்சத்திரங்கள்) *' : 'Rating (1 to 5 Stars) *'}
                </label>
                <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-2xl border border-slate-200/80">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
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
                  {isTa
                    ? 'எழுத்துப்பூர்வ கருத்து / ஆலோசனைகள் (விருப்பத்தேர்வு)'
                    : 'Written Feedback / Comments (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    isTa
                      ? 'உணவு சுவை, தரம், அளவு அல்லது டெலிவரி சேவை பற்றிய உங்கள் கருத்தைப் பகிரவும்...'
                      : 'Share your thoughts about food taste, temperature, portion, or delivery service...'
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {feedbackLoading
                    ? isTa
                      ? 'சமர்ப்பிக்கப்படுகிறது...'
                      : 'Submitting...'
                    : isTa
                    ? 'கருத்தை சமர்ப்பிக்கவும்'
                    : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
