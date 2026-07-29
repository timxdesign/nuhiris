'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../hooks/use-auth';

interface Facility {
  facilityId: string;
  name: string;
  shortName: string | null;
  type: string;
  levelOfCare: string;
  ownership: string;
  state: string;
  lga: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  accreditationStatus: string;
  operationalStatus: string;
  createdAt: string;
}

const ADMIN_ROLES = ['national_admin', 'facility_admin'];
const TYPES = ['hospital', 'clinic', 'PHC', 'laboratory', 'pharmacy', 'diagnostic_centre', 'specialist_centre', 'dental_clinic'];
const LEVELS = ['primary', 'secondary', 'tertiary'];
const OWNERSHIPS = ['federal', 'state', 'LGA', 'faith-based', 'private', 'NGO'];

interface FacilityFormState {
  name: string;
  shortName: string;
  type: string;
  levelOfCare: string;
  ownership: string;
  state: string;
  lga: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
}

const emptyForm: FacilityFormState = {
  name: '',
  shortName: '',
  type: 'hospital',
  levelOfCare: 'primary',
  ownership: 'state',
  state: '',
  lga: '',
  address: '',
  contactPhone: '',
  contactEmail: '',
};

export default function FacilitiesAdminPage() {
  const { user } = useAuth();
  const isAdmin = user != null && ADMIN_ROLES.includes(user.role);

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api<[Facility[], number]>('/facilities?page=1&limit=100');
      setFacilities(Array.isArray(result) ? result[0] : []);
    } catch (err) {
      setFacilities([]);
      setError(err instanceof Error ? err.message : 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.shortName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      f.state.toLowerCase().includes(search.toLowerCase()),
  );

  const tierColors: Record<string, string> = {
    primary: 'bg-blue-100 text-blue-700',
    secondary: 'bg-purple-100 text-purple-700',
    tertiary: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
          <p className="mt-1 text-gray-500">Manage registered healthcare facilities</p>
        </div>
        {isAdmin && !showCreate && !editing && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
          >
            Add facility
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showCreate && (
        <FacilityForm
          title="New facility"
          initial={emptyForm}
          onSubmit={async (form) => {
            await api('/facilities', {
              method: 'POST',
              body: JSON.stringify({
                name: form.name,
                shortName: form.shortName || undefined,
                type: form.type,
                levelOfCare: form.levelOfCare,
                ownership: form.ownership,
                state: form.state,
                lga: form.lga || undefined,
                address: form.address || undefined,
                contactPhone: form.contactPhone || undefined,
                contactEmail: form.contactEmail || undefined,
              }),
            });
            setShowCreate(false);
            await load();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <FacilityForm
          title={`Edit — ${editing.name}`}
          isEdit
          initial={{
            name: editing.name,
            shortName: editing.shortName ?? '',
            type: editing.type,
            levelOfCare: editing.levelOfCare,
            ownership: editing.ownership,
            state: editing.state,
            lga: editing.lga ?? '',
            address: editing.address ?? '',
            contactPhone: editing.contactPhone ?? '',
            contactEmail: editing.contactEmail ?? '',
          }}
          onSubmit={async (form) => {
            await api(`/facilities/${editing.facilityId}`, {
              method: 'PUT',
              body: JSON.stringify({
                name: form.name,
                shortName: form.shortName || undefined,
                address: form.address || undefined,
                contactPhone: form.contactPhone || undefined,
                contactEmail: form.contactEmail || undefined,
              }),
            });
            setEditing(null);
            await load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="mt-6">
        <input
          type="text"
          placeholder="Search by name or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
      </div>

      {loading ? (
        <div className="mt-8 text-gray-500">Loading facilities...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 text-gray-500">No facilities found.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Ownership</th>
                <th className="px-4 py-3">State / LGA</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((f) => (
                <tr key={f.facilityId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {f.name}
                    {f.shortName && <span className="ml-1 text-xs text-gray-400">({f.shortName})</span>}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{f.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[f.levelOfCare] ?? 'bg-gray-100 text-gray-700'}`}>
                      {f.levelOfCare}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{f.ownership}</td>
                  <td className="px-4 py-3 text-gray-600">{f.state}{f.lga ? `, ${f.lga}` : ''}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.operationalStatus === 'operational'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {f.operationalStatus}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setShowCreate(false); setEditing(f); }}
                        className="text-xs font-medium text-[#075E54] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FacilityForm({
  title,
  initial,
  isEdit = false,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: FacilityFormState;
  isEdit?: boolean;
  onSubmit: (form: FacilityFormState) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FacilityFormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Facility name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Short name" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.type} disabled={isEdit} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm capitalize disabled:bg-gray-100">
          {TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={form.levelOfCare} disabled={isEdit} onChange={(e) => setForm({ ...form, levelOfCare: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm capitalize disabled:bg-gray-100">
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select value={form.ownership} disabled={isEdit} onChange={(e) => setForm({ ...form, ownership: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm capitalize disabled:bg-gray-100">
          {OWNERSHIPS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input placeholder="State *" required disabled={isEdit} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
        <input placeholder="LGA" disabled={isEdit} value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Contact email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create facility'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
