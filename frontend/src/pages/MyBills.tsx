import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Printer, Calendar } from 'lucide-react';

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
            My Day-Wise Canteen Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Detailed day-wise breakdown of canteen food bills issued during hospital stay.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
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

              {/* Day-Wise Breakdown */}
              {bill.day_wise_breakdown && bill.day_wise_breakdown.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    DAY-WISE FOOD BREAKDOWN
                  </h4>
                  <div className="space-y-3">
                    {bill.day_wise_breakdown.map((dayGroup, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <div className="bg-slate-900 text-white px-3.5 py-1.5 flex justify-between items-center font-bold">
                          <span>📅 Date: {dayGroup.date}</span>
                          <span className="bg-emerald-600 text-white font-mono px-2 py-0.5 rounded text-[11px] font-black">
                            Day Total: ₹{dayGroup.day_total}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 space-y-2">
                          {dayGroup.orders.map((o) => (
                            <div key={o.order_id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-100 pb-1">
                                <span className="font-mono text-blue-700">{o.order_id} ({o.meal_type} at {o.order_time})</span>
                                <span className="font-extrabold text-slate-900">₹{o.total_amount}</span>
                              </div>
                              <div className="space-y-0.5 pt-1 text-slate-700 font-medium">
                                {o.items?.map((it: any) => (
                                  <div key={it._id || it.item_name_snapshot} className="flex justify-between text-[11px]">
                                    <span>{it.item_name_snapshot} × {it.quantity}</span>
                                    <span className="font-semibold text-slate-800">₹{it.subtotal}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
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
              )}

              {/* Bill Summary Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs font-mono text-right max-w-xs ml-auto">
                <div className="flex justify-between text-slate-700">
                  <span>Total Bill Amount:</span>
                  <span className="font-bold text-slate-900">₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Payment:</span>
                  <span className="font-bold">₹{bill.advance_amount}</span>
                </div>
                <div className="flex justify-between text-rose-700 border-t border-slate-200/80 pt-1 text-sm font-sans">
                  <span className="font-bold">Remaining Balance Due:</span>
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
