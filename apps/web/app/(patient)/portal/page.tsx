'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';

interface PatientProfile {
  nuhi: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  state: string;
  lga: string | null;
  phone: string | null;
  ninVerified: boolean;
  registrationType: string;
  status: string;
}

export default function PatientPortalHome() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await api<PatientProfile>('/patients/me');
        setProfile(result);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading your profile...</div>;
  }

  if (!profile) {
    return (
      <div className="rounded-xl bg-yellow-50 p-6 text-yellow-800">
        Unable to load your profile. Please try again.
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
            <p className="mt-1 font-mono text-sm text-gray-500">NUHI: {profile.nuhi}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                profile.ninVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {profile.ninVerified ? 'NIN Verified' : 'Provisional Identity'}
            </span>
            <span className="text-xs text-gray-400">Status: {profile.status}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoField label="Date of Birth" value={profile.dateOfBirth} />
          <InfoField label="Sex" value={profile.sex} />
          <InfoField label="State" value={profile.state} />
          {profile.lga && <InfoField label="LGA" value={profile.lga} />}
          {profile.phone && <InfoField label="Phone" value={profile.phone} />}
          <InfoField label="Registration Type" value={profile.registrationType.replace(/_/g, ' ')} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Your NUHI QR Code</h3>
        <p className="mt-1 text-sm text-gray-500">
          Show this QR code at any NUHIRIS-connected facility for instant identity verification.
        </p>
        <button
          onClick={() => setShowQR(!showQR)}
          className="mt-4 rounded-lg border border-[#075E54] px-6 py-2 text-sm font-medium text-[#075E54] hover:bg-[#E8F5E9]"
        >
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>
        {showQR && (
          <div className="mt-4 flex flex-col items-center rounded-lg bg-gray-50 p-8">
            <div className="rounded-lg border-4 border-white bg-white p-4 shadow-lg">
              <div
                className="flex items-center justify-center"
                style={{ width: 200, height: 200, background: '#f0f0f0' }}
              >
                <span className="text-center text-xs text-gray-400">
                  QR: {profile.nuhi}
                  <br />
                  (Rendered by react-qr-code in production)
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">NUHI: {profile.nuhi}</p>
          </div>
        )}
      </div>

      {!profile.ninVerified && (
        <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h3 className="font-semibold text-orange-800">Upgrade to Verified Identity</h3>
          <p className="mt-1 text-sm text-orange-700">
            Your identity is currently provisional. Visit any NUHIRIS-connected facility with your
            NIN to complete biometric verification and access the full benefits of NUHIRIS.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-0.5 capitalize text-gray-900">{value}</dd>
    </div>
  );
}
