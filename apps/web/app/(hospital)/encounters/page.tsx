'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/use-auth';

interface Encounter {
  encounterId: string;
  nuhi: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
}

export default function EncountersPage() {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientNuhi, setPatientNuhi] = useState('');

  async function searchEncounters() {
    if (!patientNuhi.trim()) return;
    setLoading(true);
    try {
      const data = await api<[Encounter[], number]>(`/encounters/patient/${patientNuhi}?page=1&limit=20`);
      setEncounters(Array.isArray(data) ? data[0] : []);
    } catch {
      setEncounters([]);
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Encounters</h1>
        <Link
          href="/encounters/new"
          className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
        >
          New Encounter
        </Link>
      </div>

      <div className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter Patient NUHI..."
          value={patientNuhi}
          onChange={(e) => setPatientNuhi(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
        <button
          onClick={searchEncounters}
          disabled={loading}
          className="rounded-lg bg-[#075E54] px-6 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {encounters.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {encounters.map((enc) => (
                <tr key={enc.encounterId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(enc.dateTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{enc.encounterType}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[enc.status] ?? 'bg-gray-100'}`}>
                      {enc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{enc.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/encounters/${enc.encounterId}`}
                      className="text-sm font-medium text-[#075E54] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
