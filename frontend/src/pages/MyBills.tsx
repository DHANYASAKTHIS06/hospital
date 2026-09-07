import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Printer } from 'lucide-react';

export const MyBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await api.get('/patient/bills');
        setBills(response.data);
      } catch (err) {
        console.error('Error fetching bills:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            My Hospital Canteen Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Detailed breakdown of canteen food bills issued during hospital stay.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
        >
          <Printer className="w-4 h-4" />
          <span>Print Bills</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">Loading bills...</div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Bills Generated Yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 sm:p-6 print-area space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-4 gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">HOSPITAL CANTEEN BILL</h2>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    Bill ID: <strong className="font-mono text-slate-900 font-bold">{bill.bill_id}</strong>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">Billing Period: {bill.billing_period}</div>
                </div>

                <div className="sm:text-right space-y-1 w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                  <StatusBadge status={bill.payment_status} type="payment" />
                  <div className="text-xs text-slate-500 font-medium">Due Date: {bill.due_date}</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Orders Included</h4>
                {bill.orders?.map((order) => (
                  <div key={order._id} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800 mb-1">
                      <span className="font-mono text-blue-700">Order #{order.order_id} ({order.order_date})</span>
                      <span>Total: ₹{order.total_amount}</span>
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium">
                      {order.items?.map((it) => (
                        <div key={it._id} className="flex justify-between">
                          <span>{it.item_name_snapshot} × {it.quantity}</span>
                          <span className="font-semibold text-slate-800">₹{it.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs font-mono text-right max-w-xs ml-auto">
                <div className="flex justify-between text-slate-700">
                  <span>Total Amount:</span>
                  <span className="font-bold text-slate-900">₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Amount:</span>
                  <span className="font-bold">₹{bill.advance_amount}</span>
                </div>
                <div className="flex justify-between text-rose-700 border-t border-slate-200/80 pt-1 text-sm font-sans">
                  <span className="font-bold">Remaining Balance:</span>
                  <span className="font-extrabold font-mono text-base">₹{bill.remaining_amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
