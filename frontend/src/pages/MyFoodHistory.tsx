import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { History, Calendar } from 'lucide-react';

export const MyFoodHistory: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            My Food History
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete record of all food items ordered during hospital stay.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading food history...</div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm font-medium">No food history records</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3">Food Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((record) => (
                  <tr key={record.order_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{record.order_id}</td>
                    <td className="px-4 py-3 text-gray-600">{record.order_date} {record.order_time}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{record.meal_type}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {record.items?.map((it: any) => (
                        <div key={it._id}>
                          {it.item_name_snapshot} × {it.quantity} (₹{it.unit_price})
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{record.total_amount}</td>
                    <td className="px-4 py-3 text-center">
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
