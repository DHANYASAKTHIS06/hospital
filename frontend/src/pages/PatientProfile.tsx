import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { PatientRecord } from '../types';
import { User, MapPin, Phone, Home, Calendar, ShieldCheck, Wallet } from 'lucide-react';

export const PatientProfile: React.FC = () => {
  const [profile, setProfile] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  const isTa = language === 'ta';

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
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            {isTa ? 'நோயாளி சுயவிவரம்' : 'Patient Profile'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTa
              ? 'உங்கள் கேன்டீன் கணக்குடன் இணைக்கப்பட்ட தனிப்பட்ட மற்றும் அறை விவரங்கள்.'
              : 'Personal and room details linked to your canteen account.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
          {isTa ? 'சுயவிவரம் ஏற்றப்படுகிறது...' : 'Loading profile...'}
        </div>
      ) : !profile ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 text-xs">
          {isTa ? 'சுயவிவர விவரங்கள் கிடைக்கவில்லை.' : 'Profile details unavailable.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
          {/* Patient ID Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
                {t('patientId')}
              </span>
              <div className="text-xl font-mono font-black text-blue-950 mt-0.5">{profile.patient_id}</div>
            </div>
            <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isTa ? 'சரிபார்க்கப்பட்ட நோயாளி' : 'Verified Patient'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> {isTa ? 'நோயாளி பெயர்' : 'Patient Name'}
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-bold text-slate-900">
                {profile.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {isTa ? 'வயது' : 'Age'}
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-bold text-slate-900">
                {profile.age} {isTa ? 'வயது' : 'years'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-slate-400" /> {isTa ? 'மருத்துவமனை அறை எண்' : 'Hospital Room Number'}
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-bold text-slate-900">
                {isTa ? 'அறை' : 'Room'} #{profile.room_number}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {isTa ? 'பதிவு செய்யப்பட்ட கைபேசி எண்' : 'Registered Mobile Number'}
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-bold text-slate-900">
                {profile.mobile}
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {isTa ? 'முகவரி' : 'Address'}
              </label>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 font-bold text-slate-900">
                {profile.address || (isTa ? 'குறிப்பிடப்படவில்லை' : 'Not provided')}
              </div>
            </div>

            {/* Advance Balance Card */}
            <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {t('advanceBalance')}
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                    ₹{profile.advance_balance}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
