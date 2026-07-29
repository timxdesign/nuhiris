'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/use-auth';

interface AnalyticsSummary {
  registrations: {
    total: number;
    provisional: number;
    biometricVerified: number;
    upgradeRate: number;
  };
  encounters: {
    total: number;
    open: number;
    closed: number;
  };
  generatedAt: string;
}

const ADMIN_ROLES = ['national_admin', 'facility_admin'];

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

interface Action {
  href: string;
  label: string;
  description: string;
}

function actionsForRole(role: string | undefined): Action[] {
  switch (role) {
    case 'pharmacist':
      return [
        { href: '/pharmacy', label: 'Pharmacy Worklist', description: 'Review prescriptions and record dispenses' },
        { href: '/patients', label: 'Search Patients', description: 'Look up a patient by name, NIN, or NUHI' },
      ];
    case 'lab_scientist':
      return [
        { href: '/lab', label: 'Lab Worklist', description: 'Review lab orders and record results' },
        { href: '/patients', label: 'Search Patients', description: 'Look up a patient by name, NIN, or NUHI' },
      ];
    case 'medical_officer':
    case 'nurse':
      return [
        { href: '/patients', label: 'Search Patients', description: 'Look up a patient by name, NIN, or NUHI' },
        { href: '/encounters/new', label: 'Open Encounter', description: 'Start a new clinical encounter' },
        { href: '/referrals', label: 'Referrals', description: 'Create and track patient referrals' },
      ];
    case 'audit_inspector':
      return [
        { href: '/audit', label: 'View Audit Log', description: 'Review system activity and access records' },
      ];
    case 'national_admin':
    case 'facility_admin':
      return [
        { href: '/admin/providers', label: 'Manage Providers', description: 'Create, verify, and affiliate providers' },
        { href: '/admin/facilities', label: 'Manage Facilities', description: 'Register and update facilities' },
        { href: '/audit', label: 'View Audit Log', description: 'Review system activity and access records' },
      ];
    default:
      // health_records_officer and any other staff role
      return [
        { href: '/patients/register', label: 'Register New Patient', description: 'Create a new health identity (NUHI) for a patient' },
        { href: '/patients', label: 'Search Patients', description: 'Look up a patient by name, NIN, or NUHI' },
      ];
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user != null && ADMIN_ROLES.includes(user.role);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    api<AnalyticsSummary>('/analytics/summary')
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch(() => { /* stats stay hidden on failure */ });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const actions = actionsForRole(user?.role);

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

      {isAdmin && summary ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Registered Patients"
            value={summary.registrations.total.toLocaleString()}
            color="text-[#075E54]"
          />
          <StatCard
            label="Provisional Registrations"
            value={summary.registrations.provisional.toLocaleString()}
            color={summary.registrations.provisional > 0 ? 'text-amber-600' : 'text-gray-900'}
          />
          <StatCard
            label="Encounters (30 days)"
            value={summary.encounters.total.toLocaleString()}
          />
          <StatCard
            label="Open Encounters"
            value={summary.encounters.open.toLocaleString()}
            color={summary.encounters.open > 0 ? 'text-blue-700' : 'text-gray-900'}
          />
        </div>
      ) : (
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
      )}

      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <QuickAction key={a.href} href={a.href} label={a.label} description={a.description} />
        ))}
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
