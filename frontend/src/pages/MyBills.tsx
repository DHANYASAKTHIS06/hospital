import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Bill } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FileText, Printer, Calendar } from 'lucide-react';

export const MyBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language, translateFood, translateCategory } = useLanguage();

  const isTa = language === 'ta';

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
      <div className="bg-white p-5 rounded-2xl border border-procare-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            {t('appName')} • {t('clinicName')}
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <div className="p-1.5 rounded-lg bg-celadon text-slate-950">
              <FileText className="w-5 h-5" />
            </div>
            {isTa ? 'எனது தினசரி கேன்டீன் ரசீதுகள்' : 'MY DAY-WISE CANTEEN BILLS'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'மருத்துவமனை தங்கியிருந்த காலத்தில் வழங்கப்பட்ட கேன்டீன் உணவு ரசீதுகளின் விரிவான தினசரி விவரம்.'
              : 'Detailed day-wise breakdown of canteen food bills issued during hospital stay.'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto bg-celadon hover:bg-procare-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{isTa ? 'ரசீதை அச்சிடுக' : 'Print Bills'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
          {isTa ? 'ரசீதுகள் ஏற்றப்படுகின்றன...' : 'Loading bills...'}
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-procare-50 flex items-center justify-center mx-auto text-procare-700">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">{t('noBillsGenerated')}</p>
          <p className="text-xs text-slate-400">{t('noBillsGeneratedSub')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 sm:p-6 print-area space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-procare-200 pb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <img
                    src="/procare-logo.png"
                    alt="ProCare Logo"
                    className="h-10 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                      {t('appName')} • {t('clinicName')}
                    </h2>
                    <p className="text-xs text-procare-800 font-extrabold uppercase tracking-wide">
                      {isTa ? 'கேன்டீன் இறுதி அறிக்கை' : 'CANTEEN FINAL STATEMENT'}
                    </p>
                    <div className="text-xs text-slate-500 mt-0.5 font-medium">
                      {isTa ? 'ரசீது எண்:' : 'Bill ID:'}{' '}
                      <strong className="font-mono text-procare-900 font-bold">{bill.bill_id}</strong>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {isTa ? 'காலம்:' : 'Billing Period:'} {bill.billing_period}
                    </div>
                  </div>
                </div>

                <div className="sm:text-right space-y-1 w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                  <StatusBadge status={bill.payment_status} type="payment" />
                  <div className="text-xs text-slate-500 font-medium">
                    {isTa ? 'கடைசி தேதி:' : 'Due Date:'} {bill.due_date}
                  </div>
                </div>
              </div>

              {/* Day-Wise Breakdown */}
              {bill.day_wise_breakdown && bill.day_wise_breakdown.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {isTa ? 'தினசரி உணவு விவரங்கள்' : 'DAY-WISE FOOD BREAKDOWN'}
                  </h4>
                  <div className="space-y-3">
                    {bill.day_wise_breakdown.map((dayGroup, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <div className="bg-slate-900 text-white px-3.5 py-1.5 flex justify-between items-center font-bold">
                          <span>📅 {isTa ? 'தேதி:' : 'Date:'} {dayGroup.date}</span>
                          <span className="bg-emerald-600 text-white font-mono px-2 py-0.5 rounded text-[11px] font-black">
                            {isTa ? 'நாள் மொத்தம்:' : 'Day Total:'} ₹{dayGroup.day_total}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 space-y-2">
                          {dayGroup.orders.map((o) => (
                            <div key={o.order_id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center font-bold text-slate-800 border-b border-slate-100 pb-1">
                                <span className="font-mono text-blue-700">
                                  {o.order_id} ({translateCategory(o.meal_type)} {isTa ? 'அன்று' : 'at'} {o.order_time})
                                </span>
                                <span className="font-extrabold text-slate-900">₹{o.total_amount}</span>
                              </div>
                              <div className="space-y-0.5 pt-1 text-slate-700 font-medium">
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
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {isTa ? 'சேர்க்கப்பட்ட ஆர்டர்கள்' : 'Orders Included'}
                  </h4>
                  {bill.orders?.map((order) => (
                    <div key={order._id} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-800 mb-1">
                        <span className="font-mono text-blue-700">
                          {isTa ? 'ஆர்டர் எண்' : 'Order #'} {order.order_id} ({order.order_date})
                        </span>
                        <span>{isTa ? 'மொத்தம்:' : 'Total:'} ₹{order.total_amount}</span>
                      </div>
                      <div className="space-y-1 text-slate-600 font-medium">
                        {order.items?.map((it) => (
                          <div key={it._id} className="flex justify-between">
                            <span>{translateFood(it.item_name_snapshot)} × {it.quantity}</span>
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
                  <span>{isTa ? 'மொத்த பில் தொகை:' : 'Total Bill Amount:'}</span>
                  <span className="font-bold text-slate-900">₹{bill.total_amount}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>{isTa ? 'முன்பணக் கட்டணம்:' : 'Advance Payment:'}</span>
                  <span className="font-bold">₹{bill.advance_amount}</span>
                </div>
                <div className="flex justify-between text-rose-700 border-t border-slate-200/80 pt-1 text-sm font-sans">
                  <span className="font-bold">{isTa ? 'செலுத்த வேண்டிய மீதித் தொகை:' : 'Remaining Balance Due:'}</span>
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
