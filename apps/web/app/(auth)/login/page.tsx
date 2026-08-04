'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api-client';
import { useAuthStore } from '../../../store/auth-store';
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  landingPathForRole,
  type DemoAccount,
} from '../../../lib/demo-accounts';

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

/** Demo panel is on by default; set NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false to hide it. */
const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS !== 'false';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(DEMO_ENABLED);
  const [pendingDemo, setPendingDemo] = useState<string | null>(null);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  async function signIn(user: string, pass: string) {
    setError('');
    setLoading(true);

    try {
      const result = await api<AuthResponse | MfaChallengeResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: user, password: pass }),
        skipAuth: true,
      });

      if ('mfaRequired' in result && result.mfaRequired) {
        sessionStorage.setItem('mfaSessionToken', result.mfaSessionToken);
        router.push('/mfa');
        return;
      }

      const auth = result as AuthResponse;
      login(auth.accessToken, auth.refreshToken, auth.user);
      router.push(landingPathForRole(auth.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
      setPendingDemo(null);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(username, password);
  }

  function handleDemoLogin(account: DemoAccount) {
    setUsername(account.username);
    setPassword(DEMO_PASSWORD);
    setPendingDemo(account.username);
    void signIn(account.username, DEMO_PASSWORD);
  }

  return (
    <main className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ─── Brand / sign-in column ─── */}
      <section className="flex flex-col justify-center bg-[#075E54] px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-white">NUHIRIS</h1>
            <p className="mt-2 text-sm leading-relaxed text-green-100">
              National Unified Health Identity and Records Integration System
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-500">Use your NUHIRIS credentials to continue.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
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
                  autoComplete="current-password"
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
                {loading && pendingDemo === null ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            {DEMO_ENABLED && (
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="mt-4 w-full text-sm font-medium text-[#075E54] hover:underline lg:hidden"
              >
                {showDemo ? 'Hide demo accounts' : 'Show demo accounts'}
              </button>
            )}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-green-200">
            Access to patient records is logged. Unauthorised access is an offence under the
            Nigeria Data Protection Act.
          </p>
        </div>
      </section>

      {/* ─── Demo account column ─── */}
      {DEMO_ENABLED && (
        <section
          className={`px-6 py-12 lg:block lg:px-12 ${showDemo ? 'block' : 'hidden'}`}
          aria-label="Demo accounts"
        >
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Demo environment
              </span>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">
                Sign in as any role
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Every demo account uses the password{' '}
                <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-800">
                  {DEMO_PASSWORD}
                </code>
                . Selecting a card signs you straight in.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => {
                const isPending = pendingDemo === account.username;
                return (
                  <li key={account.username}>
                    <button
                      type="button"
                      onClick={() => handleDemoLogin(account)}
                      disabled={loading}
                      className="h-full w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#075E54] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#075E54]/30 disabled:opacity-60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {account.roleLabel}
                        </span>
                        {isPending && (
                          <span className="text-xs font-medium text-[#075E54]">Signing in…</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">{account.displayName}</p>
                      <p className="text-xs text-gray-500">{account.facility}</p>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        {account.highlight}
                      </p>
                      <p className="mt-2 font-mono text-xs text-[#075E54]">{account.username}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
