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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={onToggleMobileMenu}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight tracking-tight">
                HOSPITAL CANTEEN
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Management System</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Badge / Info */}
            <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 max-w-[170px] sm:max-w-xs">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs truncate">
                <span className="font-bold text-slate-800 truncate block">
                  {user.role === 'ADMIN' ? 'Admin' : user.name || user.patient_id}
                </span>
                {user.role === 'PATIENT' && (
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                    Rm {user.room_number || 'N/A'}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3 py-1.5 rounded-xl transition-colors shrink-0"
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
