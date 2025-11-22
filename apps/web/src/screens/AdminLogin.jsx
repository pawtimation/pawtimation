import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/auth';

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      if (!response.ok) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      const userRole = (data.user.role || '').toUpperCase();
      const isAdmin = data.user.isAdmin === true || userRole === 'ADMIN';
      
      if (!isAdmin) {
        setError('This login page is for administrators only. Please use the appropriate portal.');
        setLoading(false);
        return;
      }

      setSession('ADMIN', {
        token: data.token,
        user: data.user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      window.location.href = '/admin';
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function quickLoginAdmin() {
    setError('');
    setLoading(true);

    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' })
      });

      if (!response.ok) {
        setError('Demo admin login failed');
        setLoading(false);
        return;
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
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'walker1@demo.com', password: 'staff123' })
      });

      if (!response.ok) {
        setError('Demo staff login failed');
        setLoading(false);
        return;
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
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'demo@client.com', password: 'test123' })
      });

      if (!response.ok) {
        setError('Demo client login failed');
        setLoading(false);
        return;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-4xl">🐾</span>
            <h1 className="text-3xl font-bold text-slate-800">Pawtimation</h1>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-800">Sign in</h2>
          <p className="text-sm text-slate-500 mt-1">Access your business dashboard</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              type="email"
              placeholder="admin@demo.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4 mt-6">
          <p className="text-xs text-slate-500 mb-3 text-center">Quick Login (Testing Only)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={quickLoginAdmin}
              className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition text-sm font-medium"
              disabled={loading}
            >
              🐾 Admin
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
        </div>

        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Admin: admin@demo.com / admin123</p>
          <p>Staff (Sarah Walker): walker1@demo.com / staff123</p>
          <p>Client: demo@client.com / test123</p>
        </div>
      </div>
    </div>
  );
}
