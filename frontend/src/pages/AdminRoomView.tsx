import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Home, Printer, Search, Calendar } from 'lucide-react';

export const AdminRoomView: React.FC = () => {
  const [date, setDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('204');
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-GB');
    setDate(today);
  }, []);

  const fetchRoomRecords = async (targetDate: string, targetRoom: string) => {
    if (!targetDate || !targetRoom) return;
    setLoading(true);
    try {
      const response = await api.get('/admin/room-food-records', {
        params: {
          date: targetDate,
          room_number: targetRoom,
        },
      });
      setRoomData(response.data);
    } catch (err) {
      console.error('Error fetching room records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (date && roomNumber) {
      fetchRoomRecords(date, roomNumber);
    }
  }, [date, roomNumber]);

  return (
    <div className="space-y-6">
      {/* Header Controls (Hidden on print) */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Room-wise Daily Food View & Printable Report
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View room-specific food items delivered per patient for printing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="DD/MM/YYYY"
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs w-28 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-gray-700">Room No:</span>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 204"
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs w-24 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>[PRINT REPORT]</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading room food records...</div>
      ) : !roomData || !roomData.patients || roomData.patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No food records registered for Room <strong>{roomNumber}</strong> on date <strong>{date}</strong>.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm print-area space-y-6">
          {/* Print Document Header */}
          <div className="border-b-2 border-gray-900 pb-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 uppercase">HOSPITAL CANTEEN DAILY ROOM FOOD RECORD</h2>
            <div className="flex justify-center items-center space-x-8 text-xs font-semibold text-gray-700 mt-2">
              <span>Date: <strong className="font-mono">{roomData.date}</strong></span>
              <span>Room Number: <strong className="text-blue-700">{roomData.room_number}</strong></span>
            </div>
          </div>

          {/* Patients Breakdown */}
          <div className="space-y-6 divide-y divide-gray-200">
            {roomData.patients.map((p: any) => (
              <div key={p.patient_id} className="pt-4 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-xs flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 font-semibold">Patient ID:</span>{' '}
                    <strong className="text-blue-800 font-bold">{p.patient_id}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">Patient Name:</span>{' '}
                    <strong className="text-gray-900 font-bold">{p.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">Room No:</span>{' '}
                    <strong className="text-gray-900 font-bold">{p.room_number}</strong>
                  </div>
                </div>

                {p.orders?.map((order: any) => (
                  <div key={order.order_id} className="pl-4 space-y-2 text-xs">
                    <div className="font-semibold text-gray-800 uppercase tracking-wider flex justify-between">
                      <span>Meal: {order.meal_type} (Order #{order.order_id})</span>
                      <span>Order Amount: ₹{order.total_amount}</span>
                    </div>

                    <ul className="list-disc pl-5 space-y-1 text-gray-700 font-medium">
                      {order.items?.map((it: any) => (
                        <li key={it._id}>
                          {it.item_name_snapshot} - {it.quantity} - ₹{it.subtotal}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="text-right text-xs font-bold text-gray-900 pt-2 border-t border-gray-100">
                  Total Patient Daily Food Amount: ₹{p.total_day_amount}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Signature Box for Hospital Canteen Print */}
          <div className="pt-12 border-t border-gray-300 text-xs flex justify-between items-end text-gray-600">
            <div>
              <div>Verified By: Canteen Staff Signature</div>
              <div className="mt-8 border-t border-gray-400 w-48"></div>
            </div>
            <div className="text-right">
              <div>Hospital Canteen Seal</div>
              <div className="mt-8 border-t border-gray-400 w-48 ml-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
