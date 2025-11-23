import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession, staffApi } from '../../lib/auth';

export default function StaffLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const response = await staffApi('/auth/login', {
      method: 'POST',
      body: form
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        {/* Logo and Branding - Larger for mobile */}
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <img src="/pawtimation-paw.png" alt="Pawtimation paw logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Pawtimation</h1>
          </div>
        </div>

        {/* Title - Larger for mobile readability */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800">Staff Sign In</h2>
          <p className="text-base sm:text-lg text-slate-500 mt-2">Access your staff dashboard</p>
        </div>

        {/* Error Message - More visible on mobile */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 px-4 py-4 rounded-lg text-base font-medium">
            {error}
          </div>
        )}

        {/* Form - Optimized for mobile touch */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-base sm:text-lg font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              className="w-full px-4 py-4 text-base sm:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              type="email"
              placeholder="your.email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <label className="block text-base sm:text-lg font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              className="w-full px-4 py-4 text-base sm:text-lg border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          {/* Large, easy-to-tap button */}
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-4 px-6 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition font-semibold text-lg sm:text-xl shadow-md"
          >
            Sign In
          </button>
        </form>

        {/* Back link - Larger touch target */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-base sm:text-lg text-slate-500 hover:text-slate-700 py-2 px-4"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
