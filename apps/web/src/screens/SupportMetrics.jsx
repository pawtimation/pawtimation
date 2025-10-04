import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export function SupportMetrics({ onBack }){
  const [m, setM] = useState(null);
  async function load(){ const r = await fetch(`${API_BASE}/support/metrics`); const j = await r.json(); setM(j); }
  useEffect(()=>{ load(); }, []);
  if (!m) return <div className="p-4">Loading…</div>;
  return (
    <div className="p-4 space-y-4 max-w-xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">Support metrics</h2>
        <div />
      </div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 border rounded"><div className="text-slate-500">Total chats</div><div className="text-xl font-semibold">{m.totalChats}</div></div>
          <div className="p-3 border rounded"><div className="text-slate-500">Handled by bot</div><div className="text-xl font-semibold">{m.handledByBot}</div></div>
          <div className="p-3 border rounded"><div className="text-slate-500">Escalated</div><div className="text-xl font-semibold">{m.escalated}</div></div>
          <div className="p-3 border rounded"><div className="text-slate-500">Paw up</div><div className="text-xl font-semibold">{m.csatUp}</div></div>
          <div className="p-3 border rounded"><div className="text-slate-500">Paw down</div><div className="text-xl font-semibold">{m.csatDown}</div></div>
        </div>
      </div>
      <div className="text-xs text-slate-500">Note: metrics reset on server restart (in-memory store).</div>
    </div>
  );
}
