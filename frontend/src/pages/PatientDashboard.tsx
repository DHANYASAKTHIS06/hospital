import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { FoodOrder, Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Utensils, ShoppingBag, CreditCard, Clock, FileText, ArrowRight, UserCheck, Phone, Bed } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [activeOrders, setActiveOrders] = useState<FoodOrder[]>([]);
  const [latestBill, setLatestBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const ordersRes = await api.get('/patient/orders');
      const active = ordersRes.data.filter(
        (o: FoodOrder) => o.order_status !== 'DELIVERED' && o.order_status !== 'CANCELLED'
      );
      setActiveOrders(active);

      const billsRes = await api.get('/patient/bills');
      if (billsRes.data && billsRes.data.length > 0) {
        setLatestBill(billsRes.data[0]);
      }
    } catch (err) {
      console.error('Error loading patient dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('order_status_updated', () => fetchData());
      socket.on('delivery_status_updated', () => fetchData());
      socket.on('payment_status_updated', () => fetchData());

      return () => {
        socket.off('order_status_updated');
        socket.off('delivery_status_updated');
        socket.off('payment_status_updated');
      };
    }
  }, [socket]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Patient Welcome Header Card */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider bg-white/15 text-blue-100 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
              Patient Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              Welcome, {user?.name || 'Patient'}
            </h1>

            {/* Quick Details Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10">
                <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                <span>ID: <strong className="font-mono text-white">{user?.patient_id || 'N/A'}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10">
                <Bed className="w-3.5 h-3.5 text-blue-200" />
                <span>Room: <strong className="text-white">{user?.room_number || 'N/A'}</strong></span>
              </div>
              {user?.mobile && (
                <div className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10">
                  <Phone className="w-3.5 h-3.5 text-blue-200" />
                  <span>Mob: <strong className="text-white">{user.mobile}</strong></span>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/patient/menu"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-blue-50 text-blue-800 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 shrink-0"
          >
            <Utensils className="w-4 h-4 text-blue-700" />
            <span>View Menu & Order</span>
          </Link>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Active Orders Widget */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                Active Food Orders
              </h2>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                {activeOrders.length} Active
              </span>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center animate-pulse">
                Loading active orders...
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No Active Food Orders</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Select fresh meals from the canteen menu to place your daily order.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <div key={order._id} className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-700">{order.order_id}</span>
                        <div className="text-[11px] text-slate-500 font-medium">{order.order_date} • {order.order_time}</div>
                      </div>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="text-xs text-slate-700 font-medium">
                      {order.items?.map((item) => (
                        <span key={item._id} className="inline-block bg-white border border-slate-200 px-2 py-0.5 rounded-md mr-1.5 mb-1 text-[11px]">
                          {item.item_name_snapshot} × <strong>{item.quantity}</strong>
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">Total: ₹{order.total_amount}</span>
                      <Link
                        to="/patient/orders"
                        className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        <span>Track Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link to="/patient/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              <span>View Full Order History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Current Bill & Payment Status Widget */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                Bill & Payment Status
              </h2>
              {latestBill && <StatusBadge status={latestBill.payment_status} type="payment" />}
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 py-6 text-center animate-pulse">
                Loading billing details...
              </div>
            ) : !latestBill ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">No Bills Generated Yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Bills will appear here once generated by the hospital canteen administration.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Bill ID:</span>
                    <span className="font-bold text-slate-900 font-mono">{latestBill.bill_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Period:</span>
                    <span className="text-slate-800 font-medium">{latestBill.billing_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Due Date:</span>
                    <span className="text-slate-800 font-medium">{latestBill.due_date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Bill</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">₹{latestBill.total_amount}</div>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                    <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Advance Paid</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">₹{latestBill.advance_amount}</div>
                  </div>
                  <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60">
                    <div className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">Remaining</div>
                    <div className="text-sm font-black text-rose-700 mt-0.5">₹{latestBill.remaining_amount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-right">
            <Link to="/patient/payment-status" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              <span>View Detailed Payment Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
