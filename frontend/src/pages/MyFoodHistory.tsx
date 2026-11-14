import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { StatusBadge } from '../components/StatusBadge';
import { History, Calendar, Utensils } from 'lucide-react';

export const MyFoodHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language, translateFood, translateCategory } = useLanguage();

  const isTa = language === 'ta';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/patient/food-history');
        setHistory(response.data);
      } catch (err) {
        console.error('Error fetching food history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-procare-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] font-black text-procare-800 uppercase tracking-wider">
            {t('appName')} • {t('clinicName')}
          </span>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
            <div className="p-1.5 rounded-lg bg-celadon text-slate-950">
              <History className="w-5 h-5" />
            </div>
            {isTa ? 'எனது உணவு வரலாறு மற்றும் பதிவுகள்' : 'MY FOOD HISTORY & MEAL LOGS'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'மருத்துவமனை தங்கியிருந்த காலத்தில் வைக்கப்பட்ட அனைத்து உணவு ஆர்டர்களின் முழுமையான வரலாறு.'
              : 'Complete history of all meal orders placed during hospital stay.'}
          </p>
        </div>

        <div className="text-xs bg-procare-50 border border-procare-200 px-3.5 py-2 rounded-xl text-procare-900 font-bold">
          {isTa ? 'மொத்த பதிவுகள்:' : 'Total Logged Orders:'}{' '}
          <strong className="text-procare-950 font-black">{history.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
          {isTa ? 'உணவு வரலாறு ஏற்றப்படுகிறது...' : 'Loading food history...'}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">
            {isTa ? 'உணவு வரலாற்றுப் பதிவுகள் எதுவும் இல்லை' : 'No Food History Records'}
          </p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {isTa
              ? 'நீங்கள் ஆர்டர் செய்த உணவுகள் மற்றும் பதிவுகள் இங்கே தோன்றும்.'
              : 'Your ordered meals and food records will be logged here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">{isTa ? 'ஆர்டர் எண்' : 'Order ID'}</th>
                  <th className="px-4 py-3">{isTa ? 'தேதி & நேரம்' : 'Date & Time'}</th>
                  <th className="px-4 py-3">{isTa ? 'உணவு வகை' : 'Meal'}</th>
                  <th className="px-4 py-3">{isTa ? 'உணவு விவரம்' : 'Food Items'}</th>
                  <th className="px-4 py-3 text-right">{isTa ? 'மொத்தத் தொகை' : 'Total Amount'}</th>
                  <th className="px-4 py-3 text-center">{isTa ? 'நிலை' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record.order_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700">{record.order_id}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {record.order_date}{' '}
                      <span className="text-slate-400">{isTa ? 'அன்று' : 'at'}</span> {record.order_time}
                    </td>
                    <td className="px-4 py-3.5 font-extrabold text-slate-800">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 text-[11px]">
                        {translateCategory(record.meal_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 space-y-1">
                      {record.items?.map((it: any) => (
                        <div key={it._id || it.item_name_snapshot} className="flex items-center gap-1.5 text-xs font-medium">
                          <Utensils className="w-3 h-3 text-procare-700 shrink-0" />
                          <span>
                            {translateFood(it.item_name_snapshot)} × <strong className="text-slate-900">{it.quantity}</strong> (₹{it.unit_price})
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3.5 text-right font-black text-slate-900 text-sm">₹{record.total_amount}</td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={record.order_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
