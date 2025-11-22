import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../lib/auth';
import { API_BASE } from '../config';

export function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function quickLoginAdmin() {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' })
      });

      if (!response.ok) {
        throw new Error('Demo admin login failed');
      }

      const data = await response.json();
      
      setSession('ADMIN', {
        token: data.token,
        user: data.user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      window.location.href = '/admin';
    } catch (err) {
      console.error('Quick login error:', err);
      setError('Quick login failed');
      setLoading(false);
    }
  }

  async function quickLoginStaff() {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'walker1@demo.com', password: 'staff123' })
      });

      if (!response.ok) {
        throw new Error('Demo staff login failed');
      }

      const data = await response.json();
      
      setSession('STAFF', {
        token: data.token,
        user: data.user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      window.location.href = '/staff/today';
    } catch (err) {
      console.error('Quick login error:', err);
      setError('Quick login failed');
      setLoading(false);
    }
  }

  async function quickLoginClient() {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'demo@client.com', password: 'test123' })
      });

      if (!response.ok) {
        throw new Error('Demo client login failed');
      }

      const data = await response.json();
      
      setSession('CLIENT', {
        token: data.token,
        user: data.user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      window.location.href = '/client/home';
    } catch (err) {
      console.error('Quick login error:', err);
      setError('Quick login failed');
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Save super admin session
      setSession('SUPER_ADMIN', {
        token: data.token,
        user: {
          ...data.user,
          isSuperAdmin: true
        }
      });

      navigate('/owner');
    } catch (err) {
      console.error('Owner login error:', err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Super Admin Portal</h1>
            <p className="text-slate-600 mt-2">Platform-wide management access</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Access Portal'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-3 text-center font-medium">Quick Login (Testing Only)</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={quickLoginAdmin}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition text-sm font-medium flex items-center justify-center gap-1"
                disabled={loading}
              >
                <img src="/pawtimation-paw.png" alt="" className="w-4 h-4" />
                Admin
              </button>
              <button
                onClick={quickLoginStaff}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                disabled={loading}
              >
                👤 Staff
              </button>
              <button
                onClick={quickLoginClient}
                className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition text-sm font-medium"
                disabled={loading}
              >
                🐕 Client
              </button>
            </div>
            <div className="text-center text-xs text-slate-500 space-y-1">
              <p>Admin: admin@demo.com / admin123</p>
              <p>Staff (Sarah Walker): walker1@demo.com / staff123</p>
              <p>Client: demo@client.com / test123</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Restricted access • All actions are logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
