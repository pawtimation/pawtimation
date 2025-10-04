import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export function SitterDashboard({ sitterId='s1', onBack }){
  const [dash, setDash] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/sitters/${sitterId}/dashboard`);
        if (!r.ok) throw new Error(`API ${r.status}`);
        const j = await r.json();
        if (!dead) setDash(j);
      } catch (e) {
        setErr('Cannot load your dashboard. Please check the API connection.');
      }
    })();
    return () => { dead = true; };
  }, [sitterId]);

  if (err) return (
    <div className="p-5 bg-white border rounded-xl">
      <div className="text-rose-600 font-semibold mb-2">Error</div>
      <div className="text-slate-700 text-sm">{err}</div>
      <button className="mt-3 px-3 py-1 bg-slate-800 text-white rounded" onClick={onBack}>← Back</button>
    </div>
  );

  if (!dash) return <div className="p-5 bg-white border rounded-xl">Loading…</div>;

  const { sitter, completion, tasks=[] } = dash;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pet Companion dashboard</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="text-sm text-slate-600">Profile completion</div>
        <div className="mt-1 h-3 bg-slate-200 rounded">
          <div className="h-3 bg-emerald-600 rounded" style={{ width: `${completion||0}%` }} />
        </div>
        {tasks.length>0 && <ul className="list-disc pl-5 text-sm text-slate-700 mt-2">
          {tasks.map((t,i)=><li key={i}>{t}</li>)}
        </ul>}
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h3 className="font-semibold mb-2">Your profile</h3>
        <div className="text-slate-700">
          <div><b>Name:</b> {sitter?.name}</div>
          <div><b>Postcode:</b> {sitter?.postcode}</div>
          <div><b>Rate:</b> £{(sitter?.ratePerDay/100 || 35).toFixed(0)}/day</div>
          <div className="text-sm text-slate-500">Tier: {sitter?.tier} • ⭐ {sitter?.rating} ({sitter?.reviews})</div>
        </div>
      </div>
    </div>
  );
}
