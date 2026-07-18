'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api-client';

interface ConsentRecord {
  consentId: string;
  consentType: string;
  status: string;
  grantedTo: string | null;
  facilityName: string | null;
  scope: string;
  purpose: string;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
}

export default function PatientConsentsPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ data: ConsentRecord[] }>('/patients/me/consents');
        setConsents((result as unknown as { data: ConsentRecord[] })?.data ?? []);
      } catch {
        setConsents([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleRevoke = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this consent?')) return;
    try {
      await api(`/consents/${consentId}/revoke`, { method: 'POST' });
      setConsents((prev) =>
        prev.map((c) => (c.consentId === consentId ? { ...c, status: 'revoked' } : c)),
      );
    } catch {
      alert('Failed to revoke consent. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading your consents...</div>;
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    revoked: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Manage Consents</h2>
      <p className="mt-1 text-gray-500">
        Control which facilities and providers can access your health records
      </p>

      {consents.length === 0 ? (
        <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
          No consent records found. Consents are created when you visit a facility.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {consents.map((c) => (
            <div
              key={c.consentId}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold capitalize text-gray-900">
                    {c.consentType.replace(/_/g, ' ')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Granted to: {c.facilityName ?? c.grantedTo ?? 'Unknown'}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Purpose: {c.purpose} &middot; Scope: {c.scope}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[c.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <span>Valid from: {new Date(c.validFrom).toLocaleDateString()}</span>
                  {c.validTo && (
                    <span className="ml-4">Until: {new Date(c.validTo).toLocaleDateString()}</span>
                  )}
                </div>
                {c.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(c.consentId)}
                    className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
