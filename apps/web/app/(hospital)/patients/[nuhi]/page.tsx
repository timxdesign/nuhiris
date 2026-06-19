'use client';

import { useEffect, useState } from 'react';
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

export default function PatientProfilePage() {
  const params = useParams<{ nuhi: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<Patient>(`/patients/${params.nuhi}`);
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.nuhi]);

  if (loading) {
    return <div className="text-gray-500">Loading patient...</div>;
  }

  if (error || !patient) {
    return <div className="text-red-600">{error || 'Patient not found'}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
          <span className="mt-1 inline-block rounded-lg bg-[#E8F5E9] px-3 py-1 font-mono text-sm font-bold text-[#1B5E20]">
            NUHI: {patient.nuhi}
          </span>
        </div>
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
          <div>
            <dt className="text-gray-500">Registered On</dt>
            <dd className="font-medium text-gray-900">{new Date(patient.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4">
        <Link href="/patients" className="text-sm text-[#075E54] hover:underline">
          &larr; Back to search
        </Link>
      </div>
    </div>
  );
}
