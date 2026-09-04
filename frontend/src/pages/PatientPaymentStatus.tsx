import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/StatusBadge';
import { CreditCard, AlertCircle, ShieldAlert } from 'lucide-react';

export const PatientPaymentStatus: React.FC = () => {
  const [data, setData] = useState<{ bills: any[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchPaymentStatus = async () => {
    try {
      const response = await api.get('/patient/payment-status');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching payment status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentStatus();

    if (socket) {
      socket.on('payment_status_updated', () => fetchPaymentStatus());
      return () => {
        socket.off('payment_status_updated');
      };
    }
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment Status
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View food bill payment status and outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Payment status is strictly managed by Hospital Canteen Admin</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading payment status...</div>
      ) : !data || data.bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
          <CreditCard className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium">No payment records found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Total Billed Amount</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">₹{data.summary.total_billed}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Advance Paid</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">₹{data.summary.total_advance}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-500">Total Remaining Balance</span>
              <div className="text-2xl font-bold text-rose-700 mt-1">₹{data.summary.total_remaining}</div>
            </div>
          </div>

          {/* Bills List (Read-Only) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800">Canteen Payment Statements</h3>
              <span className="text-xs text-gray-500">Read-Only View</span>
            </div>

            <div className="divide-y divide-gray-200">
              {data.bills.map((bill: any) => (
                <div key={bill._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-blue-700">{bill.bill_id}</span>
                      <span className="text-xs text-gray-500">Period: {bill.billing_period}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Billing Date: {bill.billing_date} • Due Date: {bill.due_date}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right text-xs">
                      <div className="text-gray-500">Total: <strong className="text-gray-900">₹{bill.total_amount}</strong></div>
                      <div className="text-emerald-700 font-medium">Advance: ₹{bill.advance_amount}</div>
                      <div className="text-rose-700 font-bold">Remaining: ₹{bill.remaining_amount}</div>
                    </div>

                    <StatusBadge status={bill.payment_status} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
