'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api-client';

const ENCOUNTER_TYPES = [
  'outpatient',
  'inpatient',
  'emergency',
  'telemedicine',
  'pharmacy',
  'laboratory',
  'radiology',
  'referral',
];

export default function NewEncounterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nuhi: '',
    encounterType: 'outpatient',
    reason: '',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const encounter = await api<{ encounterId: string }>('/encounters', {
        method: 'POST',
        body: JSON.stringify({
          nuhi: form.nuhi,
          encounterType: form.encounterType,
          reason: form.reason || undefined,
          notes: form.notes || undefined,
        }),
      });
      router.push(`/encounters/${encounter.encounterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create encounter');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Open New Encounter</h1>
      <p className="mt-1 text-gray-600">Start a clinical encounter for a patient.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient NUHI</label>
          <input
            type="text"
            required
            value={form.nuhi}
            onChange={(e) => setForm({ ...form, nuhi: e.target.value })}
            placeholder="Enter patient NUHI (UUID)"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Encounter Type</label>
          <select
            value={form.encounterType}
            onChange={(e) => setForm({ ...form, encounterType: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
          >
            {ENCOUNTER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Chief complaint or reason"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#075E54] py-2.5 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
        >
          {loading ? 'Opening Encounter...' : 'Open Encounter'}
        </button>
      </form>
    </div>
  );
}
