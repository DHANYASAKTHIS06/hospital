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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <Link to="/" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Welcome
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Patient Login
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Please enter your unique Patient ID and password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Patient ID *</label>
            <input
              type="text"
              required
              value={patient_id}
              onChange={(e) => setPatientId(e.target.value.toUpperCase())}
              placeholder="e.g. P20260001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-colors mt-2 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Patient Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          New patient?{' '}
          <Link to="/patient/signup" className="text-blue-700 font-semibold hover:underline">
            Register for Patient ID
          </Link>
        </div>
      </div>
    </div>
  );
};
