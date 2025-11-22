import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession, adminApi } from '../lib/auth';

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
      const response = await adminApi('/auth/login', {
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
      </div>
    </div>
  );
}
