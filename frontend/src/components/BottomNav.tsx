import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const patientTabs = [
    { name: t('navDashboard'), path: '/patient/dashboard', icon: LayoutDashboard },
    { name: t('navMenu'), path: '/patient/menu', icon: Utensils },
    { name: t('navOrders'), path: '/patient/orders', icon: ShoppingBag },
    { name: t('navFoodHistory'), path: '/patient/food-history', icon: History },
    { name: t('navBills'), path: '/patient/bills', icon: FileText },
    { name: t('navPaymentStatus'), path: '/patient/payment-status', icon: CreditCard },
    { name: t('navProfile'), path: '/patient/profile', icon: User },
  ];

  const adminTabs = [
    { name: t('navDashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('navOrders'), path: '/admin/orders', icon: ShoppingBag },
    { name: t('navAdminMenu'), path: '/admin/menu', icon: Utensils },
    { name: t('navPatients'), path: '/admin/patients', icon: Users },
    { name: t('navFoodRecords'), path: '/admin/food-records', icon: History },
    { name: t('navAdminBills'), path: '/admin/bills', icon: FileText },
    { name: t('navAdminPayments'), path: '/admin/payments', icon: CreditCard },
    { name: t('navRoomView'), path: '/admin/room-view', icon: Home },
  ];

  const tabs = user.role === 'ADMIN' ? adminTabs : patientTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg md:hidden no-print">
      <nav className="flex items-center h-16 px-2 overflow-x-auto scrollbar-none no-scrollbar space-x-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[4.25rem] py-1 px-1 rounded-xl transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'text-procare-950 font-black scale-105'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-celadon text-slate-950 font-bold' : ''}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full font-bold">
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
