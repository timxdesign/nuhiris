'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/use-auth';
import { type ReactNode } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/patients/register', label: 'Register Patient' },
];

export default function HospitalLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-[#075E54]">NUHIRIS</h2>
          <p className="text-xs text-gray-500">Health Records System</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-[#E8F5E9] text-[#1B5E20]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4">
          {user && (
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">{user.role.replace(/_/g, ' ')}</p>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
