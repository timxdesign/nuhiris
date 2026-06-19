'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';

export function useAuth({ requireAuth = true } = {}) {
  const { user, isAuthenticated, hydrate, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (requireAuth && !isAuthenticated && typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
      }
    }
  }, [requireAuth, isAuthenticated, router]);

  return { user, isAuthenticated, logout };
}
