// Authentication utilities

export interface AuthUser {
  username: string;
  role: 'presenter' | 'viewer' | string;
  token?: string;
  authenticated: boolean;
}

const AUTH_KEY = 'audri_auth';

export function getAuth(): AuthUser | null {
  try {
    const authStr = localStorage.getItem(AUTH_KEY);
    if (!authStr) return null;
    return JSON.parse(authStr);
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  const auth = getAuth();
  return Boolean(auth?.authenticated && auth?.token);
}

export function getUsername(): string | null {
  const auth = getAuth();
  return auth?.username || null;
}

export function getRole(): string | null {
  const auth = getAuth();
  return auth?.role || null;
}

export function isPresenter(): boolean {
  return getRole() === 'presenter';
}

export function isViewer(): boolean {
  return isAuthenticated() && getRole() !== 'presenter';
}

export function canMutate(): boolean {
  return isPresenter();
}

export function getToken(): string | null {
  const auth = getAuth();
  return auth?.token || null;
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
