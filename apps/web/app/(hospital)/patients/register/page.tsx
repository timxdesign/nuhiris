'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api-client';

const REGISTRATION_TYPES = [
  { value: 'biometric_verified', label: 'Biometric Verified' },
  { value: 'selfie_verified', label: 'Selfie Verified' },
  { value: 'provider_initiated', label: 'Provider Initiated' },
  { value: 'provisional', label: 'Provisional (No NIN)' },
  { value: 'emergency', label: 'Emergency' },
];

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

interface RegisteredPatient {
  nuhi: string;
  fullName: string;
  status: string;
}

export default function RegisterPatientPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<RegisteredPatient | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string' && value.trim()) {
        body[key] = value.trim();
      }
    });

    try {
      const result = await api<RegisteredPatient>('/patients', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-green-800">Patient Registered</h2>
          <div className="mt-4">
            <span className="inline-block rounded-lg bg-[#E8F5E9] px-4 py-2 font-mono text-lg font-bold text-[#1B5E20]">
              NUHI: {success.nuhi}
            </span>
          </div>
          <p className="mt-3 text-green-700">{success.fullName}</p>
          <p className="text-sm text-green-600">Status: {success.status}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push(`/patients/${success.nuhi}`)}
              className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064e46]"
            >
              View Patient
            </button>
            <button
              onClick={() => { setSuccess(null); setError(''); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
      <p className="mt-1 text-gray-500">Enter patient demographics to create a new health identity.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
            <input name="fullName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth *</label>
            <input name="dateOfBirth" type="date" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Sex *</label>
            <select name="sex" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none">
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="intersex">Intersex</option>
              <option value="not_stated">Not Stated</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">State *</label>
            <select name="state" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none">
              <option value="">Select state...</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">LGA</label>
            <input name="lga" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" placeholder="+234..." className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">NIN (11 digits)</label>
            <input name="nin" pattern="[0-9]{11}" maxLength={11} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none" placeholder="Optional" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Registration Type *</label>
            <select name="registrationType" required className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none">
              <option value="">Select...</option>
              {REGISTRATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#075E54] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register Patient'}
        </button>
      </form>
    </div>
  );
}
