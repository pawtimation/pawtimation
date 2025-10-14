import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Page } from '../ui/layout';
import PageHeader from '../ui/PageHeader';

function getSitterId(){
  try { const u = JSON.parse(localStorage.getItem('pt_user')||'{}'); return u.sitterId || 's_demo_companion'; }
  catch { return 's_demo_companion'; }
}
const Badge = ({children}) => <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">{children}</span>;

export function SitterPublic({ sitterId, onBack }){
  const id = sitterId || getSitterId();
  const [s, setS] = useState(null);
  const [social, setSocial] = useState({});
  useEffect(()=>{
    (async ()=>{
      try {
        const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
        setS(a.sitter);
        const so = await fetch(`${API_BASE}/sitters/${id}/social`).then(r=>r.json());
        setSocial(so.social||{});
      } catch (err) {
        console.error('Failed to load public sitter:', err);
        setS({ id, name: 'Error', city: '', bio: 'Failed to load', services: [], rating: 0, reviews: 0, avatarUrl: '', bannerUrl: '', cancellation: { copy: '' }, availability: { unavailable: [] } });
      }
    })();
  },[id]);
  if (!s) return <div>Loading…</div>;

  return (
    <Page>
      <PageHeader
        title={s.name}
        backTo={onBack ? undefined : "/companion"}
        onBack={onBack}
        heroUrl={s.bannerUrl || '/hero-dog-ball.jpg'}
      />

      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={s.avatarUrl||'https://placehold.co/96x96'} alt="" className="w-20 h-20 rounded-full object-cover border"/>
          <div className="flex-1">
            <div className="text-2xl font-semibold">{s.name}</div>
            <div className="text-slate-600">• {s.city}{s.postcode ? ` (${s.postcode})` : ''}</div>
            <div className="text-sm text-amber-600">★ {s.rating} <span className="text-slate-500">({s.reviews})</span></div>
            <div className="flex gap-2 flex-wrap mt-1">
              {Object.entries(social).map(([net, v])=>(
                <Badge key={net}>{net}: {v.handle || 'not set'} {v.connected ? '✓' : ''} {v.autoPost ? '• auto' : ''}</Badge>
              ))}
            </div>
          </div>
          <button className="px-4 py-2 rounded bg-emerald-600 text-white">Contact</button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-2">
        <div className="font-semibold">About</div>
        <p className="text-slate-700">{s.bio}</p>
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
          <div className="text-sm text-slate-600">Unavailable: {(s.availability.unavailable||[]).join(', ') || 'none'}</div>
        </div>
      </div>
    </Page>
  );
}
