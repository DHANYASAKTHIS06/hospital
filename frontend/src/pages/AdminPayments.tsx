import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bill, PaymentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CreditCard, Search, Edit3, ShieldCheck, AlertCircle, Clock } from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>('UNPAID');
  const [newAdvance, setNewAdvance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { socket } = useSocket();

  const fetchPayments = async () => {
    try {
      const response = await api.get('/admin/payments');
      setBills(response.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    if (socket) {
      socket.on('payment_status_updated', () => fetchPayments());
      return () => {
        socket.off('payment_status_updated');
      };
    }
  }, [socket]);

  const openUpdateModal = (bill: Bill) => {
    setEditingBill(bill);
    setNewStatus(bill.payment_status);
    setNewAdvance(String(bill.advance_amount));
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    setSubmitting(true);
    try {
      await api.put(`/admin/payments/${editingBill.bill_id}/status`, {
        payment_status: newStatus,
        advance_amount: Number(newAdvance),
      });

      setEditingBill(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update payment status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.bill_id.toLowerCase().includes(q) ||
      b.patient_id.toLowerCase().includes(q) ||
      (b.patient_name && b.patient_name.toLowerCase().includes(q)) ||
      (b.room_number && b.room_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment Status Management (Admin Only)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Admin exclusive authorization to update patient payment statuses and recorded advances.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Patient ID, Name, Room, Bill ID..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading payment records...</div>
      ) : filteredBills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No payment records found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Bill ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Bill Amount</th>
                  <th className="px-4 py-3 text-right">Advance Paid</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{b.bill_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{b.patient_name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{b.patient_id}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">Room {b.room_number}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {b.due_date}
                      {b.payment_status !== 'PAID' && (
                        <div className="text-[10px] text-amber-700 flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Payment due soon
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{b.total_amount}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{b.advance_amount}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700">₹{b.remaining_amount}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={b.payment_status} type="payment" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openUpdateModal(b)}
                        className="bg-slate-900 hover:bg-black text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Payment Status Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Update Payment #{editingBill.bill_id}
              </h3>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 font-mono">
                <div className="flex justify-between text-gray-700">
                  <span>Patient:</span>
                  <span className="font-bold">{editingBill.patient_name} ({editingBill.patient_id})</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Total Bill:</span>
                  <span className="font-bold text-gray-900">₹{editingBill.total_amount}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Payment Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="ADVANCE">ADVANCE</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={editingBill.total_amount}
                  value={newAdvance}
                  onChange={(e) => setNewAdvance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg font-bold text-white bg-slate-900 hover:bg-black shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Payment Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
