import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/auth';

export function Register({ onSuccess, onBack }){
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const isCompanion = role === 'companion';
  
  const [f, setF] = useState({ 
    name:'', 
    email:'', 
    password:'',
    mobile: '',
    location: 'Beaconsfield'
  });
  const [err, setErr] = useState('');

  async function submit(e){
    e.preventDefault(); setErr('');
    const payload = { ...f };
    if (isCompanion) {
      payload.role = 'companion';
    }
    const r = await api('/auth/register', { method:'POST', body: JSON.stringify(payload) });
    const j = await r.json();
    if(!r.ok){ setErr(j?.error || 'Could not register'); return; }
    localStorage.setItem('pt_token', j.token);
    localStorage.setItem('pt_user', JSON.stringify(j.user));
    onSuccess?.(j.user);
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isCompanion ? 'Create Companion Account' : 'Create your account'}
        </h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>
      {isCompanion && (
        <div className="bg-teal-50 border border-teal-200 rounded p-3 text-sm text-teal-800">
          Join Beaconsfield's pet care community in just a few steps
        </div>
      )}
      {err && <div className="text-rose-600 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input 
          className="border rounded w-full px-3 py-2" 
          placeholder="Full name" 
          value={f.name} 
          onChange={e=>setF({...f, name:e.target.value})}
          required
        />
        <input 
          className="border rounded w-full px-3 py-2" 
          placeholder="Email" 
          type="email" 
          value={f.email} 
          onChange={e=>setF({...f, email:e.target.value})}
          required
        />
        <input 
          className="border rounded w-full px-3 py-2" 
          placeholder="Password" 
          type="password" 
          value={f.password} 
          onChange={e=>setF({...f, password:e.target.value})}
          required
        />
        {isCompanion && (
          <>
            <input 
              className="border rounded w-full px-3 py-2" 
              placeholder="Mobile (optional)" 
              type="tel"
              value={f.mobile} 
              onChange={e=>setF({...f, mobile:e.target.value})}
            />
            <input 
              className="border rounded w-full px-3 py-2" 
              placeholder="Location" 
              value={f.location} 
              onChange={e=>setF({...f, location:e.target.value})}
            />
          </>
        )}
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded w-full hover:bg-emerald-700">
          Create account
        </button>
      </form>
      <div className="text-sm text-slate-600">By continuing you agree to the Pawtimation Terms.</div>
    </div>
  );
}
