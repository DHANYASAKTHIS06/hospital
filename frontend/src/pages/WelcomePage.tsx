import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6 relative z-10 text-center">
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold mb-1 shadow-xl shadow-blue-500/30">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Canteen</h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            Order room delivery meals, view menus, track order live status & manage canteen records.
          </p>
        </div>

        <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Patients: Sign in using your Patient ID & Password.</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Admin: Sign in using Admin credentials.</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
        >
          <span>Sign In to Canteen Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100 font-medium">
          Hospital Food & Canteen Management System © 2026
        </div>
      </div>
    </div>
  );
};
