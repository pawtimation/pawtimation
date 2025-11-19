import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../config';

export function ClientLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const businessId = params.get('biz') || '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      // Use main auth API instead of client-specific login
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password
        })
      });

      if (!response.ok) {
        setError('Invalid details. Please check your email and password.');
        return;
      }

      const data = await response.json();
      
      // Store user and token in localStorage
      localStorage.setItem('pt_user', JSON.stringify(data.user));
      localStorage.setItem('pt_token', data.token);

      // For client users, also store pt_client for ClientGuard
      if (data.user.role === 'client' && data.user.crmClientId) {
        localStorage.setItem('pt_client', JSON.stringify({ clientId: data.user.crmClientId }));
      }

      console.log('Login successful, user:', data.user);

      // Redirect based on user role - force full page reload
      if (data.user.isAdmin) {
        window.location.href = '/admin';
      } else if (data.user.role === 'client') {
        window.location.href = '/client/dashboard';
      } else {
        window.location.href = '/admin'; // Default to admin dashboard
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Client login</h1>
      {!businessId && (
        <p className="text-sm text-amber-600">
          No business specified. This page is usually opened from a business&apos;s invite link.
        </p>
      )}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn btn-primary text-sm w-full" type="submit">
          Log in
        </button>
      </form>

      <p className="text-xs text-slate-600">
        New here?{' '}
        <Link
          to={`/client/register${businessId ? `?biz=${businessId}` : ''}`}
          className="text-brand-blue"
        >
          Create an account
        </Link>
        .
      </p>
    </div>
  );
}
