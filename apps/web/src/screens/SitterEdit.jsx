import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export function SitterEdit({ sitterId='s_demo_companion', onBack, onPreview }){
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load(){
    const r = await fetch(`${API_BASE}/sitters/${sitterId}`); const j = await r.json(); setS(j.sitter);
  }
  useEffect(()=>{ load(); }, [sitterId]);

  async function save(partial){
    setSaving(true);
    const r = await fetch(`${API_BASE}/sitters/${sitterId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(partial || s) });
    await r.json(); setSaving(false); await load();
  }

  if (!s) return <div>Loading…</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">Edit Companion profile</h2>
        <button className="px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-900" onClick={()=>onPreview?.(sitterId)}>Preview</button>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Display name</label>
            <input className="border rounded w-full px-3 py-2" value={s.name} onChange={e=>setS({...s, name:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm">City / Area</label>
            <input className="border rounded w-full px-3 py-2" value={s.city} onChange={e=>setS({...s, city:e.target.value})}/>
          </div>
        </div>

        <div>
          <label className="text-sm">Bio</label>
          <textarea className="border rounded w-full px-3 py-2" rows={4} value={s.bio} onChange={e=>setS({...s, bio:e.target.value})}/>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Avatar image URL</label>
            <input className="border rounded w-full px-3 py-2" placeholder="https://…" value={s.avatarUrl} onChange={e=>setS({...s, avatarUrl:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm">Banner image URL</label>
            <input className="border rounded w-full px-3 py-2" placeholder="https://…" value={s.bannerUrl} onChange={e=>setS({...s, bannerUrl:e.target.value})}/>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Years of experience</label>
            <input type="number" min="0" className="border rounded w-full px-3 py-2" value={s.yearsExperience} onChange={e=>setS({...s, yearsExperience: Number(e.target.value)})}/>
          </div>
          <div>
            <label className="text-sm">Accept puppies</label>
            <select className="border rounded w-full px-3 py-2" value={s.canAccept.puppies?'yes':'no'} onChange={e=>setS({...s, canAccept:{...s.canAccept, puppies: e.target.value==='yes'}})}>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Dog sizes</label>
            <input className="border rounded w-full px-3 py-2" value={s.canAccept.sizes} onChange={e=>setS({...s, canAccept:{...s.canAccept, sizes:e.target.value}})}/>
          </div>
        </div>

        <div>
          <div className="font-medium mb-1">Services</div>
          <div className="space-y-2">
            {s.services.map((svc, i)=>(
              <div key={svc.key} className="grid md:grid-cols-4 gap-2 items-center">
                <input className="border rounded px-3 py-2 md:col-span-2" value={svc.label} onChange={e=>{
                  const arr=[...s.services]; arr[i]={...svc,label:e.target.value}; setS({...s, services:arr});
                }}/>
                <input type="number" className="border rounded px-3 py-2" value={svc.price} onChange={e=>{
                  const arr=[...s.services]; arr[i]={...svc,price:Number(e.target.value)}; setS({...s, services:arr});
                }}/>
                <select className="border rounded px-3 py-2" value={svc.at} onChange={e=>{
                  const arr=[...s.services]; arr[i]={...svc, at:e.target.value}; setS({...s, services:arr});
                }}>
                  <option value="sitter">At sitter's home</option>
                  <option value="owner">At owner's home</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-medium mb-1">Availability (unavailable dates, comma-separated)</div>
          <input className="border rounded w-full px-3 py-2"
                 placeholder="2025-10-21, 2025-12-25"
                 value={(s.availability.unavailable||[]).join(', ')}
                 onChange={e=>setS({...s, availability:{ ...s.availability, unavailable: e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}})}
          />
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700" disabled={saving} onClick={()=>save()}>Save changes</button>
          <button className="px-4 py-2 rounded bg-slate-200 hover:bg-slate-300" onClick={load}>Reset</button>
        </div>
      </div>
    </div>
  );
}
