'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';

interface AuditEvent {
  eventId: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  outcome: string;
  resourceType: string | null;
  resourceId: string | null;
  patientNuhi: string | null;
  pathway: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ data: AuditEvent[]; meta: { total: number } }>('/audit/events?limit=50');
        setEvents(result?.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit log');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      <p className="mt-1 text-gray-500">Append-only record of all system actions</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-gray-500">Loading audit events...</div>
      ) : events.length === 0 ? (
        <div className="mt-8 text-gray-500">No audit events recorded yet.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Actor Role</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((e) => (
                <tr key={e.eventId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.outcome === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {e.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.resourceType ?? '—'}
                    {e.resourceId ? ` / ${e.resourceId.slice(0, 8)}...` : ''}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {e.actorRole?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    {e.ipAddress ?? '—'}
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
