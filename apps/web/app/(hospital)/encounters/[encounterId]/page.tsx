'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api-client';

interface Encounter {
  encounterId: string;
  nuhi: string;
  providerId: string;
  facilityId: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
  notes: string | null;
}

interface Diagnosis {
  diagnosisId: string;
  icd11Code: string;
  description: string | null;
  status: string | null;
  severity: string | null;
  createdAt: string;
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

interface Observation {
  observationId: string;
  loincCode: string;
  display: string | null;
  valueQuantity: string | null;
  valueUnit: string | null;
  valueString: string | null;
  createdAt: string;
}

interface LabOrder {
  orderId: string;
  testName: string;
  loincCode: string;
  urgency: string;
  status: string;
  orderedAt: string;
}

type Tab = 'diagnoses' | 'prescriptions' | 'observations' | 'labs';

export default function EncounterDetailPage() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('diagnoses');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [showForm, setShowForm] = useState(false);

  const loadEncounter = useCallback(async () => {
    const data = await api<Encounter>(`/encounters/${encounterId}`);
    setEncounter(data);
  }, [encounterId]);

  const loadTab = useCallback(async () => {
    if (activeTab === 'diagnoses') {
      setDiagnoses(await api<Diagnosis[]>(`/encounters/${encounterId}/diagnoses`));
    } else if (activeTab === 'prescriptions') {
      setPrescriptions(await api<Prescription[]>(`/encounters/${encounterId}/prescriptions`));
    } else if (activeTab === 'observations') {
      setObservations(await api<Observation[]>(`/encounters/${encounterId}/observations`));
    } else if (activeTab === 'labs') {
      setLabOrders(await api<LabOrder[]>(`/encounters/${encounterId}/lab-orders`));
    }
  }, [encounterId, activeTab]);

  useEffect(() => { void loadEncounter(); }, [loadEncounter]);
  useEffect(() => { void loadTab(); }, [loadTab]);

  async function closeEncounter() {
    await api(`/encounters/${encounterId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'closed' }),
    });
    await loadEncounter();
  }

  if (!encounter) {
    return <div className="text-center text-gray-500 py-12">Loading encounter...</div>;
  }

  const isOpen = encounter.status === 'open' || encounter.status === 'in_progress';
  const tabs: { id: Tab; label: string }[] = [
    { id: 'diagnoses', label: 'Diagnoses' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'observations', label: 'Observations' },
    { id: 'labs', label: 'Lab Orders' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Encounter — {encounter.encounterType}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(encounter.dateTime).toLocaleString()} | Patient: {encounter.nuhi.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {encounter.status.replace('_', ' ')}
          </span>
          {isOpen && (
            <button
              onClick={closeEncounter}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Close Encounter
            </button>
          )}
        </div>
      </div>

      {encounter.reason && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <span className="text-xs font-medium text-gray-500">Reason:</span>
          <p className="text-sm text-gray-900">{encounter.reason}</p>
        </div>
      )}

      <div className="mt-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-[#075E54] text-[#075E54]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {isOpen && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-4 rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
          >
            {showForm ? 'Cancel' : `Add ${tabs.find((t) => t.id === activeTab)?.label.slice(0, -1)}`}
          </button>
        )}

        {showForm && activeTab === 'diagnoses' && (
          <DiagnosisForm encounterId={encounterId} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}
        {showForm && activeTab === 'prescriptions' && (
          <PrescriptionForm encounterId={encounterId} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}
        {showForm && activeTab === 'observations' && (
          <ObservationForm encounterId={encounterId} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}
        {showForm && activeTab === 'labs' && (
          <LabOrderForm encounterId={encounterId} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}

        {activeTab === 'diagnoses' && <DiagnosisList items={diagnoses} />}
        {activeTab === 'prescriptions' && <PrescriptionList items={prescriptions} />}
        {activeTab === 'observations' && <ObservationList items={observations} />}
        {activeTab === 'labs' && <LabOrderList items={labOrders} />}
      </div>
    </div>
  );
}

function DiagnosisForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ icd11Code: '', description: '', status: 'active', severity: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await api(`/encounters/${encounterId}/diagnoses`, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="ICD-11 Code *" required value={form.icd11Code} onChange={(e) => setForm({ ...form, icd11Code: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="chronic">Chronic</option>
        </select>
        <input placeholder="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Diagnosis'}
      </button>
    </form>
  );
}

function PrescriptionForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ drugCode: '', drugName: '', dosage: '', frequency: '', duration: '', route: '', instructions: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await api(`/encounters/${encounterId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Drug Code *" required value={form.drugCode} onChange={(e) => setForm({ ...form, drugCode: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Drug Name *" required value={form.drugName} onChange={(e) => setForm({ ...form, drugName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Dosage *" required value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Frequency *" required value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <input placeholder="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Prescription'}
      </button>
    </form>
  );
}

function ObservationForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ loincCode: '', display: '', valueQuantity: '', valueUnit: '', valueString: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await api(`/encounters/${encounterId}/observations`, {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        valueQuantity: form.valueQuantity ? parseFloat(form.valueQuantity) : undefined,
      }),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="LOINC Code *" required value={form.loincCode} onChange={(e) => setForm({ ...form, loincCode: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Display Name" value={form.display} onChange={(e) => setForm({ ...form, display: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Value (numeric)" type="number" step="any" value={form.valueQuantity} onChange={(e) => setForm({ ...form, valueQuantity: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Unit" value={form.valueUnit} onChange={(e) => setForm({ ...form, valueUnit: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <input placeholder="Value (text)" value={form.valueString} onChange={(e) => setForm({ ...form, valueString: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Observation'}
      </button>
    </form>
  );
}

function LabOrderForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ loincCode: '', testName: '', urgency: 'routine' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await api(`/encounters/${encounterId}/lab-orders`, {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <input placeholder="LOINC Code *" required value={form.loincCode} onChange={(e) => setForm({ ...form, loincCode: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Test Name *" required value={form.testName} onChange={(e) => setForm({ ...form, testName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">Stat</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Order Lab Test'}
      </button>
    </form>
  );
}

function DiagnosisList({ items }: { items: Diagnosis[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No diagnoses recorded.</p>;
  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div key={d.diagnosisId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-medium text-[#075E54]">{d.icd11Code}</span>
            <span className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</span>
          </div>
          {d.description && <p className="mt-1 text-sm text-gray-700">{d.description}</p>}
          <div className="mt-1 flex gap-2">
            {d.status && <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{d.status}</span>}
            {d.severity && <span className="rounded bg-orange-50 px-2 py-0.5 text-xs text-orange-700">{d.severity}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrescriptionList({ items }: { items: Prescription[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No prescriptions.</p>;
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <div key={p.prescriptionId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{p.drugName}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {p.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{p.dosage} — {p.frequency}{p.duration ? ` for ${p.duration}` : ''}</p>
        </div>
      ))}
    </div>
  );
}

function ObservationList({ items }: { items: Observation[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No observations.</p>;
  return (
    <div className="space-y-2">
      {items.map((o) => (
        <div key={o.observationId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-[#075E54]">{o.loincCode}</span>
            <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</span>
          </div>
          {o.display && <p className="text-sm text-gray-700">{o.display}</p>}
          <p className="mt-1 text-sm font-medium text-gray-900">
            {o.valueQuantity ? `${o.valueQuantity} ${o.valueUnit ?? ''}` : o.valueString ?? '—'}
          </p>
        </div>
      ))}
    </div>
  );
}

function LabOrderList({ items }: { items: LabOrder[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No lab orders.</p>;
  return (
    <div className="space-y-2">
      {items.map((l) => (
        <div key={l.orderId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{l.testName}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${l.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {l.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{l.loincCode} | {l.urgency} | {new Date(l.orderedAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
