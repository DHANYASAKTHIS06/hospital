import React from 'react';
import { OrderStatus, PaymentStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | 'AVAILABLE' | 'UNAVAILABLE';
  type?: 'order' | 'payment' | 'menu';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { language } = useLanguage();
  let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-300';
  let displayText = String(status);

  const isTa = language === 'ta';

  if (status === 'PENDING' || status === 'ACCEPTED') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = isTa ? '✓ ஆர்டர் செயலில் உள்ளது' : '✓ ORDER ACTIVE';
  } else if (status === 'DELIVERY CONFIRMATION PENDING') {
    badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold';
    displayText = isTa ? 'டெலிவரி உறுதிப்படுத்தல் நிலுவையில்' : 'DELIVERY CONFIRMATION PENDING';
  } else if (status === 'DELIVERED') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = isTa ? '✓ டெலிவரி செய்யப்பட்டது' : '✓ DELIVERED';
  } else if (status === 'CANCELLED') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold';
    displayText = isTa ? 'ஆர்டர் ரத்து செய்யப்பட்டது' : 'ORDER CANCELLED';
  } else if (status === 'UNPAID') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold';
    displayText = isTa ? 'செலுத்தப்படவில்லை' : 'UNPAID';
  } else if (status === 'ADVANCE') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = isTa ? 'முன்பணம்' : 'ADVANCE';
  } else if (status === 'PAID') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = isTa ? '✓ செலுத்தப்பட்டது' : '✓ PAID';
  } else if (status === 'AVAILABLE') {
    badgeStyle = 'bg-procare-50 text-procare-900 border-procare-300 font-bold';
    displayText = isTa ? 'கிடைக்கிறது' : 'AVAILABLE';
  } else if (status === 'UNAVAILABLE') {
    badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
    displayText = isTa ? 'கிடைக்கவில்லை' : 'UNAVAILABLE';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      {displayText}
    </span>
  );
};
