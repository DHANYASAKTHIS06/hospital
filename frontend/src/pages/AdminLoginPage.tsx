import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/admin/login', { username, password });
      login(response.data.token, response.data.user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Admin Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <Link to="/" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Welcome
        </Link>

        <div className="mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Hospital Canteen Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Authorized Canteen Manager Access Only</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Username *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Admin Login'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs text-gray-500 text-center">
          Default seed credentials: <br />
          <span className="font-mono text-gray-800 font-semibold">admin</span> / <span className="font-mono text-gray-800 font-semibold">Admin@123</span>
        </div>
      </div>
    </div>
  );
};
