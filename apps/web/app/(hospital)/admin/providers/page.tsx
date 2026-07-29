'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../hooks/use-auth';

interface Provider {
  providerId: string;
  fullName: string;
  category: string;
  specialty: string | null;
  licenceNumber: string | null;
  regulatoryBody: string | null;
  verificationStatus: string;
  status: string;
  createdAt: string;
}

interface Affiliation {
  affiliationId: string;
  facilityId: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

const ADMIN_ROLES = ['national_admin', 'facility_admin'];
const CATEGORIES = ['doctor', 'nurse', 'pharmacist', 'lab_scientist', 'radiographer', 'physiotherapist', 'allied_health', 'admin'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'locum', 'consultant'];

export default function ProvidersAdminPage() {
  const { user } = useAuth();
  const isAdmin = user != null && ADMIN_ROLES.includes(user.role);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api<[Provider[], number]>('/providers/search?page=1&limit=100');
      setProviders(Array.isArray(result) ? result[0] : []);
    } catch (err) {
      setProviders([]);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = providers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (p.licenceNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.specialty ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
          <p className="mt-1 text-gray-500">Manage healthcare providers and their licences</p>
        </div>
        {isAdmin && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
          >
            Add provider
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showCreate && (
        <CreateProviderForm
          onSaved={() => { setShowCreate(false); void load(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name, licence, or specialty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
      </div>

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading providers…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">No providers found.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((p) => (
            <ProviderRow key={p.providerId} provider={p} isAdmin={isAdmin} onChanged={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateProviderForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ fullName: '', category: 'doctor', specialty: '', licenceNumber: '', regulatoryBody: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/providers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          category: form.category,
          specialty: form.specialty || undefined,
          licenceNumber: form.licenceNumber || undefined,
          regulatoryBody: form.regulatoryBody || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-gray-900">New provider</h2>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Full name *" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm capitalize">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input placeholder="Specialty" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Licence number" value={form.licenceNumber} onChange={(e) => setForm({ ...form, licenceNumber: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Regulatory body (e.g. MDCN)" value={form.regulatoryBody} onChange={(e) => setForm({ ...form, regulatoryBody: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50">
          {saving ? 'Creating…' : 'Create provider'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProviderRow({ provider: p, isAdmin, onChanged }: { provider: Provider; isAdmin: boolean; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [affLoading, setAffLoading] = useState(false);
  const [showAffForm, setShowAffForm] = useState(false);
  const [error, setError] = useState('');

  const loadAffiliations = async () => {
    setAffLoading(true);
    try {
      const data = await api<Affiliation[]>(`/providers/${p.providerId}/affiliations`);
      setAffiliations(Array.isArray(data) ? data : []);
    } catch {
      setAffiliations([]);
    } finally {
      setAffLoading(false);
    }
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) void loadAffiliations();
  };

  const handleVerify = async () => {
    const source = prompt('Verification source (e.g. MDCN register):', p.regulatoryBody ?? 'MDCN');
    if (!source) return;
    setError('');
    try {
      await api(`/providers/${p.providerId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ source }),
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  const handleCloseAffiliation = async (affiliationId: string) => {
    if (!confirm('End this affiliation?')) return;
    try {
      await api(`/providers/${p.providerId}/affiliations/${affiliationId}`, { method: 'DELETE' });
      await loadAffiliations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end affiliation');
    }
  };

  const verified = p.verificationStatus === 'verified';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{p.fullName}</p>
          <p className="text-sm text-gray-500 capitalize">
            {p.category.replace(/_/g, ' ')}
            {p.specialty ? ` · ${p.specialty}` : ''}
            {p.licenceNumber ? ` · ${p.licenceNumber}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {p.verificationStatus}
          </span>
          {isAdmin && !verified && (
            <button onClick={() => void handleVerify()} className="rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]">
              Verify
            </button>
          )}
          <button onClick={toggleExpand} className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
            {expanded ? 'Hide affiliations' : 'Affiliations'}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {expanded && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {affLoading ? (
            <p className="text-sm text-gray-500">Loading affiliations…</p>
          ) : affiliations.length === 0 ? (
            <p className="text-sm text-gray-500">No facility affiliations.</p>
          ) : (
            <ul className="space-y-1.5">
              {affiliations.map((a) => (
                <li key={a.affiliationId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                  <span className="text-sm text-gray-700">
                    <span className="font-mono text-xs">{a.facilityId.slice(0, 8)}…</span>
                    {' · '}{a.employmentType.replace(/_/g, ' ')} · from {a.startDate}
                    {a.endDate ? ` to ${a.endDate}` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                    {isAdmin && a.status === 'active' && (
                      <button onClick={() => void handleCloseAffiliation(a.affiliationId)} className="text-xs text-red-600 hover:underline">
                        End
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isAdmin && !showAffForm && (
            <button onClick={() => setShowAffForm(true)} className="mt-2 rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]">
              Add affiliation
            </button>
          )}
          {isAdmin && showAffForm && (
            <AffiliationForm
              providerId={p.providerId}
              onSaved={() => { setShowAffForm(false); void loadAffiliations(); }}
              onCancel={() => setShowAffForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AffiliationForm({ providerId, onSaved, onCancel }: { providerId: string; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ facilityId: '', employmentType: 'full_time', startDate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/providers/${providerId}/affiliations`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add affiliation');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
      <div className="grid grid-cols-3 gap-3">
        <input placeholder="Facility ID *" required value={form.facilityId} onChange={(e) => setForm({ ...form, facilityId: e.target.value })} className="rounded border border-gray-300 px-3 py-2 font-mono text-sm" />
        <select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
          {saving ? 'Adding…' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
