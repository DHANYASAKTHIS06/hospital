import React from 'react';
import { OrderStatus, PaymentStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | 'AVAILABLE' | 'UNAVAILABLE';
  type?: 'order' | 'payment' | 'menu';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order' }) => {
  let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-300';
  let displayText = String(status);

  if (status === 'PENDING') {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
  } else if (status === 'ACCEPTED') {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-300 font-medium';
    displayText = '✓ ORDER ACCEPTED';
  } else if (status === 'DELIVERY CONFIRMATION PENDING') {
    badgeStyle = 'bg-purple-50 text-purple-800 border-purple-300 font-medium';
    displayText = 'DELIVERY CONFIRMATION PENDING';
  } else if (status === 'DELIVERED') {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
    displayText = '✓ DELIVERED';
  } else if (status === 'CANCELLED') {
    badgeStyle = 'bg-red-50 text-red-800 border-red-300 font-medium';
    displayText = 'ORDER CANCELLED';
  } else if (status === 'UNPAID') {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-medium';
  } else if (status === 'ADVANCE') {
    badgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-300 font-medium';
  } else if (status === 'PAID') {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium';
    displayText = '✓ PAID';
  } else if (status === 'AVAILABLE') {
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (status === 'UNAVAILABLE') {
    badgeStyle = 'bg-gray-100 text-gray-500 border-gray-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      {displayText}
    </span>
  );
};
