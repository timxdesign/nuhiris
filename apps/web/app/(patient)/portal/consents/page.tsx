'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../../lib/api-client';

interface ConsentRecord {
  consentId: string;
  granteeType: 'provider' | 'facility' | 'role';
  granteeId: string;
  purpose: string;
  scope: string[];
  validFrom: string;
  validTo: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const PURPOSES = ['TREATMENT', 'RESEARCH', 'INSURANCE', 'ADMIN'];
const SCOPES = ['patients', 'encounters', 'documents', '*'];

function consentStatus(c: ConsentRecord): 'active' | 'revoked' | 'expired' {
  if (c.revokedAt) return 'revoked';
  if (c.validTo && new Date(c.validTo) < new Date()) return 'expired';
  return 'active';
}

export default function PatientConsentsPage() {
  const [nuhi, setNuhi] = useState<string | null>(null);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showGrant, setShowGrant] = useState(false);
  const [granteeType, setGranteeType] = useState<'provider' | 'facility' | 'role'>('facility');
  const [granteeId, setGranteeId] = useState('');
  const [purpose, setPurpose] = useState('TREATMENT');
  const [scope, setScope] = useState<string[]>(['*']);
  const [validTo, setValidTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile = await api<{ nuhi: string }>('/patients/me');
      setNuhi(profile.nuhi);
      const data = await api<ConsentRecord[]>(`/patients/${profile.nuhi}/consents`);
      setConsents(Array.isArray(data) ? data : []);
    } catch {
      setConsents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRevoke = async (consentId: string) => {
    const reason = prompt('Why are you revoking this consent?');
    if (!reason || !nuhi) return;
    try {
      await api(`/patients/${nuhi}/consents/${consentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      await load();
    } catch {
      setError('Failed to revoke consent. Please try again.');
    }
  };

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuhi || !granteeId.trim() || scope.length === 0) {
      setError('Grantee ID and at least one scope are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api(`/patients/${nuhi}/consents`, {
        method: 'POST',
        body: JSON.stringify({
          granteeType,
          granteeId: granteeId.trim(),
          purpose,
          scope,
          ...(validTo ? { validTo: new Date(validTo).toISOString() } : {}),
        }),
      });
      setShowGrant(false);
      setGranteeId('');
      setScope(['*']);
      setValidTo('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant consent');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Consents</h2>
          <p className="mt-1 text-gray-500">
            Control which facilities and providers can access your health records
          </p>
        </div>
        {!showGrant && (
          <button
            onClick={() => setShowGrant(true)}
            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
          >
            Grant new consent
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showGrant && (
        <form onSubmit={handleGrant} className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Grant access to your records</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-gray-700">
              Who are you granting access to?
              <select
                value={granteeType}
                onChange={(e) => setGranteeType(e.target.value as typeof granteeType)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
              >
                <option value="facility">A facility (hospital / clinic)</option>
                <option value="provider">A specific provider</option>
                <option value="role">A role</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-700">
              Purpose
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-gray-700">
            Facility / provider ID
            <input
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
              placeholder="Ask the facility for their NUHIRIS ID"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 font-mono text-sm"
            />
          </label>
          <fieldset>
            <legend className="text-xs font-medium text-gray-700">What can they see?</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={scope.includes(s)}
                    onChange={() => toggleScope(s)}
                    className="rounded border-gray-300"
                  />
                  {s === '*' ? 'All records' : s}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-xs font-medium text-gray-700">
            Access expires (optional)
            <input
              type="date"
              value={validTo}
              onChange={(e) => setValidTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
            >
              {submitting ? 'Granting…' : 'Grant consent'}
            </button>
            <button
              type="button"
              onClick={() => setShowGrant(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {consents.length === 0 ? (
        <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
          No consent records found. Grant a consent to let a facility or provider access your records.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {consents.map((c) => {
            const status = consentStatus(c);
            return (
              <div
                key={c.consentId}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold capitalize text-gray-900">
                      {c.granteeType} access
                    </h3>
                    <p className="mt-1 font-mono text-sm text-gray-600">{c.granteeId}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      Purpose: {c.purpose} &middot; Scope:{' '}
                      {c.scope.map((s) => (s === '*' ? 'all records' : s)).join(', ')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    <span>Valid from: {new Date(c.validFrom).toLocaleDateString()}</span>
                    {c.validTo && (
                      <span className="ml-4">Until: {new Date(c.validTo).toLocaleDateString()}</span>
                    )}
                  </div>
                  {status === 'active' && (
                    <button
                      onClick={() => void handleRevoke(c.consentId)}
                      className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
