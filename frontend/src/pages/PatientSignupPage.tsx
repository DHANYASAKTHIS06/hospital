import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, UserPlus, ArrowLeft } from 'lucide-react';

export const PatientSignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    room_number: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{ patient_id: string; name: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/patient/signup', formData);
      setSuccessData({
        patient_id: response.data.patient.patient_id,
        name: response.data.patient.name,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <Link to="/" className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Welcome
        </Link>

        {successData ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h2 className="text-lg font-bold text-emerald-900 tracking-wide">REGISTRATION SUCCESSFUL</h2>

            <div className="bg-white p-4 rounded-md border border-emerald-200 text-left space-y-2 font-mono text-sm">
              <p>
                <span className="font-semibold text-gray-600">Patient ID:</span>{' '}
                <span className="font-bold text-blue-700 text-base">{successData.patient_id}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-600">Patient Name:</span>{' '}
                <span className="font-bold text-gray-900">{successData.name}</span>
              </p>
            </div>

            <p className="text-xs text-emerald-800 font-medium">
              Please save your Patient ID carefully for all future logins.
            </p>

            <button
              onClick={() => navigate('/patient/login')}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-md text-sm transition-colors shadow-sm"
            >
              PROCEED TO LOGIN
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Patient Registration
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Enter patient details. Patient ID will be automatically generated upon submission.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    name="room_number"
                    required
                    value={formData.room_number}
                    onChange={handleChange}
                    placeholder="e.g. 204"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Patient residential address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-md text-sm transition-colors mt-2 disabled:opacity-50"
              >
                {loading ? 'Generating Patient ID...' : 'Register Patient'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-500">
              Already registered?{' '}
              <Link to="/patient/login" className="text-blue-700 font-semibold hover:underline">
                Login with Patient ID
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
