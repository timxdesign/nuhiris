'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api-client';
import { useAuth } from '../hooks/use-auth';

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

const GRANT_ROLES = ['health_records_officer', 'facility_admin', 'national_admin'];
const REVOKE_ROLES = ['facility_admin', 'national_admin'];
const PURPOSES = ['TREATMENT', 'RESEARCH', 'INSURANCE', 'ADMIN'];
const SCOPES = ['patients', 'encounters', 'documents', '*'];

function consentStatus(c: ConsentRecord): 'active' | 'revoked' | 'expired' {
  if (c.revokedAt) return 'revoked';
  if (c.validTo && new Date(c.validTo) < new Date()) return 'expired';
  return 'active';
}

export function ConsentPanel({ nuhi }: { nuhi: string }) {
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrant, setShowGrant] = useState(false);
  const [error, setError] = useState('');

  const [granteeType, setGranteeType] = useState<'provider' | 'facility' | 'role'>('facility');
  const [granteeId, setGranteeId] = useState('');
  const [purpose, setPurpose] = useState('TREATMENT');
  const [scope, setScope] = useState<string[]>(['*']);
  const [validTo, setValidTo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<ConsentRecord[]>(`/patients/${nuhi}/consents`);
      setConsents(Array.isArray(data) ? data : []);
    } catch {
      setConsents([]);
    } finally {
      setLoading(false);
    }
  }, [nuhi]);

  useEffect(() => { void load(); }, [load]);

  const canGrant = user && GRANT_ROLES.includes(user.role);
  const canRevoke = user && REVOKE_ROLES.includes(user.role);

  const hasActive = consents.some((c) => consentStatus(c) === 'active');
  const hasRevoked = consents.some((c) => consentStatus(c) === 'revoked');

  const overall = hasActive
    ? { label: 'Consented', classes: 'bg-green-100 text-green-700' }
    : hasRevoked
      ? { label: 'Consent revoked', classes: 'bg-red-100 text-red-700' }
      : { label: 'No consent on record', classes: 'bg-gray-100 text-gray-600' };

  const toggleScope = (s: string) => {
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!granteeId.trim() || scope.length === 0) {
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

  const handleRevoke = async (consentId: string) => {
    const reason = prompt('Reason for revoking this consent:');
    if (!reason) return;
    try {
      await api(`/patients/${nuhi}/consents/${consentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke consent');
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Consent</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${overall.classes}`}>
          {overall.label}
        </span>
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-gray-500">Loading consents…</p>
      ) : consents.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          No consent records. Clinical data access may require emergency (break-glass) justification.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {consents.map((c) => {
            const status = consentStatus(c);
            return (
              <li key={c.consentId} className="rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {c.granteeType}: <span className="font-mono text-xs">{c.granteeId}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.purpose} · scope: {c.scope.join(', ')} · from{' '}
                      {new Date(c.validFrom).toLocaleDateString()}
                      {c.validTo ? ` until ${new Date(c.validTo).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : status === 'revoked'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {status}
                    </span>
                    {status === 'active' && canRevoke && (
                      <button
                        onClick={() => void handleRevoke(c.consentId)}
                        className="rounded border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {canGrant && !showGrant && (
        <button
          onClick={() => setShowGrant(true)}
          className="mt-3 rounded-lg border border-[#075E54] px-3 py-1.5 text-sm font-medium text-[#075E54] hover:bg-[#E8F5E9]"
        >
          Grant consent
        </button>
      )}

      {canGrant && showGrant && (
        <form onSubmit={handleGrant} className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-gray-700">
              Grantee type
              <select
                value={granteeType}
                onChange={(e) => setGranteeType(e.target.value as typeof granteeType)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
              >
                <option value="facility">Facility</option>
                <option value="provider">Provider</option>
                <option value="role">Role</option>
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
            Grantee ID (facility / provider UUID)
            <input
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
              placeholder="a0000000-0000-4000-8000-000000000001"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 font-mono text-sm"
            />
          </label>
          <fieldset>
            <legend className="text-xs font-medium text-gray-700">Scope</legend>
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
            Valid until (optional)
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
              {submitting ? 'Granting…' : 'Grant'}
            </button>
            <button
              type="button"
              onClick={() => setShowGrant(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
