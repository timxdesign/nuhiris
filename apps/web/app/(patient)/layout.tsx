'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/portal', label: 'My Health ID' },
  { href: '/portal/records', label: 'My Records' },
  { href: '/portal/consents', label: 'Manage Consents' },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-[#075E54]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-white">NUHIRIS Patient Portal</h1>
            <p className="text-xs text-green-200">Your Health, Your Identity</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/login';
            }}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Sign Out
          </button>
        </div>
        <nav className="mx-auto max-w-5xl px-4">
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/portal'
                ? pathname === '/portal'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-gray-50 text-[#075E54]'
                      : 'text-green-200 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
