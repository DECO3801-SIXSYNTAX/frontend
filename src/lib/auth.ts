export const AUTH_TOKEN_KEY = 'authAccessToken';
export const AUTH_REFRESH_KEY = 'authRefreshToken';
export const AUTH_ENABLED = String(import.meta.env.VITE_AUTH_ENABLED || 'false') === 'true';
export const AUTH_LOGIN_PATH = String(import.meta.env.VITE_AUTH_LOGIN_PATH || '/api/auth/token/');
export const AUTH_REFRESH_PATH = String(import.meta.env.VITE_AUTH_REFRESH_PATH || '/api/auth/token/refresh/');

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(AUTH_TOKEN_KEY);
    else localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(AUTH_REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(AUTH_REFRESH_KEY);
    else localStorage.setItem(AUTH_REFRESH_KEY, token);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

type JwtClaims = Record<string, any>;

function parseJwt(token: string): JwtClaims | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  } catch {
    try {
      // Fallback: plain base64 decode
      const [, payload] = token.split('.');
      if (!payload) return null;
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

export function getClaims(): JwtClaims | null {
  const t = getAuthToken();
  if (!t) return null;
  return parseJwt(t);
}

export function isAdmin(): boolean {
  const c = getClaims();
  if (!c) return false;
  // common JWT keys from Django/DRF setups
  if (c.is_superuser === true || c.is_staff === true) return true;
  const role = (c.role || c.user_role || c['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
  if (typeof role === 'string' && role.toLowerCase() === 'admin') return true;
  const roles = c.roles || c.groups || c.permissions;
  if (Array.isArray(roles) && roles.map((r: any)=>String(r).toLowerCase()).includes('admin')) return true;
  return false;
}

export function signOut() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REFRESH_KEY);
  } catch {
    // ignore
  }
}
