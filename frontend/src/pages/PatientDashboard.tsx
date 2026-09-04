import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import { FoodOrder, Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Utensils, ShoppingBag, CreditCard, UserCheck, Clock, FileText } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Patient Welcome Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Welcome, {user?.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-1 font-medium">
            <span className="bg-gray-100 px-2.5 py-1 rounded-md">
              Patient ID: <strong className="text-gray-900 font-mono">{user?.patient_id}</strong>
            </span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-md">
              Room No: <strong className="text-gray-900">{user?.room_number}</strong>
            </span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-md">
              Mobile: <strong className="text-gray-900">{user?.mobile}</strong>
            </span>
          </div>
        </div>

        <Link
          to="/patient/menu"
          className="inline-flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Utensils className="w-4 h-4" />
          <span>View Menu & Order</span>
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Orders Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                Active Food Orders
              </h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {activeOrders.length} active
              </span>
            </div>

            {loading ? (
              <div className="text-xs text-gray-500 py-4">Loading active orders...</div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 space-y-2">
                <Clock className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-medium">No active food orders</p>
                <p className="text-xs text-gray-400">Order fresh meal items directly from the canteen menu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-700">{order.order_id}</span>
                        <div className="text-xs text-gray-500">{order.order_date} • {order.order_time}</div>
                      </div>
                      <StatusBadge status={order.order_status} />
                    </div>

                    <div className="text-xs text-gray-700 font-medium">
                      {order.items?.map((item) => (
                        <span key={item._id} className="mr-3">
                          {item.item_name_snapshot} × {item.quantity}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">Total: ₹{order.total_amount}</span>
                      <Link
                        to="/patient/orders"
                        className="text-blue-700 font-semibold hover:underline"
                      >
                        Track / Confirm Delivery →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 text-right">
            <Link to="/patient/orders" className="text-xs font-semibold text-blue-700 hover:underline">
              View All Orders History →
            </Link>
          </div>
        </div>

        {/* Current Bill & Payment Status Widget */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Current Bill & Payment Status
              </h2>
              {latestBill && <StatusBadge status={latestBill.payment_status} type="payment" />}
            </div>

            {loading ? (
              <div className="text-xs text-gray-500 py-4">Loading billing details...</div>
            ) : !latestBill ? (
              <div className="text-center py-8 text-gray-500 space-y-2">
                <FileText className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-medium">No billing records generated yet</p>
                <p className="text-xs text-gray-400">Bills will be generated by the hospital canteen admin.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Bill ID:</span>
                    <span className="font-bold text-gray-900">{latestBill.bill_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="text-gray-900">{latestBill.billing_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="text-gray-900">{latestBill.due_date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Total Bill</div>
                    <div className="text-sm font-bold text-gray-900">₹{latestBill.total_amount}</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Advance Paid</div>
                    <div className="text-sm font-bold text-emerald-700">₹{latestBill.advance_amount}</div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div className="text-sm font-bold text-rose-700">₹{latestBill.remaining_amount}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 text-right">
            <Link to="/patient/payment-status" className="text-xs font-semibold text-blue-700 hover:underline">
              View Detailed Payment Status →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
