const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  if (!headers.has('Content-Type') && fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    let token = getAccessToken();
    if (!token) {
      token = await refreshToken();
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      const retry = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
      if (retry.ok) {
        return ((await retry.json()) as { data: T }).data;
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { message?: string }).message ?? 'Request failed', body);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as { data: T };
  return json.data;
}
