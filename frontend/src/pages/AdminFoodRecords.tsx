import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { History, Filter, RefreshCw } from 'lucide-react';

export const AdminFoodRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState('');
  const [patientId, setPatientId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [mealType, setMealType] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/food-records', {
        params: {
          date: date || undefined,
          patient_id: patientId || undefined,
          room_number: roomNumber || undefined,
          meal_type: mealType || undefined,
        },
      });
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching food records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [date, patientId, roomNumber, mealType]);

  const handleReset = () => {
    setDate('');
    setPatientId('');
    setRoomNumber('');
    setMealType('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Admin Food Records Log
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit and filter all food orders placed across hospital rooms.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Filter Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="DD/MM/YYYY"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Patient ID</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value.toUpperCase())}
            placeholder="e.g. P20260001"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md uppercase font-mono focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Room Number</label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 204"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Meal Type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Meals</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
            <option value="Tea / Coffee">Tea / Coffee</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1 border border-gray-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading food records...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No food records match the specified filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3">Food Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{r.patient_id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{r.patient_name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">Room {r.room_number}</td>
                    <td className="px-4 py-3 text-gray-600">{r.order_date} {r.order_time}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.meal_type}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.items?.map((it: any) => (
                        <div key={it._id}>
                          {it.item_name_snapshot} × {it.quantity} (₹{it.subtotal})
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{r.total_amount}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={r.order_status} />
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
