import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function OwnerCircle({ ownerId='owner_demo', onBack, onChat }) {
  const [circle, setCircle] = useState([]);
  const [f, setF] = useState({ name:'', email:'' });
  const [link, setLink] = useState('');

  async function load(){
    const r = await fetch(`${API_BASE}/owners/${ownerId}/circle`);
    const j = await r.json();
    setCircle(j.circle || []);
  }
  useEffect(()=>{ load(); }, [ownerId]);

  async function invite(){
    const r = await fetch(`${API_BASE}/owners/${ownerId}/invite`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(f)
    });
    const j = await r.json();
    if(r.ok){ setLink(`${location.origin}${j.joinUrl}`); await load(); }
  }

  async function setPreferred(id, value){
    await fetch(`${API_BASE}/owners/${ownerId}/circle/${id}/preferred`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ isPreferred: value })
    });
    await load();
  }

  async function removeFriend(id){
    await fetch(`${API_BASE}/owners/${ownerId}/circle/${id}`, { method:'DELETE' });
    await load();
  }

  function copyLink(){
    if(!link) return;
    navigator.clipboard?.writeText(link);
    alert('Invite link copied.');
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Circle</h2>
        <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>← Back</button>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-semibold">Invite a friend</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Name (optional)" value={f.name} onChange={e=>setF({...f, name:e.target.value})}/>
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Email" value={f.email} onChange={e=>setF({...f, email:e.target.value})}/>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={invite}>Send invite</button>
          {link && <button className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={copyLink}>Copy invite link</button>}
        </div>
        {link && <div className="text-xs text-slate-500 break-all">{link}</div>}
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold mb-2">Your roster</h3>
        {circle.length === 0 && <div className="text-slate-500">No friends yet.</div>}
        <div className="divide-y">
          {circle.map(fr => (
            <div key={fr.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{fr.name}</div>
                <div className="text-xs text-slate-500">{fr.email} • {fr.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm flex items-center gap-1">
                  <input type="checkbox" checked={!!fr.isPreferred} onChange={e=>setPreferred(fr.id, e.target.checked)} />
                  Preferred
                </label>
                <button className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300" onClick={()=>onChat?.(fr)}>Message</button>
                <button className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700" onClick={()=>removeFriend(fr.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
