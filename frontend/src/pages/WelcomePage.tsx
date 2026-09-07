import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, UserPlus, UtensilsCrossed } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold mb-1 shadow-lg shadow-blue-500/30">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Canteen</h1>
          <p className="text-xs text-slate-500 font-medium">Select your role to access the canteen portal</p>
        </div>

        <div className="space-y-4 pt-1">
          <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/80 hover:bg-blue-50/50 hover:border-blue-300 transition-all">
            <h2 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <div className="p-1 rounded-md bg-blue-100 text-blue-700">
                <User className="w-4 h-4" />
              </div>
              Patient Access
            </h2>
            <p className="text-xs text-slate-500 mb-3.5 font-medium leading-relaxed">
              Patients can view daily food menus, order meals to their room, track live status & view bills.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/patient/login')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-xs"
              >
                Patient Login
              </button>
              <button
                onClick={() => navigate('/patient/signup')}
                className="flex-1 bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs py-2.5 px-3 border border-blue-200 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Patient Signup
              </button>
            </div>
          </div>

          <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/80 hover:bg-amber-50/50 hover:border-amber-300 transition-all">
            <h2 className="text-sm font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-100 text-amber-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
              Admin Portal
            </h2>
            <p className="text-xs text-slate-500 mb-3.5 font-medium leading-relaxed">
              Canteen manager access for menu management, incoming orders, room delivery & billing.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-xs"
            >
              Admin Manager Login
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
          Hospital Food & Canteen Management System © 2026
        </div>
      </div>
    </div>
  );
};
