// Authentication utilities

export interface AuthUser {
  username: string;
  role: string;
  authenticated: boolean;
}

const AUTH_KEY = 'glif_auth';

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
  return auth?.authenticated === true;
}

export function getUsername(): string | null {
  const auth = getAuth();
  return auth?.username || null;
}

