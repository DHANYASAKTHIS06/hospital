import React from 'react';
import { OrderStatus, PaymentStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | 'AVAILABLE' | 'UNAVAILABLE';
  type?: 'order' | 'payment' | 'menu';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-300';
  let displayText = String(status);

  if (status === 'PENDING' || status === 'ACCEPTED') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = '✓ ORDER ACTIVE';
  } else if (status === 'DELIVERY CONFIRMATION PENDING') {
    badgeStyle = 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold';
    displayText = 'DELIVERY CONFIRMATION PENDING';
  } else if (status === 'DELIVERED') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = '✓ DELIVERED';
  } else if (status === 'CANCELLED') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold';
    displayText = 'ORDER CANCELLED';
  } else if (status === 'UNPAID') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold';
  } else if (status === 'ADVANCE') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
  } else if (status === 'PAID') {
    badgeStyle = 'bg-procare-100 text-procare-950 border-procare-300 font-extrabold';
    displayText = '✓ PAID';
  } else if (status === 'AVAILABLE') {
    badgeStyle = 'bg-procare-50 text-procare-900 border-procare-300 font-bold';
  } else if (status === 'UNAVAILABLE') {
    badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      {displayText}
    </span>
  );
};
