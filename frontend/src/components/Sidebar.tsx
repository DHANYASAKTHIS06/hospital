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
  Home,
  LogOut,
  X,
  UtensilsCrossed,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div>
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 md:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">HOSPITAL CANTEEN</h2>
              <p className="text-[10px] text-slate-500 font-medium">Management System</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {user.role === 'ADMIN' ? 'Admin Portal' : 'Patient Portal'}
        </div>

        <nav className="mt-1 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200/80 space-y-3">
        {/* User Card */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {user.role === 'ADMIN' ? 'A' : (user.name ? user.name.charAt(0).toUpperCase() : 'P')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user.role === 'ADMIN' ? 'Admin Manager' : user.name || user.patient_id}
            </p>
            {user.role === 'PATIENT' && (
              <p className="text-[10px] text-slate-500 truncate">
                Room {user.room_number || 'N/A'} • {user.patient_id}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 w-full transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (persistent md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] no-print shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay (slide-in drawer) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Slide Drawer */}
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
