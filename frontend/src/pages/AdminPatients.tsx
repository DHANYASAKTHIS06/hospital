import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PatientRecord } from '../types';
import { Users, Search, Eye, X, UserPlus, KeyRound, CheckCircle2, Copy, Check } from 'lucide-react';

export const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  // Add Patient Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patient_id: '',
    name: '',
    age: '',
    room_number: '',
    mobile: '',
    address: '',
    password: '',
  });

  // Created Credentials Modal state
  const [createdCredentials, setCreatedCredentials] = useState<{
    patient_id: string;
    name: string;
    room_number: string;
    plain_password: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const fetchPatients = async () => {
    setFetchError(null);
    try {
      const response = await api.get('/admin/patients', { params: { search } });
      setPatients(response.data);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      setFetchError(err.response?.data?.message || 'Failed to connect to MongoDB database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      const response = await api.post('/admin/patients', formData);
      const newPatient = response.data.patient;

      setIsAddModalOpen(false);
      setFormData({
        patient_id: '',
        name: '',
        age: '',
        room_number: '',
        mobile: '',
        address: '',
        password: '',
      });

      setCreatedCredentials({
        patient_id: newPatient.patient_id,
        name: newPatient.name,
        room_number: newPatient.room_number,
        plain_password: newPatient.plain_password,
      });

      fetchPatients();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to create patient account.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Hospital Canteen Patient Credentials:\nPatient ID: ${createdCredentials.patient_id}\nPassword: ${createdCredentials.plain_password}\nName: ${createdCredentials.name}\nRoom: ${createdCredentials.room_number}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header section with Search and Add Patient action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Manage Patients (Admin)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View patient details or register new patients and issue unique credentials.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Name, Room, Mobile..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add New Patient
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center justify-between">
          <span>{fetchError}</span>
          <button
            onClick={fetchPatients}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Patient Directory Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading patient records...</div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs">
          No patient records found in MongoDB database. Click "Add New Patient" to register a patient.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Patient ID</th>
                  <th className="px-4 py-3.5">Patient Name</th>
                  <th className="px-4 py-3.5">Age</th>
                  <th className="px-4 py-3.5">Room No</th>
                  <th className="px-4 py-3.5">Mobile</th>
                  <th className="px-4 py-3.5">Registration Date</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-medium">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{p.patient_id}</td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-700">{p.age} yrs</td>
                    <td className="px-4 py-3 font-bold text-slate-800">Room {p.room_number}</td>
                    <td className="px-4 py-3 text-slate-700">{p.mobile}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Patient Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New Patient</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Create a patient account and set initial credentials</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Patient ID <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="e.g. 42"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    name="room_number"
                    required
                    value={formData.room_number}
                    onChange={handleInputChange}
                    placeholder="e.g. 302"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Residential address"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Patient Password *</span>
                  <button
                    type="button"
                    onClick={() => {
                      const randPass = 'P@' + Math.floor(100000 + Math.random() * 900000);
                      setFormData({ ...formData, password: randPass });
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Auto-Generate Password
                  </button>
                </label>
                <input
                  type="text"
                  name="password"
                  required
                  minLength={4}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Set patient login password"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {addLoading ? 'Creating Patient...' : 'Create & Show Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Credentials Display Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Patient Account Created!</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Share these login credentials securely with the patient.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Patient Name:</span>
                <span className="font-extrabold text-slate-900">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Room Number:</span>
                <span className="font-extrabold text-slate-900">Room {createdCredentials.room_number}</span>
              </div>
              <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 space-y-1">
                <div className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Login Patient ID</div>
                <div className="text-base font-black text-blue-900">{createdCredentials.patient_id}</div>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-1">
                <div className="text-amber-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Login Password
                </div>
                <div className="text-base font-black text-amber-950">{createdCredentials.plain_password}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 bg-slate-900 hover:bg-black text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 px-4 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Patient Detail View Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Patient File Details</h3>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div className="text-slate-500 font-semibold">Patient ID</div>
                <div className="text-lg font-mono font-bold text-blue-900">{selectedPatient.patient_id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold">Name:</span>
                  <div className="font-bold text-slate-900">{selectedPatient.name}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Age:</span>
                  <div className="font-bold text-slate-900">{selectedPatient.age} years</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Room Number:</span>
                  <div className="font-bold text-slate-900">Room {selectedPatient.room_number}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Mobile:</span>
                  <div className="font-bold text-slate-900">{selectedPatient.mobile}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold">Address:</span>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 mt-1">{selectedPatient.address}</div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
