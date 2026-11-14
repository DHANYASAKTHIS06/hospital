import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { ArrowLeft, Lock, User, KeyRound, UtensilsCrossed } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { token, user } = response.data;
      login(token, user);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Soft Tint */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-celadon-light/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-procare-200 p-6 sm:p-8 space-y-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-bold text-procare-800 hover:text-procare-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 text-procare-700" /> {t('backHome')}
        </Link>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <img
              src="/procare-logo.png"
              alt="ProCare Logo"
              className="h-20 w-auto object-contain shrink-0"
            />
          </div>
          
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {language === 'ta' ? 'ப்ரோகேர் கேன்டீன் போர்ட்டலில் உள்நுழையவும்' : 'Sign in to ProCare Canteen Portal'}
          </h1>

          {/* Language Toggle Directly Below "Sign in to ProCare Canteen Portal" */}
          <div className="flex justify-center pt-1.5 pb-1">
            <LanguageToggle />
          </div>

          <p className="text-xs text-procare-800 font-bold uppercase tracking-wide">
            {t('clinicName')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold flex items-start gap-2 animate-in fade-in duration-200">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-procare-700" />
              {t('patientIdOrUsername')}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={language === 'ta' ? 'எ.கா. 101 அல்லது admin' : 'e.g. 101 or admin'}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-procare-400 focus:border-procare-400 outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-procare-700" />
              {t('password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter password'}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-procare-400 focus:border-procare-400 outline-none bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-celadon hover:bg-procare-500 active:bg-procare-600 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t('signingIn')}</span>
            ) : (
              <>
                <UtensilsCrossed className="w-4 h-4 text-slate-950" />
                <span>{t('signInBtn')}</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-500 font-medium border-t border-slate-100">
          {language === 'ta'
            ? 'நோயாளி உள்நுழைவு சான்றுகள் ப்ரோகேர் கேன்டீன் நிர்வாகியால் பிரத்தியேகமாக உருவாக்கப்பட்டு வழங்கப்படுகின்றன.'
            : 'Patient credentials are generated and provided exclusively by the ProCare Canteen Admin.'}
        </div>
      </div>
    </div>
  );
};
