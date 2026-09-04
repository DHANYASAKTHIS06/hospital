import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, UtensilsCrossed } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">HOSPITAL CANTEEN</h1>
            <p className="text-xs text-gray-500 font-medium">Management System</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <div className="text-xs">
                <span className="font-semibold text-gray-800">
                  {user.role === 'ADMIN' ? 'Admin Manager' : user.name || user.patient_id}
                </span>
                {user.role === 'PATIENT' && (
                  <span className="text-gray-500 ml-2">
                    ({user.patient_id} • Room {user.room_number})
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
