'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api-client';

type Step = 'nin-entry' | 'nimc-review' | 'verification' | 'demographics' | 'success';

interface NimcLookupResult {
  found: boolean;
  nin: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: string;
  state: string;
  lga: string | null;
  photoBase64: string | null;
  nimcReferenceId: string;
}

interface LivenessResult {
  passed: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
}

interface FaceMatchResult {
  matched: boolean;
  confidenceScore: number;
  nimcReferenceId: string;
}

interface RegisteredPatient {
  nuhi: string;
  fullName: string;
  status: string;
  registrationType: string;
  ninVerified: boolean;
}

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function RegisterPatientPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('nin-entry');
  const [nin, setNin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [nimcData, setNimcData] = useState<NimcLookupResult | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<RegisteredPatient | null>(null);

  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  async function handleNinLookup(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await api<NimcLookupResult>('/nin/lookup', {
        method: 'POST',
        body: JSON.stringify({ nin }),
      });
      if (!result.found) {
        setError('NIN not found in NIMC database. You can proceed with provisional registration.');
        setLoading(false);
        return;
      }
      setNimcData(result);
      setFullName(`${result.firstName} ${result.middleName ? result.middleName + ' ' : ''}${result.lastName}`);
      setDateOfBirth(result.dateOfBirth);
      setSex(result.gender);
      setState(result.state);
      setLga(result.lga ?? '');
      setStep('nimc-review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NIN lookup failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification() {
    setError('');
    setLoading(true);
    try {
      const liveness = await api<LivenessResult>('/nin/verify-liveness', {
        method: 'POST',
        body: JSON.stringify({ nin }),
      });
      setLivenessResult(liveness);

      if (!liveness.passed) {
        setError('Liveness check failed. Please ensure the patient is present and try again.');
        setLoading(false);
        return;
      }

      const face = await api<FaceMatchResult>('/nin/verify-face', {
        method: 'POST',
        body: JSON.stringify({ nin }),
      });
      setFaceResult(face);

      if (!face.matched) {
        setError('Face verification failed. The face does not match the NIN record.');
        setLoading(false);
        return;
      }

      setStep('demographics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        fullName,
        dateOfBirth,
        sex,
        state,
        registrationType: faceResult ? 'biometric_verified' : 'provisional',
      };
      if (nin) body['nin'] = nin;
      if (lga) body['lga'] = lga;
      if (phone) body['phone'] = phone;
      if (email) body['email'] = email;
      if (faceResult) {
        body['nimcReferenceId'] = faceResult.nimcReferenceId;
        body['confidenceScore'] = faceResult.confidenceScore;
      }

      const result = await api<RegisteredPatient>('/patients', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setRegisteredPatient(result);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function startProvisional() {
    setNin('');
    setNimcData(null);
    setLivenessResult(null);
    setFaceResult(null);
    setStep('demographics');
  }

  function resetForm() {
    setStep('nin-entry');
    setNin('');
    setError('');
    setNimcData(null);
    setLivenessResult(null);
    setFaceResult(null);
    setRegisteredPatient(null);
    setFullName('');
    setDateOfBirth('');
    setSex('');
    setState('');
    setLga('');
    setPhone('');
    setEmail('');
  }

  const stepLabels = ['NIN Entry', 'NIMC Review', 'Verification', 'Demographics', 'Complete'];
  const stepKeys: Step[] = ['nin-entry', 'nimc-review', 'verification', 'demographics', 'success'];
  const currentIdx = stepKeys.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
      <p className="mt-1 text-gray-500">NIN-first identity verification and NUHI assignment.</p>

      {/* Step indicator */}
      <div className="mt-6 flex items-center gap-1">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              i < currentIdx ? 'bg-green-500 text-white' :
              i === currentIdx ? 'bg-[#075E54] text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${i === currentIdx ? 'font-medium text-[#075E54]' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < stepLabels.length - 1 && <div className="mx-1 h-px w-4 bg-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: NIN Entry */}
      {step === 'nin-entry' && (
        <form onSubmit={handleNinLookup} className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Step 1: Enter NIN</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the patient&apos;s National Identification Number to pull verified demographics from NIMC.
          </p>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">NIN (11 digits)</label>
            <input
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
              required
              pattern="[0-9]{11}"
              maxLength={11}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-lg tracking-wider focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
              placeholder="00000000000"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={loading || nin.length !== 11}
              className="rounded-lg bg-[#075E54] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
            >
              {loading ? 'Looking up...' : 'Lookup NIN'}
            </button>
            <button
              type="button"
              onClick={startProvisional}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              No NIN (Provisional)
            </button>
          </div>
        </form>
      )}

      {/* Step 2: NIMC Review */}
      {step === 'nimc-review' && nimcData && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Step 2: Verify NIMC Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Demographics pulled from NIMC. Confirm this matches the patient present.
          </p>

          <div className="mt-4 flex gap-6">
            {nimcData.photoBase64 && (
              <div className="flex-shrink-0">
                <div className="h-28 w-24 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-gray-200">
                  NIN Photo
                </div>
              </div>
            )}
            <div className="grid flex-1 grid-cols-2 gap-3">
              <InfoField label="First Name" value={nimcData.firstName} />
              <InfoField label="Last Name" value={nimcData.lastName} />
              {nimcData.middleName && <InfoField label="Middle Name" value={nimcData.middleName} />}
              <InfoField label="Date of Birth" value={nimcData.dateOfBirth} />
              <InfoField label="Gender" value={nimcData.gender} />
              <InfoField label="State" value={nimcData.state} />
              {nimcData.lga && <InfoField label="LGA" value={nimcData.lga} />}
              <InfoField label="NIMC Ref" value={nimcData.nimcReferenceId} />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => { setStep('verification'); handleVerification(); }}
              disabled={loading}
              className="rounded-lg bg-[#075E54] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
            >
              Confirm &amp; Verify Identity
            </button>
            <button
              onClick={() => { setStep('nin-entry'); setError(''); }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Verification */}
      {step === 'verification' && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Step 3: Identity Verification</h2>
          <p className="mt-1 text-sm text-gray-500">
            Running liveness check and face match against NIMC records.
          </p>

          <div className="mt-4 space-y-3">
            <VerificationStep
              label="Liveness Check"
              description="Confirming the patient is physically present"
              status={livenessResult === null ? (loading ? 'running' : 'pending') : livenessResult.passed ? 'passed' : 'failed'}
              confidence={livenessResult?.confidenceScore}
            />
            <VerificationStep
              label="Face Match"
              description="Matching face against NIN photo on file"
              status={faceResult === null ? (livenessResult?.passed ? (loading ? 'running' : 'pending') : 'pending') : faceResult.matched ? 'passed' : 'failed'}
              confidence={faceResult?.confidenceScore}
            />
          </div>

          {faceResult && !faceResult.matched && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setFaceResult(null); setLivenessResult(null); handleVerification(); }}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Retry Verification
              </button>
              <button
                onClick={() => { setStep('nin-entry'); setError(''); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Demographics */}
      {step === 'demographics' && (
        <form onSubmit={handleRegister} className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-800">Step 4: Confirm Demographics</h2>
          <p className="mt-1 text-sm text-gray-500">
            {nimcData
              ? 'Review pre-filled demographics from NIMC. Add contact details.'
              : 'Enter patient demographics manually for provisional registration.'}
          </p>

          {!nimcData && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Provisional registration — patient has 30 days to provide NIN for upgrade.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                readOnly={!!nimcData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none ${nimcData ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                readOnly={!!nimcData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none ${nimcData ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sex *</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                required
                disabled={!!nimcData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none ${nimcData ? 'bg-gray-50' : ''}`}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="intersex">Intersex</option>
                <option value="not_stated">Not Stated</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                disabled={!!nimcData}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none ${nimcData ? 'bg-gray-50' : ''}`}
              >
                <option value="">Select state...</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">LGA</label>
              <input
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                readOnly={!!nimcData && !!lga}
                className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none ${nimcData && lga ? 'bg-gray-50' : ''}`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#075E54] focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#075E54] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
            >
              {loading ? 'Registering...' : nimcData ? 'Issue NUHI' : 'Register (Provisional)'}
            </button>
            {nimcData && (
              <button
                type="button"
                onClick={() => setStep('nimc-review')}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>
        </form>
      )}

      {/* Step 5: Success */}
      {step === 'success' && registeredPatient && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-green-800">Patient Registered</h2>
          <div className="mt-3">
            <span className="inline-block rounded-lg bg-white px-4 py-2 font-mono text-lg font-bold text-[#075E54] shadow-sm">
              NUHI: {registeredPatient.nuhi}
            </span>
          </div>
          <p className="mt-3 text-green-700 font-medium">{registeredPatient.fullName}</p>
          <div className="mt-2 flex items-center justify-center gap-3 text-sm">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
              registeredPatient.ninVerified
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {registeredPatient.ninVerified ? 'NIN Verified' : 'Provisional'}
            </span>
            <span className="text-gray-500">{registeredPatient.registrationType.replace(/_/g, ' ')}</span>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push(`/patients/${registeredPatient.nuhi}`)}
              className="rounded-lg bg-[#075E54] px-4 py-2 text-sm font-medium text-white hover:bg-[#064e46]"
            >
              View Patient
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Register Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function VerificationStep({
  label,
  description,
  status,
  confidence,
}: {
  label: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  confidence?: number;
}) {
  return (
    <div className={`flex items-center gap-4 rounded-lg border p-4 ${
      status === 'passed' ? 'border-green-200 bg-green-50' :
      status === 'failed' ? 'border-red-200 bg-red-50' :
      status === 'running' ? 'border-blue-200 bg-blue-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex-shrink-0">
        {status === 'running' && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        )}
        {status === 'passed' && (
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'failed' && (
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {status === 'pending' && (
          <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {confidence !== undefined && (
        <span className={`text-xs font-mono font-bold ${
          status === 'passed' ? 'text-green-600' : 'text-red-600'
        }`}>
          {(confidence * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
}
