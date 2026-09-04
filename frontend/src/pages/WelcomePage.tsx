import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, UserPlus, UtensilsCrossed } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-gray-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-700 text-white font-bold mb-2 shadow-sm">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Canteen</h1>
          <p className="text-sm text-gray-600">Select your user role to proceed to the system</p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors">
            <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Patient Access
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Hospital patients can view menu, order food, track orders, and view bills.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/patient/login')}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs py-2 px-3 rounded-md transition-colors"
              >
                Patient Login
              </button>
              <button
                onClick={() => navigate('/patient/signup')}
                className="flex-1 bg-white hover:bg-gray-100 text-blue-700 font-semibold text-xs py-2 px-3 border border-blue-600 rounded-md transition-colors flex items-center justify-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Patient Signup
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 transition-colors">
            <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Admin Portal
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Canteen manager login for menu CRUD, receiving orders, delivery, and payment management.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-2 px-3 rounded-md transition-colors"
            >
              Admin Login
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
          Hospital Food & Canteen Management System © 2026
        </div>
      </div>
    </div>
  );
};
