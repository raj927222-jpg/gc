export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

const ADMIN_TOKEN_KEY = 'gc_admin_jwt_token';
const ADMIN_USER_KEY = 'gc_admin_user_data';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save admin token:', e);
  }
}

export function getAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminUser(user: AdminUser): void {
  try {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save admin user data:', e);
  }
}

export function removeAdminSession(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch (e) {
    console.error('Failed to clear admin session:', e);
  }
}

export async function adminLogin(
  identifier: string,
  pass: string
): Promise<{ success: boolean; message?: string; user?: AdminUser }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password: pass }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.token && data.user) {
      setAdminToken(data.token);
      setAdminUser(data.user);
      return { success: true, user: data.user };
    }

    return {
      success: false,
      message: data.message || 'Invalid administrator credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Server connection failed during login.',
    };
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/admin/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        setAdminUser(data.user);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Admin Auth] Session verification error:', err);
  }

  // Token is expired or invalid
  removeAdminSession();
  return false;
}

export async function adminFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    removeAdminSession();
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      window.location.href = '/admin/login';
    }
  }

  return res;
}
