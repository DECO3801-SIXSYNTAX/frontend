import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/UnifiedAuthService';
import { useDashboard } from '../../contexts/DashboardContext';

/**
 * Simple Admin Login Page (no Google OAuth)
 * Based on: https://github.com/DECO3801-SIXSYNTAX/frontend/blob/page/admin/src/pages/auth/Login.tsx
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { setCurrentUser } = useDashboard();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting admin login...');
      console.log('Username:', username);
      
      // Try login with Unified Auth Service
      const user = await authService.login(username, password);
      console.log('✅ Login successful:', user);

      // Check if user is admin
      if (user.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      // Set current user
      setCurrentUser(user);

      console.log('✅ Navigating to admin dashboard...');
      navigate('/admin');
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <form 
        onSubmit={onSubmit} 
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg border border-slate-200"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Login</h1>
          <p className="text-sm text-slate-600">Sign in to access admin panel</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Username or Email
            </span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              type="text"
              required
              placeholder="Enter your username or email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </span>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              required
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to main login
          </button>
        </div>

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600 border border-slate-200">
            <p className="font-semibold mb-1">Test Credentials:</p>
            <p>Username: adminpln</p>
            <p>Email: adminpln@gmail.com</p>
            <p>Password: password123</p>
          </div>
        )}
      </form>
    </div>
  );
}
