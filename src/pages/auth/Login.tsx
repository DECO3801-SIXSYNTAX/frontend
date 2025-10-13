import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/lib/api';
import { setAuthToken, setRefreshToken, AUTH_LOGIN_PATH } from '@/lib/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Adjust endpoint to backend JWT: typically /api/auth/token/
      const url = (() => {
        if (AUTH_LOGIN_PATH.startsWith('http')) return AUTH_LOGIN_PATH;
        const base = new URL(API_BASE);
        if (AUTH_LOGIN_PATH.startsWith('/')) {
          return `${base.origin}${AUTH_LOGIN_PATH}`;
        }
        const left = API_BASE.replace(/\/$/, '/');
        return `${left}${AUTH_LOGIN_PATH}`;
      })();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Login failed');
      // SimpleJWT returns { access, refresh }
      const token = data.token || data.access;
      if (!token) throw new Error('Token missing in response');
      setAuthToken(token);
      if (data.refresh) setRefreshToken(data.refresh);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow border border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Superadmin Login</h1>
        {error && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <label className="block mb-3">
          <span className="block text-sm text-slate-700 mb-1">Username</span>
          <input value={username} onChange={e=>setUsername(e.target.value)} type="text" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm"/>
        </label>
        <label className="block mb-4">
          <span className="block text-sm text-slate-700 mb-1">Password</span>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required className="w-full rounded border border-slate-300 px-3 py-2 text-sm"/>
        </label>
        <button disabled={loading} className="w-full rounded bg-blue-600 py-2 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
