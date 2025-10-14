import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import MonthCalendar from '../components/MonthCalendar.jsx';
import { ImageUpload } from '../components/ImageUpload.jsx';
import { Page } from '../ui/layout';
import PageHeader from '../ui/PageHeader';

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
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  async function load(){
    try {
      const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
      setS(a.sitter);
      const so = await fetch(`${API_BASE}/sitters/${id}/social`).then(r=>r.json());
      setSocial(so.social||{});
    } catch (err) {
      console.error('Failed to load sitter:', err);
      setS({ id, name: 'Error', city: '', bio: 'Failed to load', services: [], avatarUrl: '', bannerUrl: '', yearsExperience: 0, availability: { unavailable: [] } });
    }
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
    <Page>
      <PageHeader
        title="Edit Companion Profile"
        backTo={onBack ? undefined : "/companion"}
        onBack={onBack}
        action={
          <button className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500" onClick={()=>onPreview?.(id)}>
            Preview
          </button>
        }
      />

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-sm">Display name</label>
            <input className="border rounded w-full px-3 py-2" value={s.name} onChange={e=>setS({...s, name:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm">City / Area</label>
            <input className="border rounded w-full px-3 py-2" value={s.city} onChange={e=>setS({...s, city:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm">Postcode</label>
            <input className="border rounded w-full px-3 py-2" value={s.postcode||''} onChange={e=>setS({...s, postcode:e.target.value})}/>
          </div>
        </div>

        <div>
          <label className="text-sm">Bio</label>
          <textarea className="border rounded w-full px-3 py-2" rows={4} value={s.bio} onChange={e=>setS({...s, bio:e.target.value})}/>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Profile Picture</label>
            <ImageUpload 
              currentImageUrl={s.avatarUrl}
              onImageUploaded={(url) => setS({...s, avatarUrl: url})}
              label="Upload Avatar"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Banner Image</label>
            <ImageUpload 
              currentImageUrl={s.bannerUrl}
              onImageUploaded={(url) => setS({...s, bannerUrl: url})}
              label="Upload Banner"
            />
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

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded bg-emerald-600 text-white" disabled={saving} onClick={()=>save()}>Save changes</button>
          <button className="px-4 py-2 rounded bg-slate-200" onClick={load}>Reset</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
        <div className="font-semibold">Locality map</div>
        <div className="text-sm text-slate-600">
          Based on your <strong>Postcode</strong> or <strong>City</strong>. This is a simple embed for preview;
          exact address is never shown to owners.
        </div>
        <div className="rounded-xl overflow-hidden border" style={{height: '280px'}}>
          <iframe
            title="map"
            width="100%" height="100%" style={{border:0}}
            src={`https://www.google.com/maps?q=${encodeURIComponent((s.postcode||s.city||'Aylesbury'))}&output=embed`}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          />
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
    </Page>
  );
}
