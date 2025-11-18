import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

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

  const businessId = params.get('biz') || '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!businessId) {
      setError('This signup link is missing a business. Ask your walker for a new link.');
      return;
    }

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const client = await repo.registerClientUser({
        businessId,
        name: form.name || form.email,
        email: form.email.trim(),
        password: form.password
      });

      localStorage.setItem(
        'pt_client',
        JSON.stringify({ clientId: client.id, businessId })
      );

      navigate('/client/dashboard');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Create client account</h1>
      {!businessId && (
        <p className="text-sm text-amber-600">
          This link is not attached to a specific business. Normally you&apos;d scan
          a QR code or use a link shared by your dog walker.
        </p>
      )}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Your name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
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
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="password"
          placeholder="Confirm password"
          value={form.confirm}
          onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="btn btn-primary text-sm w-full" type="submit">
          Create account
        </button>
      </form>

      <p className="text-xs text-slate-600">
        Already have an account?{' '}
        <Link
          to={`/client/login${businessId ? `?biz=${businessId}` : ''}`}
          className="text-brand-blue"
        >
          Log in
        </Link>
        .
      </p>
    </div>
  );
}
