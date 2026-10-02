import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, UtensilsCrossed, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile Navigation Toggle Button */}
          {user && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="px-2.5 py-1.5 rounded-xl bg-celadon hover:bg-procare-500 active:bg-procare-600 text-slate-900 md:hidden transition-all flex items-center gap-1.5 shadow-xs focus:outline-none shrink-0 font-bold"
              aria-label="Toggle Navigation Sidebar"
              title="Open Sidebar Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900" />
              )}
              <span className="text-xs font-bold text-slate-900 tracking-wide">Menu</span>
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
                PROCARE CANTEEN
              </h1>
              <p className="text-[9px] sm:text-[10px] text-procare-800 font-bold uppercase tracking-wide">
                Physiotherapy & Rehabilitation Centre
              </p>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* User Badge / Info */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-procare-50 px-2.5 py-1.5 rounded-xl border border-procare-200/80 max-w-[120px] xs:max-w-[160px] sm:max-w-xs">
              <div className="w-6 h-6 rounded-full bg-celadon text-procare-900 flex items-center justify-center shrink-0 font-bold">
                <UserIcon className="w-3.5 h-3.5 text-procare-950" />
              </div>
              <div className="text-[11px] sm:text-xs truncate">
                <span className="font-extrabold text-procare-950 truncate block">
                  {user.role === 'ADMIN' ? 'Admin' : user.name || user.patient_id}
                </span>
                {user.role === 'PATIENT' && (
                  <span className="text-[9px] sm:text-[10px] text-procare-800 font-semibold hidden sm:inline">
                    Rm #{user.room_number || 'N/A'}
                  </span>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
