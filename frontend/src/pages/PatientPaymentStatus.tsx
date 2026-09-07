import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/StatusBadge';
import { CreditCard, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            Payment Status
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            View food bill payment status and outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200/80 font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Managed by Canteen Admin</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">Loading payment status...</div>
      ) : !data || data.bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Payment Records Found</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Billed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{data.summary.total_billed}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Advance Paid</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">₹{data.summary.total_advance}</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs bg-rose-50/20">
              <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider">Remaining Balance</span>
              <div className="text-2xl font-black text-rose-700 mt-1">₹{data.summary.total_remaining}</div>
            </div>
          </div>

          {/* Bills List (Read-Only) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Canteen Payment Statements</h3>
              <span className="text-[11px] text-slate-400 font-semibold">Read-Only View</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.bills.map((bill: any) => (
                <div key={bill._id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-700">{bill.bill_id}</span>
                      <span className="text-xs text-slate-500 font-medium">Period: {bill.billing_period}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Billing Date: {bill.billing_date} • Due Date: {bill.due_date}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-left sm:text-right text-xs">
                      <div className="text-slate-500">Total: <strong className="text-slate-900">₹{bill.total_amount}</strong></div>
                      <div className="text-emerald-700 font-semibold">Advance: ₹{bill.advance_amount}</div>
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
