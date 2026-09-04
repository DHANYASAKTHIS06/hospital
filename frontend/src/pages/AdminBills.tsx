import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Bill, PatientRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Plus, Printer, X, Check } from 'lucide-react';

export const AdminBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchBillsAndPatients = async () => {
    try {
      const [billsRes, patientsRes] = await Promise.all([
        api.get('/admin/bills'),
        api.get('/admin/patients'),
      ]);
      setBills(billsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error fetching admin bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillsAndPatients();

    const now = new Date();
    const monthYear = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    setBillingPeriod(monthYear);
  }, []);

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select a patient.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/bills/generate', {
        patient_id: selectedPatientId,
        billing_period: billingPeriod,
        advance_amount: Number(advanceAmount),
      });

      setModalOpen(false);
      fetchBillsAndPatients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Bill Management (Admin)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate patient food bills and monthly billing statements.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Bill</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-gray-300"
          >
            <Printer className="w-4 h-4" />
            <span>Print All</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading bill records...</div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No bills generated yet. Click "Generate New Bill" to compile unbilled food orders.
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
                  <h2 className="text-lg font-bold text-gray-900">HOSPITAL CANTEEN BILL</h2>
                  <div className="text-xs text-gray-700 font-semibold mt-1">
                    Bill ID: <span className="font-mono text-blue-700 font-bold">{bill.bill_id}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Patient: <strong className="text-gray-900">{bill.patient_name}</strong> ({bill.patient_id}) • Room {bill.room_number}
                  </div>
                  <div className="text-xs text-gray-500">Billing Period: {bill.billing_period}</div>
                </div>

                <div className="text-right space-y-1">
                  <StatusBadge status={bill.payment_status} type="payment" />
                  <div className="text-xs text-gray-500">Date: {bill.billing_date}</div>
                  <div className="text-xs text-gray-500">Due: {bill.due_date}</div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider">Orders Included</h4>
                {bill.orders?.map((order) => (
                  <div key={order._id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
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

              {/* Bill Totals */}
              <div className="pt-4 border-t border-gray-200 space-y-1.5 text-xs font-mono text-right max-w-xs ml-auto">
                <div className="flex justify-between text-gray-700">
                  <span>Total Bill Amount:</span>
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

      {/* Generate Bill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Generate Patient Bill</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBill} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.name} ({p.patient_id}) - Room {p.room_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Billing Period Title *</label>
                <input
                  type="text"
                  required
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  placeholder="e.g. September 2026 or 04-09-2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Initial Advance Payment (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Compiling Bill...' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
