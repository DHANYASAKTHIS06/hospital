import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PatientRecord } from '../types';
import { Users, Search, Eye, X } from 'lucide-react';

export const AdminPatients: React.FC = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/admin/patients', { params: { search } });
      setPatients(response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Patient Directory (Admin)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Searchable list of all registered hospital patients.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, Name, Room, Mobile..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-xs">Loading patient records...</div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-xs">
          No patient records matched your query.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Room No</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Registration Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{p.patient_id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-700">{p.age} yrs</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">Room {p.room_number}</td>
                    <td className="px-4 py-3 text-gray-700">{p.mobile}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors"
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

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">Patient File Details</h3>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-gray-500 font-semibold">Patient ID</div>
                <div className="text-lg font-mono font-bold text-blue-900">{selectedPatient.patient_id}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 font-semibold">Name:</span>
                  <div className="font-bold text-gray-900">{selectedPatient.name}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Age:</span>
                  <div className="font-bold text-gray-900">{selectedPatient.age} years</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Room Number:</span>
                  <div className="font-bold text-gray-900">Room {selectedPatient.room_number}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Mobile:</span>
                  <div className="font-bold text-gray-900">{selectedPatient.mobile}</div>
                </div>
              </div>

              <div>
                <span className="text-gray-500 font-semibold">Address:</span>
                <div className="p-2 bg-gray-50 rounded border border-gray-200 mt-1">{selectedPatient.address}</div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg"
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
