import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

function getSitterId(){
  try {
    const u = JSON.parse(localStorage.getItem('pt_user')||'{}');
    return u.sitterId || 's_demo_companion';
  } catch { return 's_demo_companion'; }
}

export function SitterEdit({ sitterId, onBack, onPreview }){
  const id = sitterId || getSitterId();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [social, setSocial] = useState({});

  async function load(){
    const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
    setS(a.sitter);
    const so = await fetch(`${API_BASE}/sitters/${id}/social`).then(r=>r.json());
    setSocial(so.social||{});
  }
  useEffect(()=>{ load(); }, [id]);

  async function save(partial){
    setSaving(true);
    await fetch(`${API_BASE}/sitters/${id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(partial || s) });
    setSaving(false);
    await load();
  }
  async function updateSocial(network, fields){
    await fetch(`${API_BASE}/sitters/${id}/social`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ network, ...fields }) });
    await load();
  }

  if (!s) return <div>Loading…</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">Edit Companion profile</h2>
        <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={()=>onPreview?.(id)}>Preview</button>
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
            <input className="border rounded w-full px-3 py-2" value={s.avatarUrl} onChange={e=>setS({...s, avatarUrl:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm">Banner image URL</label>
            <input className="border rounded w-full px-3 py-2" value={s.bannerUrl} onChange={e=>setS({...s, bannerUrl:e.target.value})}/>
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
                  <option value="sitter">At companion's home</option>
                  <option value="owner">At owner's home</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-medium mb-1">Availability: unavailable dates</div>
          <input className="border rounded w-full px-3 py-2"
            placeholder="2025-10-21, 2025-12-25"
            value={(s.availability.unavailable||[]).join(', ')}
            onChange={e=>setS({...s, availability:{...s.availability, unavailable:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)}})}
          />
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={saving} onClick={()=>save()}>Save changes</button>
          <button className="px-4 py-2 rounded bg-slate-200" onClick={load}>Reset</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="font-semibold">Social & auto-posting</div>
        {['instagram','tiktok','x'].map(net=>{
          const row = social[net] || { handle:'', connected:false, autoPost:false };
          return (
            <div key={net} className="grid md:grid-cols-4 gap-2 items-center">
              <div className="font-medium capitalize">{net}</div>
              <input className="border rounded px-3 py-2" placeholder="@handle" value={row.handle}
                     onChange={e=>updateSocial(net,{ handle:e.target.value, connected:row.connected, autoPost:row.autoPost })}/>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={row.connected}
                       onChange={e=>updateSocial(net,{ handle:row.handle, connected:e.target.checked, autoPost:row.autoPost })}/>
                Connected
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={row.autoPost}
                       onChange={e=>updateSocial(net,{ handle:row.handle, connected:row.connected, autoPost:e.target.checked })}/>
                Auto-post diary highlights
              </label>
            </div>
          );
        })}
        <div className="text-sm text-slate-500">
          Note: live posting will require OAuth apps; this stub just stores your preferences for now.
        </div>
      </div>
    </div>
  );
}
