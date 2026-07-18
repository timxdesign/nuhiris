'use client';

import { useState } from 'react';
import { api } from '../../../lib/api-client';

interface Referral {
  referralId: string;
  encounterId: string;
  referringProviderId: string;
  receivingFacilityId: string;
  urgency: string;
  reason: string;
  status: string;
  referredAt: string;
  acceptedAt: string | null;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [encounterId, setEncounterId] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReferrals() {
    if (!encounterId.trim()) return;
    setLoading(true);
    try {
      const data = await api<Referral[]>(`/encounters/${encounterId}/referrals`);
      setReferrals(data);
    } catch {
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(referralId: string, status: 'accepted' | 'completed' | 'rejected') {
    await api(`/encounters/referrals/${referralId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    await loadReferrals();
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
      <p className="mt-1 text-gray-600">View and manage patient referrals.</p>

      <div className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter Encounter ID to view referrals..."
          value={encounterId}
          onChange={(e) => setEncounterId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
        <button
          onClick={loadReferrals}
          disabled={loading}
          className="rounded-lg bg-[#075E54] px-6 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load'}
        </button>
      </div>

      {referrals.length > 0 && (
        <div className="mt-6 space-y-3">
          {referrals.map((ref) => (
            <div key={ref.referralId} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ref.reason}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {ref.urgency} | Referred {new Date(ref.referredAt).toLocaleDateString()}
                    {ref.acceptedAt && ` | Accepted ${new Date(ref.acceptedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[ref.status] ?? 'bg-gray-100'}`}>
                  {ref.status}
                </span>
              </div>
              {ref.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateStatus(ref.referralId, 'accepted')}
                    className="rounded border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(ref.referralId, 'rejected')}
                    className="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              )}
              {ref.status === 'accepted' && (
                <button
                  onClick={() => updateStatus(ref.referralId, 'completed')}
                  className="mt-3 rounded border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  Mark Completed
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
