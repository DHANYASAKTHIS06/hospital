import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  FileText,
  User,
  Users,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const patientTabs = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Menu', path: '/patient/menu', icon: Utensils },
    { name: 'Orders', path: '/patient/orders', icon: ShoppingBag },
    { name: 'Bills', path: '/patient/bills', icon: FileText },
    { name: 'Profile', path: '/patient/profile', icon: User },
  ];

  const adminTabs = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Menu', path: '/admin/menu', icon: Utensils },
    { name: 'Patients', path: '/admin/patients', icon: Users },
    { name: 'Bills', path: '/admin/bills', icon: FileText },
  ];

  const tabs = user.role === 'ADMIN' ? adminTabs : patientTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg md:hidden no-print">
      <nav className="flex justify-around items-center h-16 px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                    {tab.name}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
