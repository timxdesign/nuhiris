'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/use-auth';
import { AccessLoggedBadge } from '../../../components/access-logged-badge';
import { LabResultForm } from '../../../components/lab-result-form';

interface LabOrder {
  orderId: string;
  testName: string;
  loincCode: string;
  urgency: string;
  status: string;
  orderedAt: string;
}

export default function LabWorklistPage() {
  const { user } = useAuth();
  const isLabScientist = user?.role === 'lab_scientist';
  const [encounterId, setEncounterId] = useState('');
  const [loadedEncounterId, setLoadedEncounterId] = useState('');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFormId, setOpenFormId] = useState<string | null>(null);

  const load = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api<LabOrder[]>(`/encounters/${id}/lab-orders`);
      setOrders(Array.isArray(data) ? data : []);
      setLoadedEncounterId(id);
    } catch (err) {
      setOrders([]);
      setLoadedEncounterId('');
      setError(err instanceof Error ? err.message : 'Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = encounterId.trim();
    if (id) void load(id);
  };

  const pending = orders.filter((o) => o.status !== 'completed');
  const completed = orders.filter((o) => o.status === 'completed');

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Lab Worklist</h1>
      <p className="mt-1 text-gray-600">
        Look up an encounter to see its lab orders and record results.
      </p>
      <AccessLoggedBadge />

      <form onSubmit={handleLookup} className="mt-6 flex gap-3">
        <input
          value={encounterId}
          onChange={(e) => setEncounterId(e.target.value)}
          placeholder="Encounter ID"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-[#075E54] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !encounterId.trim()}
          className="rounded-lg bg-[#075E54] px-5 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loadedEncounterId && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Orders for encounter <span className="font-mono">{loadedEncounterId.slice(0, 8)}…</span>
            </h2>
            <Link
              href={`/encounters/${loadedEncounterId}`}
              className="text-sm text-[#075E54] hover:underline"
            >
              Open full encounter →
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="mt-4 rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              No lab orders on this encounter.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {pending.length === 0 && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  All orders on this encounter have results.
                </p>
              )}
              {[...pending, ...completed].map((o) => (
                <div key={o.orderId} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{o.testName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {o.loincCode} | {o.urgency} | ordered {new Date(o.orderedAt).toLocaleDateString()}
                  </p>
                  {isLabScientist && o.status !== 'completed' && (
                    <div className="mt-2">
                      <button
                        onClick={() => setOpenFormId(openFormId === o.orderId ? null : o.orderId)}
                        className="rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]"
                      >
                        {openFormId === o.orderId ? 'Cancel' : 'Record result'}
                      </button>
                    </div>
                  )}
                  {openFormId === o.orderId && (
                    <LabResultForm
                      encounterId={loadedEncounterId}
                      orderId={o.orderId}
                      onSaved={() => {
                        setOpenFormId(null);
                        void load(loadedEncounterId);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
