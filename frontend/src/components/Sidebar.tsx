import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  History,
  FileText,
  CreditCard,
  User,
  Users,
  Printer,
  Home,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const patientLinks = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Menu', path: '/patient/menu', icon: Utensils },
    { name: 'My Orders', path: '/patient/orders', icon: ShoppingBag },
    { name: 'My Food History', path: '/patient/food-history', icon: History },
    { name: 'My Bills', path: '/patient/bills', icon: FileText },
    { name: 'Payment Status', path: '/patient/payment-status', icon: CreditCard },
    { name: 'Profile', path: '/patient/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Menu Management', path: '/admin/menu', icon: Utensils },
    { name: 'Patients', path: '/admin/patients', icon: Users },
    { name: 'Food Records', path: '/admin/food-records', icon: History },
    { name: 'Bills', path: '/admin/bills', icon: FileText },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Room-wise View', path: '/admin/room-view', icon: Home },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : patientLinks;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between no-print shrink-0">
      <div>
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {user.role === 'ADMIN' ? 'Admin Controls' : 'Patient Portal'}
        </div>
        <nav className="mt-2 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
