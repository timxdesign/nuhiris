'use client';

import { type ReactNode } from 'react';
import { SidebarNav } from './layout-parts/sidebar-nav';
import { UserMenu } from './layout-parts/user-menu';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-[#075E54]">NUHIRIS</h2>
          <p className="text-xs text-gray-500">National Health Identity &amp; Records</p>
        </div>

        <SidebarNav />
        <UserMenu />
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
