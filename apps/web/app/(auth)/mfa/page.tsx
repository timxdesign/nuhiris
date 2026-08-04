'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/auth-store';
import { landingPathForRole } from '../../../lib/demo-accounts';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    accountId: string;
    username: string;
    email: string;
    role: string;
    facilityId: string | null;
    providerId: string | null;
    mfaEnabled: boolean;
  };
}

export default function MfaPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const mfaSessionToken = sessionStorage.getItem('mfaSessionToken');
    if (!mfaSessionToken) {
      router.push('/login');
      return;
    }

    try {
      const result = await api<AuthResponse>('/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ totpCode: code, mfaSessionToken }),
        skipAuth: true,
      });

      sessionStorage.removeItem('mfaSessionToken');
      login(result.accessToken, result.refreshToken, result.user);
      router.push(landingPathForRole(result.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#075E54]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#075E54]">MFA Verification</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the 6-digit code from your authenticator app</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
              placeholder="000000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-[#075E54] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Back to login
          </button>
        </form>
      </div>
    </main>
  );
}
