'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api-client';

interface Patient {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  lga: string | null;
  phone: string | null;
  email: string | null;
  ninVerified: boolean;
  registrationType: string;
  status: string;
  provisionalDeadline: string | null;
  createdAt: string;
}

interface Encounter {
  encounterId: string;
  encounterType: string;
  status: string;
  reason: string | null;
  dateTime: string;
}

interface Allergy {
  allergyId: string;
  substanceName: string;
  reaction: string | null;
  severity: string | null;
  status: string;
}

interface Immunisation {
  immunisationId: string;
  vaccineName: string;
  doseNumber: number | null;
  administeredAt: string;
  status: string;
}

export default function PatientProfilePage() {
  const params = useParams<{ nuhi: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [immunisations, setImmunisations] = useState<Immunisation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [patientData, encounterData, allergyData, immunData] = await Promise.all([
        api<Patient>(`/patients/${params.nuhi}`),
        api<[Encounter[], number]>(`/encounters/patient/${params.nuhi}?page=1&limit=10`).catch(() => [[], 0] as [Encounter[], number]),
        api<Allergy[]>(`/encounters/patient/${params.nuhi}/allergies`).catch(() => [] as Allergy[]),
        api<Immunisation[]>(`/encounters/patient/${params.nuhi}/immunisations`).catch(() => [] as Immunisation[]),
      ]);
      setPatient(patientData);
      setEncounters(Array.isArray(encounterData) ? encounterData[0] : []);
      setAllergies(allergyData);
      setImmunisations(immunData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally {
      setLoading(false);
    }
  }, [params.nuhi]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (loading) {
    return <div className="text-gray-500 py-12 text-center">Loading patient...</div>;
  }

  if (error || !patient) {
    return <div className="text-red-600">{error || 'Patient not found'}</div>;
  }

  const statusColor: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
          <span className="mt-1 inline-block rounded-lg bg-[#E8F5E9] px-3 py-1 font-mono text-sm font-bold text-[#1B5E20]">
            NUHI: {patient.nuhi}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/encounters/new?nuhi=${patient.nuhi}`}
            className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064E46]"
          >
            New Encounter
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              patient.status === 'active'
                ? 'bg-green-100 text-green-700'
                : patient.status === 'provisional'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {patient.status}
          </span>
        </div>
      </div>

      {patient.provisionalDeadline && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          Provisional registration expires: <strong>{patient.provisionalDeadline}</strong>.
          NIN verification required before deadline.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Demographics</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Date of Birth</dt>
            <dd className="font-medium text-gray-900">{patient.dateOfBirth}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Sex</dt>
            <dd className="font-medium capitalize text-gray-900">{patient.sex}</dd>
          </div>
          <div>
            <dt className="text-gray-500">State</dt>
            <dd className="font-medium text-gray-900">{patient.state}</dd>
          </div>
          <div>
            <dt className="text-gray-500">LGA</dt>
            <dd className="font-medium text-gray-900">{patient.lga ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-900">{patient.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{patient.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">NIN Verified</dt>
            <dd className={`font-medium ${patient.ninVerified ? 'text-green-700' : 'text-amber-600'}`}>
              {patient.ninVerified ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Registration Type</dt>
            <dd className="font-medium capitalize text-gray-900">{patient.registrationType.replace(/_/g, ' ')}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Allergies</h3>
          {allergies.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No known allergies</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {allergies.map((a) => (
                <li key={a.allergyId} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <span className="text-sm font-medium text-red-800">{a.substanceName}</span>
                  {a.severity && <span className="text-xs text-red-600">{a.severity}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Immunisations</h3>
          {immunisations.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No immunisation records</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {immunisations.map((im) => (
                <li key={im.immunisationId} className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
                  <span className="text-sm font-medium text-blue-800">{im.vaccineName}{im.doseNumber ? ` (Dose ${im.doseNumber})` : ''}</span>
                  <span className="text-xs text-blue-600">{new Date(im.administeredAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Clinical Timeline</h3>
        {encounters.length === 0 ? (
          <p className="text-sm text-gray-500">No encounters on record.</p>
        ) : (
          <div className="space-y-3">
            {encounters.map((enc) => (
              <Link
                key={enc.encounterId}
                href={`/encounters/${enc.encounterId}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{enc.encounterType}</p>
                  <p className="text-xs text-gray-500">{enc.reason ?? 'No reason specified'}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[enc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {enc.status.replace('_', ' ')}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">{new Date(enc.dateTime).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link href="/patients" className="text-sm text-[#075E54] hover:underline">
          &larr; Back to search
        </Link>
      </div>
    </div>
  );
}
