import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

function Badge({children}){ return <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">{children}</span>; }

export function SitterPublic({ sitterId='s_demo_companion', onBack }){
  const [s, setS] = useState(null);
  useEffect(()=>{ fetch(`${API_BASE}/sitters/${sitterId}`).then(r=>r.json()).then(j=>setS(j.sitter)); }, [sitterId]);
  if (!s) return <div>Loading…</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">{s.name}</h2>
        <div />
      </div>

      <div className="rounded-2xl overflow-hidden h-48 bg-slate-200" style={{backgroundImage:`url(${s.bannerUrl||''})`, backgroundSize:'cover', backgroundPosition:'center'}} />

      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={s.avatarUrl||'https://placehold.co/96x96'} alt="" className="w-20 h-20 rounded-full object-cover border"/>
          <div className="flex-1">
            <div className="text-2xl font-semibold">{s.name}</div>
            <div className="text-slate-600">• {s.city}</div>
            <div className="text-sm text-amber-600">★ {s.rating} <span className="text-slate-500">({s.reviews})</span></div>
          </div>
          <button className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">Contact</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
        <div className="font-semibold">About</div>
        <p className="text-slate-700">{s.bio}</p>
        <div className="flex gap-2 flex-wrap pt-2">
          <Badge>Experience: {s.yearsExperience}+ yrs</Badge>
          <Badge>{s.verification.pro ? 'Pro verified' : 'Trainee'}</Badge>
          <Badge>{s.verification.email ? 'Email verified' : 'Email pending'}</Badge>
          <Badge>{s.verification.sms ? 'SMS verified' : 'SMS pending'}</Badge>
          <Badge>{s.verification.stripe ? 'Stripe verified' : 'Stripe pending'}</Badge>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <div className="font-semibold mb-3">Services & prices</div>
        <div className="space-y-3">
          {s.services.map(svc=>(
            <div key={svc.key} className="flex items-start justify-between border rounded-xl p-3">
              <div>
                <div className="font-medium">{svc.label}</div>
                <div className="text-sm text-slate-500">{svc.at==='sitter'?'At companion\'s home':'At your home'}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">£{svc.price} / {svc.per}</div>
                {svc.extraPet ? <div className="text-xs text-slate-500">+£{svc.extraPet} / extra pet</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <div className="font-semibold">Cancellation policy</div>
          <div className="text-slate-700">{s.cancellation.copy}</div>
        </div>
        <div>
          <div className="font-semibold mb-1">Availability</div>
          <div className="text-sm text-slate-600">Recently updated calendar • Unavailable: {(s.availability.unavailable||[]).join(', ') || 'none'}</div>
        </div>
      </div>
    </div>
  );
}
