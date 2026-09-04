import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PatientRecord } from '../types';
import { User, MapPin, Phone, Home, Hash, Calendar } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const [profile, setProfile] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/patient/profile');
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Patient Information Profile
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Personal and room details linked to your canteen account.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading profile...</div>
      ) : !profile ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
          Profile details unavailable.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Read Only Patient ID Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Patient ID (Read-Only)</span>
              <div className="text-xl font-mono font-bold text-blue-900 mt-0.5">{profile.patient_id}</div>
            </div>
            <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-3 py-1 rounded-full">
              Permanent Identifier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Patient Name
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-900">
                {profile.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> Age
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-900">
                {profile.age} years
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-gray-400" /> Hospital Room Number
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-900">
                Room {profile.room_number}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Registered Mobile Number
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-900">
                {profile.mobile}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Address
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-semibold text-gray-900">
                {profile.address}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
