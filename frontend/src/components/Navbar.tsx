import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  User as UserIcon,
  Menu,
  X,
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

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const patientNavLinks = [
    { name: t('navDashboard'), path: '/patient/dashboard', icon: LayoutDashboard },
    { name: t('navMenu'), path: '/patient/menu', icon: Utensils },
    { name: t('navOrders'), path: '/patient/orders', icon: ShoppingBag },
    { name: t('navFoodHistory'), path: '/patient/food-history', icon: History },
    { name: t('navBills'), path: '/patient/bills', icon: FileText },
    { name: t('navPaymentStatus'), path: '/patient/payment-status', icon: CreditCard },
    { name: t('navProfile'), path: '/patient/profile', icon: User },
  ];

  const adminNavLinks = [
    { name: t('navDashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { name: t('navOrders'), path: '/admin/orders', icon: ShoppingBag },
    { name: t('navAdminMenu'), path: '/admin/menu', icon: Utensils },
    { name: t('navPatients'), path: '/admin/patients', icon: Users },
    { name: t('navFoodRecords'), path: '/admin/food-records', icon: History },
    { name: t('navAdminBills'), path: '/admin/bills', icon: FileText },
    { name: t('navAdminPayments'), path: '/admin/payments', icon: CreditCard },
    { name: t('navRoomView'), path: '/admin/room-view', icon: Home },
  ];

  const navLinks = user?.role === 'ADMIN' ? adminNavLinks : patientNavLinks;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Navigation Toggle Button */}
          {user && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="px-2.5 py-1.5 rounded-xl bg-celadon hover:bg-procare-500 active:bg-procare-600 text-slate-900 md:hidden transition-all flex items-center gap-1.5 shadow-xs focus:outline-none shrink-0 font-bold cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
              title="Open Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900" />
              )}
              <span className="text-xs font-bold text-slate-900 tracking-wide">{t('navMenu')}</span>
            </button>
          )}

          <div
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            <img
              src="/procare-logo.png"
              alt="ProCare Logo"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div>
              <h1 className="text-xs sm:text-base font-black text-slate-900 leading-tight tracking-tight uppercase">
                {t('appName')}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-procare-800 font-bold uppercase tracking-wide">
                {t('clinicName')}
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Language Toggle, User Badge, Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Language Toggle in Header */}
          <div className="shrink-0">
            <LanguageToggle />
          </div>

          {user && (
            <>
              {/* User Badge / Info */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 bg-procare-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-procare-200/80 max-w-[100px] xs:max-w-[140px] sm:max-w-xs">
                <div className="w-6 h-6 rounded-full bg-celadon text-procare-900 flex items-center justify-center shrink-0 font-bold">
                  <UserIcon className="w-3.5 h-3.5 text-procare-950" />
                </div>
                <div className="text-[11px] sm:text-xs truncate">
                  <span className="font-extrabold text-procare-950 truncate block">
                    {user.role === 'ADMIN' ? (language === 'ta' ? 'நிர்வாகி' : 'Admin') : user.name || user.patient_id}
                  </span>
                  {user.role === 'PATIENT' && (
                    <span className="text-[9px] sm:text-[10px] text-procare-800 font-semibold hidden sm:inline">
                      {t('roomNo')} #{user.room_number || 'N/A'}
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 sm:px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Header Navigation Tabs for logged in users */}
      {user && (
        <div className="bg-slate-100/80 border-t border-slate-200/70 overflow-x-auto scrollbar-none no-scrollbar">
          <nav className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 min-w-max">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
