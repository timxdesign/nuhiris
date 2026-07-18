'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api-client';

interface BiometricEvent {
  eventId: string;
  nuhi: string | null;
  eventType: string;
  method: string;
  result: string;
  confidenceScore: string | null;
  livenessPassed: boolean | null;
  deviceAttested: boolean | null;
  geofencePassed: boolean | null;
  facilityId: string | null;
  timestamp: string;
}

export default function BiometricEventsPage() {
  const [events, setEvents] = useState<BiometricEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'match' | 'no_match' | 'error'>('all');

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ data: BiometricEvent[] }>('/devices/biometric-events?limit=100');
        setEvents((result as unknown as { data: BiometricEvent[] })?.data ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'all' ? events : events.filter((e) => e.result === filter);

  const resultColors: Record<string, string> = {
    match: 'bg-green-100 text-green-700',
    no_match: 'bg-red-100 text-red-700',
    error: 'bg-yellow-100 text-yellow-700',
    spoof_detected: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Biometric Event Review</h1>
      <p className="mt-1 text-gray-500">Review biometric verification events across facilities</p>

      <div className="mt-6 flex gap-2">
        {(['all', 'match', 'no_match', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#075E54] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 text-gray-500">Loading events...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-gray-500">No biometric events found.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Liveness</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Geofence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((e) => (
                <tr key={e.eventId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {e.eventType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {e.method.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        resultColors[e.result] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {e.result.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {e.confidenceScore ? `${(parseFloat(e.confidenceScore) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {e.livenessPassed === null ? '—' : e.livenessPassed ? (
                      <span className="text-green-600">Pass</span>
                    ) : (
                      <span className="text-red-600">Fail</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.deviceAttested === null ? '—' : e.deviceAttested ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.geofencePassed === null ? '—' : e.geofencePassed ? (
                      <span className="text-green-600">Pass</span>
                    ) : (
                      <span className="text-red-600">Fail</span>
                    )}
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
