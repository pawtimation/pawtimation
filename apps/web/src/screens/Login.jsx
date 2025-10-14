import React, { useState } from 'react';
import { api } from '../lib/auth';

export function Login({ onSuccess, onBack }){
  const [f, setF] = useState({ email:'', password:'' });
  const [err, setErr] = useState('');

  async function submit(e){
    e.preventDefault(); setErr('');
    const r = await api('/auth/login', { method:'POST', body: JSON.stringify(f) });
    const j = await r.json();
    if(!r.ok){ setErr('Incorrect email or password'); return; }
    localStorage.setItem('pt_token', j.token);
    localStorage.setItem('pt_user', JSON.stringify(j.user));
    onSuccess?.(j.user);
  }

  function quickLoginOwner() {
    const demoUser = { id: 'owner_demo', email: 'demo@owner.com', role: 'owner', name: 'Demo Owner' };
    localStorage.setItem('pt_user', JSON.stringify(demoUser));
    localStorage.setItem('pt_token', 'demo_token_owner');
    window.location.href = '/#/owner';
  }

  function quickLoginCompanion() {
    const demoUser = { id: 'u_demo', email: 'demo@companion.com', role: 'companion', name: 'Demo Companion', sitterId: 's_demo_companion' };
    localStorage.setItem('pt_user', JSON.stringify(demoUser));
    localStorage.setItem('pt_token', 'demo_token_companion');
    window.location.href = '/#/companion/checklist';
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>
      {err && <div className="text-rose-600 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input className="border rounded w-full px-3 py-2" placeholder="Email" type="email" value={f.email} onChange={e=>setF({...f, email:e.target.value})}/>
        <input className="border rounded w-full px-3 py-2" placeholder="Password" type="password" value={f.password} onChange={e=>setF({...f, password:e.target.value})}/>
        <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded w-full">Sign in</button>
      </form>

      {/* Quick Login for Testing */}
      <div className="border-t border-slate-200 pt-4 mt-6">
        <p className="text-xs text-slate-500 mb-3 text-center">Quick Login (Testing Only)</p>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={quickLoginOwner}
            className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition text-sm font-medium"
          >
            🐾 Owner
          </button>
          <button 
            onClick={quickLoginCompanion}
            className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition text-sm font-medium"
          >
            🐕 Companion
          </button>
        </div>
      </div>
    </div>
  );
}
