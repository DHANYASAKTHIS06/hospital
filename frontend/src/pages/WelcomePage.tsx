import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { UtensilsCrossed, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Soft Tint */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-celadon-light/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-procare-200 p-6 sm:p-8 space-y-6 relative z-10 text-center">
        <div className="space-y-3">
          <div className="flex justify-center mb-1">
            <img
              src="/procare-logo.png"
              alt="ProCare Logo"
              className="h-24 w-auto object-contain shrink-0"
            />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            {t('appName')}
          </h1>
          <p className="text-xs text-procare-800 font-extrabold uppercase tracking-wide">
            {t('clinicName')}
          </p>

          {/* Language Toggle */}
          <div className="flex justify-center pt-1 pb-1">
            <LanguageToggle />
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            {t('welcomeSubtitle')}
          </p>
        </div>

        <div className="p-4 bg-procare-50/80 rounded-2xl border border-procare-200 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-procare-700 shrink-0" />
            <span>{t('patientInstruction')}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-procare-800 shrink-0" />
            <span>{t('adminInstruction')}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-celadon hover:bg-procare-500 active:bg-procare-600 text-slate-950 font-black text-sm py-3.5 px-6 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{language === 'ta' ? 'ப்ரோகேர் கேன்டீன் போர்ட்டலில் உள்நுழையவும்' : 'Sign In to ProCare Canteen Portal'}</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>

        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
          {t('clinicName')} – {t('canteenSystem')}
        </div>
      </div>
    </div>
  );
};
