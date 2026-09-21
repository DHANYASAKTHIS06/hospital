import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ShieldCheck, ArrowLeft, Lock, User, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Determine initial role mode based on path or query param
  const getInitialRole = (): 'PATIENT' | 'ADMIN' => {
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam === 'admin' || location.pathname.includes('/admin')) {
      return 'ADMIN';
    }
    return 'PATIENT';
  };

  const [activeRole, setActiveRole] = useState<'PATIENT' | 'ADMIN'>(getInitialRole);

  // Patient form fields
  const [patientId, setPatientId] = useState('');
  const [patientPassword, setPatientPassword] = useState('');

  // Admin form fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset errors and fields on role tab switch
    setError(null);
  }, [activeRole]);

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/patient/login', {
        patient_id: patientId.trim().toUpperCase(),
        password: patientPassword,
      });

      login(response.data.token, response.data.user);
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Patient ID or Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/admin/login', {
        username: adminUsername.trim(),
        password: adminPassword,
      });

      login(response.data.token, response.data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Admin Credentials. Please check username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-6 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Welcome Page
        </Link>

        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Canteen Portal</h1>
          <p className="text-xs text-slate-500 font-medium">Select your portal role to access system features</p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveRole('PATIENT')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
              activeRole === 'PATIENT'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Patient Login
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
              activeRole === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Admin Login
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-start gap-2 animate-in fade-in duration-200">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Form */}
        {activeRole === 'PATIENT' ? (
          <form onSubmit={handlePatientSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Patient ID *
              </label>
              <input
                type="text"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. P20260001"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Password *
              </label>
              <input
                type="password"
                required
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                placeholder="Enter your patient password"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating Patient...' : 'Sign In as Patient'}
            </button>
          </form>
        ) : (
          /* Admin Form */
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" />
                Admin Username *
              </label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                Admin Password *
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black active:bg-slate-950 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating Admin...' : 'Sign In as Canteen Admin'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100">
          Patient credentials are generated and provided exclusively by the Canteen Admin.
        </div>
      </div>
    </div>
  );
};
