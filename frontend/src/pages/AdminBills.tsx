import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Bill, PatientRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Plus, Printer, X, Calendar } from 'lucide-react';

export const AdminBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { t, language, translateFood, translateCategory } = useLanguage();
  const isTa = language === 'ta';

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
    const monthYear = `${now.toLocaleString(isTa ? 'ta-IN' : 'default', { month: 'long' })} ${now.getFullYear()}`;
    setBillingPeriod(monthYear);
  }, [isTa]);

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert(isTa ? 'தயவுசெய்து ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.' : 'Please select a patient.');
      return;
    }

    const patientObj = patients.find((p) => p.patient_id === selectedPatientId);

    setSubmitting(true);
    try {
      await api.post('/admin/bills/generate', {
        patient_id: selectedPatientId,
        billing_period: billingPeriod,
        advance_amount: patientObj ? patientObj.advance_balance || 0 : 0,
      });

      setModalOpen(false);
      fetchBillsAndPatients();
    } catch (err: any) {
      alert(err.response?.data?.message || (isTa ? 'பில் உருவாக்குவதில் தோல்வி.' : 'Failed to generate bill.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-procare-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            {t('appName')} • {t('clinicName')}
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <FileText className="w-5 h-5 text-procare-700" />
            {isTa ? 'தினசரி நோயாளி ரசீது மேலாண்மை (நிர்வாகி)' : 'Day-Wise Patient Bill Management (Admin)'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'நோயாளி விடுவிக்கப்படும் போது வரலாற்று உணவு ஆர்டர்களை தினசரி பில்லிங் அறிக்கைகளாக தொகுக்கவும்.'
              : 'Compile historical patient food orders into day-wise billing statements upon patient discharge.'}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-celadon hover:bg-procare-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{isTa ? 'டிஸ்சார்ஜ் பில் உருவாக்கு' : 'Generate Discharge Bill'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isTa ? 'அனைத்து பில்களையும் அச்சிடு' : 'Print All Bills'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs font-semibold">
          {isTa ? 'ரசீது பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading bill records...'}
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
          {isTa
            ? 'ரசீதுகள் எதுவும் இன்னும் உருவாக்கப்படவில்லை. நோயாளியின் உணவு ஆர்டர்களைத் தொகுக்க "டிஸ்சார்ஜ் பில் உருவாக்கு" என்பதைக் கிளிக் செய்யவும்.'
            : 'No bills generated yet. Click "Generate Discharge Bill" to compile a patient\'s historical food orders.'}
        </div>
      ) : (
        <div className="space-y-6">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 print-area space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-procare-200 pb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="/procare-logo.png"
                    alt="ProCare Logo"
                    className="h-12 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                      {t('appName')} • {t('clinicName')}
                    </h2>
                    <p className="text-xs text-procare-800 font-extrabold uppercase tracking-wide">
                      {isTa ? 'கேன்டீன் இறுதி டிஸ்சார்ஜ் அறிக்கை' : 'CANTEEN FINAL DISCHARGE STATEMENT'}
                    </p>
                    <div className="text-xs text-slate-700 font-semibold mt-1">
                      {isTa ? 'ரசீது எண்:' : 'Bill ID:'}{' '}
                      <span className="font-mono text-procare-900 font-bold">{bill.bill_id}</span>
                    </div>
                    <div className="text-xs text-slate-700 font-bold mt-0.5">
                      {isTa ? 'நோயாளி:' : 'Patient:'}{' '}
                      <strong className="text-slate-900 font-black">{bill.patient_name}</strong> ({bill.patient_id}) • {isTa ? 'அறை' : 'Room'} #{bill.room_number}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {isTa ? 'பில்லிங் காலம்:' : 'Billing Period:'} {bill.billing_period}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <StatusBadge status={bill.payment_status} type="payment" />
                  <div className="text-xs text-slate-500 font-medium">
                    {isTa ? 'ரசீது தேதி:' : 'Bill Date:'} {bill.billing_date}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {isTa ? 'கடைசி தேதி:' : 'Due Date:'} {bill.due_date}
                  </div>
                </div>
              </div>

              {/* DAY-WISE BREAKDOWN TABLE */}
              {bill.day_wise_breakdown && bill.day_wise_breakdown.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    {isTa ? 'தினசரி உணவு விவரங்கள்' : 'DAY-WISE FOOD BREAKDOWN'}
                  </h4>
                  <div className="space-y-3">
                    {bill.day_wise_breakdown.map((dayGroup, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <span>📅 {isTa ? 'தேதி:' : 'Date:'} {dayGroup.date}</span>
                          </span>
                          <span className="bg-emerald-600 text-white font-mono px-2.5 py-0.5 rounded font-black">
                            {isTa ? 'நாள் மொத்தம்:' : 'Day Total:'} ₹{dayGroup.day_total}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 space-y-2">
                          {dayGroup.orders.map((o) => (
                            <div key={o.order_id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                              <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-100 pb-1">
                                <span className="font-mono text-blue-700">
                                  {o.order_id} ({translateCategory(o.meal_type)} {isTa ? 'அன்று' : 'at'} {o.order_time})
                                </span>
                                <span className="font-extrabold text-slate-900">₹{o.total_amount}</span>
                              </div>
                              <div className="space-y-0.5 pt-1 text-slate-700">
                                {o.items?.map((it: any) => (
                                  <div key={it._id || it.item_name_snapshot} className="flex justify-between text-[11px]">
                                    <span>{translateFood(it.item_name_snapshot)} × {it.quantity}</span>
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
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-gray-700 uppercase tracking-wider">
                    {isTa ? 'சேர்க்கப்பட்ட ஆர்டர்கள்' : 'Orders Included'}
                  </h4>
                  {bill.orders?.map((order) => (
                    <div key={order._id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between font-bold text-gray-800 mb-1">
                        <span>{isTa ? 'ஆர்டர் எண்' : 'Order #'} {order.order_id} ({order.order_date})</span>
                        <span>{isTa ? 'மொத்தம்:' : 'Total:'} ₹{order.total_amount}</span>
                      </div>
                      <div className="space-y-0.5 text-gray-600">
                        {order.items?.map((it) => (
                          <div key={it._id} className="flex justify-between">
                            <span>{translateFood(it.item_name_snapshot)} × {it.quantity}</span>
                            <span>₹{it.subtotal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bill Totals Summary */}
              <div className="pt-4 border-t border-gray-200 space-y-1.5 text-xs font-mono text-right max-w-xs ml-auto">
                <div className="flex justify-between text-gray-700">
                  <span>{isTa ? 'மொத்த உணவு பில் தொகை:' : 'Total Food Bill Amount:'}</span>
                  <span className="font-bold text-gray-900 text-sm">₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>{isTa ? 'நோயாளி செலுத்திய முன்பணம்:' : 'Patient Advance Payment:'}</span>
                  <span className="font-bold">₹{bill.advance_amount}</span>
                </div>
                <div className="flex justify-between text-rose-700 border-t border-gray-200 pt-1 text-sm">
                  <span className="font-bold">{isTa ? 'செலுத்த வேண்டிய மீதித் தொகை:' : 'Remaining Amount Due:'}</span>
                  <span className="font-black text-base">₹{bill.remaining_amount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Bill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {isTa ? 'நோயாளி டிஸ்சார்ஜ் பில் உருவாக்கு' : 'Generate Patient Discharge Bill'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBill} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? 'நோயாளியைத் தேர்ந்தெடுக்கவும் *' : 'Select Patient *'}
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{isTa ? '-- நோயாளியைத் தேர்ந்தெடுக்கவும் --' : '-- Choose Patient --'}</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.name} ({p.patient_id}) - {isTa ? 'அறை' : 'Room'} #{p.room_number} [{isTa ? 'முன்பணம்' : 'Advance'}: ₹{p.advance_balance || 0}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {isTa ? 'பில்லிங் காலத் தலைப்பு *' : 'Billing Period Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  placeholder="e.g. October 2026 Discharge Bill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? isTa
                      ? 'தொகுக்கப்படுகிறது...'
                      : 'Compiling Day-Wise Bill...'
                    : isTa
                    ? 'பில் உருவாக்கு'
                    : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
