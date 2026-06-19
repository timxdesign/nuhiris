'use client';

import { useAuth } from '../../../hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome back{user ? `, ${user.username}` : ''}.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">System Status</h3>
          <p className="mt-2 text-3xl font-bold text-[#075E54]">Online</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Your Role</h3>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {user?.role.replace(/_/g, ' ') ?? '—'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">MFA Status</h3>
          <p className={`mt-2 text-xl font-semibold ${user?.mfaEnabled ? 'text-green-700' : 'text-amber-600'}`}>
            {user?.mfaEnabled ? 'Enabled' : 'Not Configured'}
          </p>
        </div>
      </div>
    </div>
  );
}
