import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSession } from '../../lib/auth';

export default function StaffLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const response = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    const data = await response.json();

    if (!response.ok) {
      setError('Incorrect email or password');
      return;
    }

    const userRole = (data.user.role || '').toUpperCase();
    const isStaff = userRole === 'STAFF';
    
    if (!isStaff) {
      setError('This login page is for staff only. Please use the appropriate portal.');
      return;
    }

    setSession('STAFF', {
      token: data.token,
      user: data.user,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    navigate('/staff');
  }

  async function quickLoginStaff() {
    setError('');

    try {
      const response = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'walker1@demo.com', password: 'staff123' })
      });

      if (!response.ok) {
        setError('Demo staff login failed');
        return;
      }

      const data = await response.json();
      
      setSession('STAFF', {
        token: data.token,
        user: data.user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
      
      navigate('/staff');
    } catch (err) {
      console.error(err);
      setError('Demo staff login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-3xl">🐾</span>
            <h1 className="text-2xl font-bold text-slate-800">Pawtimation</h1>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800">Staff Sign In</h2>
          <p className="text-sm text-slate-500 mt-1">Access your staff dashboard</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              type="email"
              placeholder="staff@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition font-medium"
          >
            Sign In
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-500 mb-3 text-center">Quick Login (Testing Only)</p>
          <button
            onClick={quickLoginStaff}
            className="w-full px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-sm font-medium"
          >
            🐕 Demo Staff
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
