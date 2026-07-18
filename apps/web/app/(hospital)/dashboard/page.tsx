'use client';

import Link from 'next/link';
import { useAuth } from '../../../hooks/use-auth';

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function QuickAction({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-[#075E54]/30 hover:shadow-md"
    >
      <h3 className="font-semibold text-gray-900 group-hover:text-[#075E54]">{label}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome back{user ? `, ${user.username}` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          System Online
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Your Role"
          value={user?.role.replace(/_/g, ' ') ?? '—'}
        />
        <StatCard
          label="MFA Status"
          value={user?.mfaEnabled ? 'Enabled' : 'Not Configured'}
          color={user?.mfaEnabled ? 'text-green-700' : 'text-amber-600'}
        />
        <StatCard
          label="Facility"
          value={user?.facilityId ? 'Assigned' : 'National'}
          color="text-[#075E54]"
        />
        <StatCard
          label="Session"
          value="Active"
          color="text-green-700"
        />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          href="/patients/register"
          label="Register New Patient"
          description="Create a new health identity (NUHI) for a patient"
        />
        <QuickAction
          href="/patients"
          label="Search Patients"
          description="Look up a patient by name, NIN, or NUHI"
        />
        <QuickAction
          href="/audit"
          label="View Audit Log"
          description="Review system activity and access records"
        />
      </div>

      {!user?.mfaEnabled && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                Multi-factor authentication is not configured
              </p>
              <p className="mt-1 text-sm text-amber-700">
                MFA is required for all clinical staff. Please set up TOTP from your account settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
