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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center no-print">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            My Hospital Canteen Bills
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Detailed breakdown of canteen food bills issued during hospital stay.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-gray-300"
        >
          <Printer className="w-4 h-4" />
          <span>Print Bills</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading bills...</div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium">No bills generated yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 print-area space-y-4"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">HOSPITAL CANTEEN BILL</h2>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Bill ID: <strong className="font-mono text-gray-900">{bill.bill_id}</strong>
                  </div>
                  <div className="text-xs text-gray-500">Billing Period: {bill.billing_period}</div>
                </div>

                <div className="text-right space-y-1">
                  <StatusBadge status={bill.payment_status} type="payment" />
                  <div className="text-xs text-gray-500">Bill Date: {bill.billing_date}</div>
                  <div className="text-xs text-gray-500">Due Date: {bill.due_date}</div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Orders Included</h4>
                {bill.orders?.map((order) => (
                  <div key={order._id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                    <div className="flex justify-between font-bold text-gray-800 mb-1">
                      <span>Order #{order.order_id} ({order.order_date})</span>
                      <span>Total: ₹{order.total_amount}</span>
                    </div>
                    <div className="space-y-0.5 text-gray-600">
                      {order.items?.map((it) => (
                        <div key={it._id} className="flex justify-between">
                          <span>{it.item_name_snapshot} × {it.quantity}</span>
                          <span>₹{it.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Summary Footer */}
              <div className="pt-4 border-t border-gray-200 space-y-1.5 text-xs font-mono text-right max-w-xs ml-auto">
                <div className="flex justify-between text-gray-700">
                  <span>Total Amount:</span>
                  <span className="font-bold text-gray-900">₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Amount:</span>
                  <span className="font-bold">₹{bill.advance_amount}</span>
                </div>
                <div className="flex justify-between text-rose-700 border-t border-gray-200 pt-1 text-sm">
                  <span className="font-bold">Remaining Amount:</span>
                  <span className="font-bold">₹{bill.remaining_amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
