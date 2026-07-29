'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api-client';

interface PatientEncounter {
  encounterId: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
  closedAt: string | null;
}

export default function PatientRecordsPage() {
  const [encounters, setEncounters] = useState<PatientEncounter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profile = await api<{ nuhi: string }>('/patients/me');
        const result = await api<[PatientEncounter[], number]>(
          `/encounters/patient/${profile.nuhi}?page=1&limit=50`,
        );
        setEncounters(Array.isArray(result) ? result[0] : []);
      } catch {
        setEncounters([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading your records...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">My Health Records</h2>
      <p className="mt-1 text-gray-500">View your encounter history and health data</p>

      {encounters.length === 0 ? (
        <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
          No health records found yet.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {encounters.map((enc) => (
            <div
              key={enc.encounterId}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold capitalize text-gray-900">
                    {enc.encounterType.replace(/_/g, ' ')} Encounter
                  </h3>
                  {enc.reason && (
                    <p className="mt-1 text-sm text-gray-600">{enc.reason}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    enc.status === 'open'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {enc.status}
                </span>
              </div>
              <div className="mt-3 flex gap-6 text-xs text-gray-400">
                <span>Date: {new Date(enc.dateTime).toLocaleDateString()}</span>
                {enc.closedAt && (
                  <span>Closed: {new Date(enc.closedAt).toLocaleDateString()}</span>
                )}
                <span className="font-mono">ID: {enc.encounterId.slice(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
