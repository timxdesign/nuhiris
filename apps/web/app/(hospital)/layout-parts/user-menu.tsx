'use client';

import { useAuth } from '../../../hooks/use-auth';

export function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <div className="border-t border-gray-200 p-4">
      {user && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">{user.username}</p>
          <p className="text-xs capitalize text-gray-500">{user.role.replace(/_/g, ' ')}</p>
          {user.facilityId && (
            <p className="mt-0.5 text-xs text-gray-400">Facility assigned</p>
          )}
        </div>
      )}
      <button
        onClick={() => {
          logout();
          window.location.href = '/login';
        }}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        Sign out
      </button>
    </div>
  );
}
