'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api-client';

interface AuditEvent {
  eventId: string;
  actorId: string | null;
  actorRole: string | null;
  actorFacilityId: string | null;
  action: string;
  outcome: string;
  failureReason: string | null;
  resourceType: string | null;
  resourceId: string | null;
  patientNuhi: string | null;
  pathway: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

type Scope = 'all' | 'actor' | 'patient';
const PAGE_SIZE = 25;

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const [scope, setScope] = useState<Scope>('all');
  const [scopeId, setScopeId] = useState('');
  const [appliedScope, setAppliedScope] = useState<{ scope: Scope; id: string }>({ scope: 'all', id: '' });

  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let path = `/audit/events?page=${page}&limit=${PAGE_SIZE}`;
      if (appliedScope.scope === 'actor' && appliedScope.id) {
        path = `/audit/actor/${appliedScope.id}?page=${page}&limit=${PAGE_SIZE}`;
      } else if (appliedScope.scope === 'patient' && appliedScope.id) {
        path = `/audit/patient/${appliedScope.id}?page=${page}&limit=${PAGE_SIZE}`;
      }
      const result = await api<{ data: AuditEvent[]; meta: Meta }>(path);
      setEvents(result?.data ?? []);
      setMeta(result?.meta ?? null);
    } catch (err) {
      setEvents([]);
      setMeta(null);
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, appliedScope]);

  useEffect(() => { void load(); }, [load]);

  const applyScope = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedScope({ scope, id: scopeId.trim() });
  };

  const actions = Array.from(new Set(events.map((ev) => ev.action))).sort();
  const filtered = events.filter(
    (ev) =>
      (!actionFilter || ev.action === actionFilter) &&
      (!outcomeFilter || ev.outcome === outcomeFilter),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
      <p className="mt-1 text-gray-500">Append-only record of all system actions</p>

      <form onSubmit={applyScope} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="block text-xs font-medium text-gray-700">
          Scope
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="all">All events</option>
            <option value="actor">By actor ID</option>
            <option value="patient">By patient NUHI</option>
          </select>
        </label>
        {scope !== 'all' && (
          <label className="block flex-1 text-xs font-medium text-gray-700">
            {scope === 'actor' ? 'Actor ID' : 'Patient NUHI'}
            <input
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              placeholder="UUID"
              className="mt-1 block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
            />
          </label>
        )}
        <button
          type="submit"
          className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
        >
          Apply
        </button>

        <label className="ml-auto block text-xs font-medium text-gray-700">
          Action
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-700">
          Outcome
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="mt-1 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="denied">Denied</option>
          </select>
        </label>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 text-gray-500">Loading audit events…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
          No audit events match.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((ev) => (
                <tr
                  key={ev.eventId}
                  onClick={() => setSelected(ev)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">
                      {ev.actorId ? `${ev.actorId.slice(0, 8)}…` : '—'}
                    </span>
                    {ev.actorRole && (
                      <span className="ml-1 text-xs capitalize text-gray-400">
                        ({ev.actorRole.replace(/_/g, ' ')})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{ev.action}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ev.resourceType ?? '—'}
                    {ev.resourceId && (
                      <span className="ml-1 font-mono text-xs text-gray-400">
                        {ev.resourceId.slice(0, 8)}…
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {ev.patientNuhi ? `${ev.patientNuhi.slice(0, 8)}…` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        ev.outcome === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {meta.page} of {meta.pages} · {meta.total.toLocaleString()} events
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => (meta && p < meta.pages ? p + 1 : p))}
              disabled={meta != null && page >= meta.pages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-gray-900/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Audit Event</h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ['Event ID', selected.eventId],
                  ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ['Actor ID', selected.actorId],
                  ['Actor role', selected.actorRole],
                  ['Actor facility', selected.actorFacilityId],
                  ['Action', selected.action],
                  ['Outcome', selected.outcome],
                  ['Failure reason', selected.failureReason],
                  ['Resource type', selected.resourceType],
                  ['Resource ID', selected.resourceId],
                  ['Patient NUHI', selected.patientNuhi],
                  ['Pathway', selected.pathway],
                  ['IP address', selected.ipAddress],
                  ['User agent', selected.userAgent],
                ] as [string, string | null][]
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-gray-800">
                    {value ?? '—'}
                  </dd>
                </div>
              ))}
              {selected.metadata && (
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-400">Metadata</dt>
                  <dd className="mt-0.5">
                    <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
