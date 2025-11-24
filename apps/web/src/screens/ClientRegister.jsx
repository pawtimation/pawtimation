import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as clientsApi from '../lib/clientsApi';
import { API_BASE } from '../config';
import { setSession } from '../lib/auth';

export function ClientRegister() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);

  const inviteToken = params.get('invite') || '';

  useEffect(() => {
    if (inviteToken) {
      validateInvite();
    }
  }, [inviteToken]);

  async function validateInvite() {
    setInviteLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/clients/invite/${inviteToken}/validate`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.message || errData.error || 'This invitation link is invalid or has expired.');
        setInviteLoading(false);
        return;
      }

      const data = await res.json();
      setInviteData(data);
      setForm(prev => ({
        ...prev,
        email: data.email,
        name: data.clientName || ''
      }));
    } catch (err) {
      console.error('Invitation validation error:', err);
      setError('Failed to validate invitation. Please try again.');
    }
    setInviteLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const businessId = params.get('biz') || inviteData?.businessId || '';

    if (!businessId && !inviteToken) {
      setError('This signup link is missing a business. Ask your service provider for a new link.');
      setLoading(false);
      return;
    }

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        businessId,
        name: form.name || form.email,
        email: form.email.trim(),
        password: form.password,
        inviteToken: inviteToken || null
      };

      console.log('[ClientRegister] Submitting registration:', { ...payload, password: '***' });

      const client = await clientsApi.registerClientUser(payload);

      console.log('[ClientRegister] Registration successful, logging in...');

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSession('CLIENT', {
          token: data.token,
          user: data.user,
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        window.location.href = '/client/home';
      } else {
        navigate('/client/login');
      }
    } catch (err) {
      console.error('[ClientRegister] Registration error:', err);
      
      // Try to parse JSON error message
      let errorMessage = 'Something went wrong. Please try again.';
      try {
        const errorObj = JSON.parse(err.message);
        errorMessage = errorObj.error || errorObj.message || errorMessage;
      } catch (e) {
        // If not JSON, use the message as-is
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-sm text-slate-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <img src="/pawtimation-paw.png" alt="Pawtimation paw logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-slate-800">Pawtimation</h1>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800">Create Your Account</h2>
          <p className="text-sm text-slate-500 mt-1">
            {inviteToken ? 'Complete your registration to access your client portal' : 'Access your pet owner dashboard'}
          </p>
        </div>

        {inviteData && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-md text-sm">
            <p className="font-medium">You've been invited by {inviteData.businessName}</p>
          </div>
        )}

        {!inviteData && !params.get('biz') && !inviteToken && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
            This link is not attached to a specific business. Please use the invitation link provided by your service provider.
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="John Smith"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              required
              disabled={inviteToken && inviteData}
            />
            {inviteToken && inviteData && (
              <p className="text-xs text-slate-500 mt-1">
                Email address locked from invitation
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="Re-enter your password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!businessId && !inviteToken)}
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to={`/client/login${businessId ? `?biz=${businessId}` : ''}`}
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Sign in
            </Link>
          </p>
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
