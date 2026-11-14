import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { Home, Printer, Calendar } from 'lucide-react';

export const AdminRoomView: React.FC = () => {
  const [date, setDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('204');
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { t, language, translateFood, translateCategory } = useLanguage();
  const isTa = language === 'ta';

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
            {isTa ? 'அறை வாரியான தினசரி உணவுப் பார்வை & அச்சு அறிக்கை' : 'Room-wise Daily Food View & Printable Report'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isTa
              ? 'அச்சிடுவதற்கு நோயாளிக்கு டெலிவரி செய்யப்பட்ட அறை சார்ந்த உணவுகளைப் பார்க்கவும்.'
              : 'View room-specific food items delivered per patient for printing.'}
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
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs w-28 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-gray-700">{t('roomNo')}:</span>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 204"
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs w-24 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isTa ? '[அறிக்கையை அச்சிடு]' : '[PRINT REPORT]'}</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">
          {isTa ? 'அறை உணவுப் பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading room food records...'}
        </div>
      ) : !roomData || !roomData.patients || roomData.patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          {isTa
            ? `அறை ${roomNumber}-க்கு ${date} அன்று உணவுப் பதிவுகள் எதுவும் இல்லை.`
            : `No food records registered for Room ${roomNumber} on date ${date}.`}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm print-area space-y-6">
          {/* Print Document Header */}
          <div className="border-b-2 border-gray-900 pb-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 uppercase">
              {isTa ? 'மருத்துவமனை கேன்டீன் தினசரி அறை உணவுப் பதிவு' : 'HOSPITAL CANTEEN DAILY ROOM FOOD RECORD'}
            </h2>
            <div className="flex justify-center items-center space-x-8 text-xs font-semibold text-gray-700 mt-2">
              <span>{isTa ? 'தேதி:' : 'Date:'} <strong className="font-mono">{roomData.date}</strong></span>
              <span>{t('roomNumber')}: <strong className="text-blue-700">{roomData.room_number}</strong></span>
            </div>
          </div>

          {/* Patients Breakdown */}
          <div className="space-y-6 divide-y divide-gray-200">
            {roomData.patients.map((p: any) => (
              <div key={p.patient_id} className="pt-4 space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-xs flex justify-between items-center">
                  <div>
                    <span className="text-gray-500 font-semibold">{t('patientId')}:</span>{' '}
                    <strong className="text-blue-800 font-bold">{p.patient_id}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">{isTa ? 'நோயாளி பெயர்:' : 'Patient Name:'}</span>{' '}
                    <strong className="text-gray-900 font-bold">{p.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 font-semibold">{t('roomNo')}:</span>{' '}
                    <strong className="text-gray-900 font-bold">{p.room_number}</strong>
                  </div>
                </div>

                {p.orders?.map((order: any) => (
                  <div key={order.order_id} className="pl-4 space-y-2 text-xs">
                    <div className="font-semibold text-gray-800 uppercase tracking-wider flex justify-between">
                      <span>
                        {isTa ? 'உணவு:' : 'Meal:'} {translateCategory(order.meal_type)} ({isTa ? 'ஆர்டர் எண்' : 'Order #'} {order.order_id})
                      </span>
                      <span>{isTa ? 'ஆர்டர் தொகை:' : 'Order Amount:'} ₹{order.total_amount}</span>
                    </div>

                    <ul className="list-disc pl-5 space-y-1 text-gray-700 font-medium">
                      {order.items?.map((it: any) => (
                        <li key={it._id}>
                          {translateFood(it.item_name_snapshot)} - {it.quantity} - ₹{it.subtotal}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                <div className="text-right text-xs font-bold text-gray-900 pt-2 border-t border-gray-100">
                  {isTa ? 'நோயாளியின் தினசரி மொத்த உணவுத் தொகை:' : 'Total Patient Daily Food Amount:'} ₹{p.total_day_amount}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Signature Box for Hospital Canteen Print */}
          <div className="pt-12 border-t border-gray-300 text-xs flex justify-between items-end text-gray-600">
            <div>
              <div>{t('verifiedBySignature')}</div>
              <div className="mt-8 border-t border-gray-400 w-48"></div>
            </div>
            <div className="text-right">
              <div>{t('canteenSeal')}</div>
              <div className="mt-8 border-t border-gray-400 w-48 ml-auto"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
