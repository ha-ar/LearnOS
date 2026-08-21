import { User } from './types';

export const API_ROOT = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000';

export function getToken(): string | null {
  return localStorage.getItem('learnos_admin_token');
}
export function setToken(t: string) {
  localStorage.setItem('learnos_admin_token', t);
}
export function clearToken() {
  localStorage.removeItem('learnos_admin_token');
  localStorage.removeItem('learnos_admin_user');
}
export function isLoggedIn(): boolean {
  return !!getToken();
}

export class AuthApi {
  static async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_ROOT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }
    const user: User = data.user;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new Error('This account does not have admin access.');
    }
    setToken(data.access_token);
    localStorage.setItem('learnos_admin_user', JSON.stringify(user));
    return user;
  }

  static logout() {
    clearToken();
  }
}
