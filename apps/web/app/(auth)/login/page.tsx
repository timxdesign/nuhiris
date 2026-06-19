'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/auth-store';

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

interface MfaChallengeResponse {
  mfaRequired: boolean;
  mfaSessionToken: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api<AuthResponse | MfaChallengeResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      });

      if ('mfaRequired' in result && result.mfaRequired) {
        sessionStorage.setItem('mfaSessionToken', result.mfaSessionToken);
        router.push('/mfa');
        return;
      }

      const auth = result as AuthResponse;
      login(auth.accessToken, auth.refreshToken, auth.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#075E54]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#075E54]">NUHIRIS</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#075E54] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#064e46] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
