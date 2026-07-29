'use client';

import { useState } from 'react';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/use-auth';

interface Encounter {
  encounterId: string;
  nuhi: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
}

interface Prescription {
  prescriptionId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  status: string;
  createdAt: string;
}

export default function PharmacyPage() {
  const { user } = useAuth();
  const isPharmacist = user?.role === 'pharmacist';

  const [patientNuhi, setPatientNuhi] = useState('');
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Encounter | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingRx, setLoadingRx] = useState(false);

  async function searchEncounters() {
    if (!patientNuhi.trim()) return;
    setSearching(true);
    setSelected(null);
    setPrescriptions([]);
    try {
      const data = await api<[Encounter[], number]>(`/encounters/patient/${patientNuhi}?page=1&limit=20`);
      setEncounters(Array.isArray(data) ? data[0] : []);
    } catch {
      setEncounters([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  async function selectEncounter(enc: Encounter) {
    setSelected(enc);
    await loadPrescriptions(enc.encounterId);
  }

  async function loadPrescriptions(encounterId: string) {
    setLoadingRx(true);
    try {
      setPrescriptions(await api<Prescription[]>(`/encounters/${encounterId}/prescriptions`));
    } catch {
      setPrescriptions([]);
    } finally {
      setLoadingRx(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Pharmacy Worklist</h1>
      <p className="mt-1 text-sm text-gray-500">
        Look up a patient's encounters, review prescriptions, and record dispenses.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        This access is being logged.
      </div>

      {!isPharmacist && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Dispensing is restricted to pharmacists. You can review prescriptions but not record dispenses.
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter Patient NUHI..."
          value={patientNuhi}
          onChange={(e) => setPatientNuhi(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void searchEncounters(); }}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-[#075E54] focus:outline-none focus:ring-1 focus:ring-[#075E54]"
        />
        <button
          onClick={searchEncounters}
          disabled={searching}
          className="rounded-lg bg-[#075E54] px-6 py-2 text-sm font-medium text-white hover:bg-[#064E46] disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searched && encounters.length === 0 && !searching && (
        <p className="mt-6 text-sm text-gray-500">No encounters found for this patient.</p>
      )}

      {encounters.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">Encounters</h2>
            {encounters.map((enc) => (
              <button
                key={enc.encounterId}
                onClick={() => selectEncounter(enc)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selected?.encounterId === enc.encounterId
                    ? 'border-[#075E54] bg-[#E8F5E9]'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-gray-900">{enc.encounterType}</span>
                  <span className="text-xs text-gray-500">{new Date(enc.dateTime).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{enc.reason ?? '—'}</p>
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700">Prescriptions</h2>
            {!selected && <p className="mt-2 text-sm text-gray-500">Select an encounter to see its prescriptions.</p>}
            {selected && loadingRx && <p className="mt-2 text-sm text-gray-500">Loading prescriptions...</p>}
            {selected && !loadingRx && (
              <div className="mt-2 space-y-2">
                {prescriptions.length === 0 && (
                  <p className="text-sm text-gray-500">No prescriptions on this encounter.</p>
                )}
                {prescriptions.map((p) => (
                  <PrescriptionRow
                    key={p.prescriptionId}
                    prescription={p}
                    encounterId={selected.encounterId}
                    canDispense={isPharmacist}
                    onDispensed={() => void loadPrescriptions(selected.encounterId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionRow({
  prescription: p,
  encounterId,
  canDispense,
  onDispensed,
}: {
  prescription: Prescription;
  encounterId: string;
  canDispense: boolean;
  onDispensed: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const isDispensed = p.status === 'dispensed';
  const showDispense = canDispense && !isDispensed;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{p.drugName}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : isDispensed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {p.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">{p.dosage} — {p.frequency}{p.duration ? ` for ${p.duration}` : ''}</p>
      {showDispense && (
        <div className="mt-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]"
          >
            {showForm ? 'Cancel' : 'Record dispense'}
          </button>
        </div>
      )}
      {showForm && (
        <DispenseForm
          encounterId={encounterId}
          prescriptionId={p.prescriptionId}
          onSaved={() => { setShowForm(false); onDispensed(); }}
        />
      )}
    </div>
  );
}

function DispenseForm({
  encounterId,
  prescriptionId,
  onSaved,
}: {
  encounterId: string;
  prescriptionId: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ quantity: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api(`/encounters/${encounterId}/dispenses`, {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId,
          quantity: form.quantity,
          notes: form.notes || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record dispense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Quantity dispensed *" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Recording...' : 'Confirm Dispense'}
      </button>
    </form>
  );
}
