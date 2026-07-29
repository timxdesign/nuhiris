'use client';

import { useState } from 'react';
import { api } from '../lib/api-client';

export function LabResultForm({
  encounterId,
  orderId,
  onSaved,
}: {
  encounterId: string;
  orderId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    resultValue: '',
    resultUnit: '',
    referenceRange: '',
    interpretation: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api(`/encounters/${encounterId}/lab-results`, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          resultValue: form.resultValue || undefined,
          resultUnit: form.resultUnit || undefined,
          referenceRange: form.referenceRange || undefined,
          interpretation: form.interpretation || undefined,
          notes: form.notes || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record result');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Result value *" required value={form.resultValue} onChange={(e) => setForm({ ...form, resultValue: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Unit" value={form.resultUnit} onChange={(e) => setForm({ ...form, resultUnit: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Reference range" value={form.referenceRange} onChange={(e) => setForm({ ...form, referenceRange: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.interpretation} onChange={(e) => setForm({ ...form, interpretation: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">Interpretation…</option>
          <option value="normal">Normal</option>
          <option value="abnormal">Abnormal</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Recording...' : 'Confirm Result'}
      </button>
    </form>
  );
}
