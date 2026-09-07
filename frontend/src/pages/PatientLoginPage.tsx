import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ArrowLeft } from 'lucide-react';

export const PatientLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [patient_id, setPatientId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/patient/login', { patient_id, password });
      login(response.data.token, response.data.user);
      navigate('/patient/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Patient ID or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-md border border-slate-200/80 p-6 sm:p-8 space-y-5">
        <Link to="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Welcome
        </Link>

        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
            Patient Login
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Please enter your unique Patient ID and password.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Patient ID *</label>
            <input
              type="text"
              required
              value={patient_id}
              onChange={(e) => setPatientId(e.target.value.toUpperCase())}
              placeholder="e.g. P20260001"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-xs mt-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Patient Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-500 font-medium">
          New patient?{' '}
          <Link to="/patient/signup" className="text-blue-600 font-extrabold hover:underline">
            Register for Patient ID
          </Link>
        </div>
      </div>
    </div>
  );
};
