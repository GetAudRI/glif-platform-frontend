import { API_BASE } from '../config';
import { authHeaders, canMutate } from './auth';

export { API_BASE };

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
}

function viewerBlockedResponse(): Response {
  return new Response(
    JSON.stringify({ success: false, error: 'Demo account is view-only' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const isAuth = path.includes('/api/auth/');
  if (!isAuth && !['GET', 'HEAD'].includes(method) && !canMutate()) {
    return viewerBlockedResponse();
  }
  const headers = new Headers(init.headers);
  Object.entries(authHeaders()).forEach(([key, value]) => {
    if (!headers.has(key)) headers.set(key, value);
  });
  return fetch(apiUrl(path), { ...init, headers });
}
