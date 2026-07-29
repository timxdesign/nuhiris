'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../hooks/use-auth';
import { LabResultForm } from '../../../../components/lab-result-form';
import { DocumentsPanel } from '../../../../components/documents-panel';

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

interface Allergy {
  allergyId: string;
  substanceName: string;
  substanceCode: string | null;
  reaction: string | null;
  severity: string | null;
  status: string;
}

interface Immunisation {
  immunisationId: string;
  vaccineName: string;
  vaccineCode: string;
  doseNumber: number | null;
  administeredAt: string;
  status: string;
}

type Tab = 'diagnoses' | 'prescriptions' | 'observations' | 'labs' | 'allergies' | 'immunisations';

export default function EncounterDetailPage() {
  const { encounterId } = useParams<{ encounterId: string }>();
  const { user } = useAuth();
  const isPharmacist = user?.role === 'pharmacist';
  const isLabScientist = user?.role === 'lab_scientist';
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('diagnoses');
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [immunisations, setImmunisations] = useState<Immunisation[]>([]);
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
    } else if (activeTab === 'allergies' && encounter) {
      setAllergies(await api<Allergy[]>(`/encounters/patient/${encounter.nuhi}/allergies`));
    } else if (activeTab === 'immunisations' && encounter) {
      setImmunisations(await api<Immunisation[]>(`/encounters/patient/${encounter.nuhi}/immunisations`));
    }
  }, [encounterId, activeTab, encounter]);

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
    { id: 'allergies', label: 'Allergies' },
    { id: 'immunisations', label: 'Immunisations' },
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
            {showForm ? 'Cancel' : `Add ${
              { diagnoses: 'Diagnosis', prescriptions: 'Prescription', observations: 'Observation', labs: 'Lab Order', allergies: 'Allergy', immunisations: 'Immunisation' }[activeTab]
            }`}
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
        {showForm && activeTab === 'allergies' && (
          <AllergyForm encounterId={encounterId} nuhi={encounter.nuhi} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}
        {showForm && activeTab === 'immunisations' && (
          <ImmunisationForm encounterId={encounterId} nuhi={encounter.nuhi} onSaved={() => { setShowForm(false); void loadTab(); }} />
        )}

        {activeTab === 'diagnoses' && <DiagnosisList items={diagnoses} />}
        {activeTab === 'prescriptions' && (
          <PrescriptionList
            items={prescriptions}
            encounterId={encounterId}
            canDispense={isPharmacist}
            onDispensed={() => void loadTab()}
          />
        )}
        {activeTab === 'observations' && <ObservationList items={observations} />}
        {activeTab === 'labs' && (
          <LabOrderList
            items={labOrders}
            encounterId={encounterId}
            canRecordResult={isLabScientist}
            onResultRecorded={() => void loadTab()}
          />
        )}
        {activeTab === 'allergies' && <AllergyList items={allergies} />}
        {activeTab === 'immunisations' && <ImmunisationList items={immunisations} />}
      </div>

      <div className="mt-8">
        <DocumentsPanel nuhi={encounter.nuhi} encounterId={encounter.encounterId} />
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

function PrescriptionList({
  items,
  encounterId,
  canDispense = false,
  onDispensed,
}: {
  items: Prescription[];
  encounterId: string;
  canDispense?: boolean;
  onDispensed?: () => void;
}) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No prescriptions.</p>;
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <PrescriptionRow
          key={p.prescriptionId}
          prescription={p}
          encounterId={encounterId}
          canDispense={canDispense}
          onDispensed={onDispensed}
        />
      ))}
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
  onDispensed?: () => void;
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
          onSaved={() => { setShowForm(false); onDispensed?.(); }}
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

function AllergyForm({ encounterId, nuhi, onSaved }: { encounterId: string; nuhi: string; onSaved: () => void }) {
  const [form, setForm] = useState({ substanceName: '', substanceCode: '', reaction: '', severity: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api(`/encounters/${encounterId}/allergies`, {
        method: 'POST',
        body: JSON.stringify({
          nuhi,
          substanceName: form.substanceName,
          substanceCode: form.substanceCode || undefined,
          reaction: form.reaction || undefined,
          severity: form.severity || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record allergy');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Substance name *" required value={form.substanceName} onChange={(e) => setForm({ ...form, substanceName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Substance code" value={form.substanceCode} onChange={(e) => setForm({ ...form, substanceCode: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Reaction" value={form.reaction} onChange={(e) => setForm({ ...form, reaction: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm">
          <option value="">Severity…</option>
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Allergy'}
      </button>
    </form>
  );
}

function ImmunisationForm({ encounterId, nuhi, onSaved }: { encounterId: string; nuhi: string; onSaved: () => void }) {
  const [form, setForm] = useState({ vaccineCode: '', vaccineName: '', doseNumber: '', lotNumber: '', site: '', route: '', administeredAt: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api(`/encounters/${encounterId}/immunisations`, {
        method: 'POST',
        body: JSON.stringify({
          nuhi,
          vaccineCode: form.vaccineCode,
          vaccineName: form.vaccineName,
          doseNumber: form.doseNumber ? parseInt(form.doseNumber, 10) : undefined,
          lotNumber: form.lotNumber || undefined,
          site: form.site || undefined,
          route: form.route || undefined,
          administeredAt: form.administeredAt ? new Date(form.administeredAt).toISOString() : undefined,
          notes: form.notes || undefined,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record immunisation');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Vaccine code *" required value={form.vaccineCode} onChange={(e) => setForm({ ...form, vaccineCode: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Vaccine name *" required value={form.vaccineName} onChange={(e) => setForm({ ...form, vaccineName: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Dose number" type="number" min="1" value={form.doseNumber} onChange={(e) => setForm({ ...form, doseNumber: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Lot number" value={form.lotNumber} onChange={(e) => setForm({ ...form, lotNumber: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Site (e.g. left deltoid)" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Route (e.g. intramuscular)" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Administered at" type="datetime-local" value={form.administeredAt} onChange={(e) => setForm({ ...form, administeredAt: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded border border-gray-300 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded bg-[#075E54] px-4 py-2 text-sm text-white hover:bg-[#064E46] disabled:opacity-50">
        {loading ? 'Saving...' : 'Save Immunisation'}
      </button>
    </form>
  );
}

function AllergyList({ items }: { items: Allergy[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No known allergies for this patient.</p>;
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.allergyId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-800">{a.substanceName}</span>
            {a.severity && <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">{a.severity}</span>}
          </div>
          {a.reaction && <p className="mt-1 text-sm text-gray-600">Reaction: {a.reaction}</p>}
          {a.substanceCode && <p className="mt-0.5 font-mono text-xs text-gray-400">{a.substanceCode}</p>}
        </div>
      ))}
    </div>
  );
}

function ImmunisationList({ items }: { items: Immunisation[] }) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No immunisation records for this patient.</p>;
  return (
    <div className="space-y-2">
      {items.map((im) => (
        <div key={im.immunisationId} className="rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {im.vaccineName}{im.doseNumber ? ` (Dose ${im.doseNumber})` : ''}
            </span>
            <span className="text-xs text-gray-500">{new Date(im.administeredAt).toLocaleDateString()}</span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-gray-400">{im.vaccineCode}</p>
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

function LabOrderList({
  items,
  encounterId,
  canRecordResult = false,
  onResultRecorded,
}: {
  items: LabOrder[];
  encounterId: string;
  canRecordResult?: boolean;
  onResultRecorded?: () => void;
}) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No lab orders.</p>;
  return (
    <div className="space-y-2">
      {items.map((l) => (
        <LabOrderRow
          key={l.orderId}
          order={l}
          encounterId={encounterId}
          canRecordResult={canRecordResult}
          onResultRecorded={onResultRecorded}
        />
      ))}
    </div>
  );
}

function LabOrderRow({
  order: l,
  encounterId,
  canRecordResult,
  onResultRecorded,
}: {
  order: LabOrder;
  encounterId: string;
  canRecordResult: boolean;
  onResultRecorded?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const isCompleted = l.status === 'completed';
  const showRecord = canRecordResult && !isCompleted;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">{l.testName}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {l.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">{l.loincCode} | {l.urgency} | {new Date(l.orderedAt).toLocaleDateString()}</p>
      {showRecord && (
        <div className="mt-2">
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded border border-[#075E54] px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#E8F5E9]"
          >
            {showForm ? 'Cancel' : 'Record result'}
          </button>
        </div>
      )}
      {showForm && (
        <LabResultForm
          encounterId={encounterId}
          orderId={l.orderId}
          onSaved={() => { setShowForm(false); onResultRecorded?.(); }}
        />
      )}
    </div>
  );
}

