import React, { useState } from 'react';
import { API_BASE } from '../config';

export function JoinInvite({ onBack, onOpenChat }) {
  const params = new URLSearchParams(location.search);
  const token = params.get('token') || '';
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [ownerId, setOwnerId] = useState('');
  const [friendId, setFriendId] = useState('');
  const [err, setErr] = useState('');

  async function accept(){
    setErr(''); setStatus('idle');
    const r = await fetch(`${API_BASE}/owners/accept`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ token, name })
    });
    const j = await r.json();
    if (!r.ok || j.error){ setErr('Invalid or expired invite link.'); return; }
    setOwnerId(j.ownerId); setFriendId(j.friendId || '');
    setStatus('ok');
  }

  const canChat = status==='ok' && ownerId && friendId;

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Join your friend on Pawtimation</h2>
        <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>← Back</button>
      </div>

      {!token && <div className="p-4 bg-rose-50 border border-rose-200 rounded">No invite token found.</div>}

      {status !== 'ok' && token && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-slate-700">Enter your name and confirm to join their circle.</p>
          <input className="border rounded px-3 py-2 w-full" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={accept}>Accept invite</button>
          </div>
          {err && <div className="text-rose-600 text-sm">{err}</div>}
        </div>
      )}

      {status==='ok' && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="text-emerald-700 font-medium">You're connected! 🎉</div>
          <p className="text-slate-700">You've joined your friend's circle.</p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>Done</button>
            <button disabled={!canChat}
              className={`px-4 py-2 rounded ${canChat?'bg-slate-800 text-white hover:bg-slate-900':'bg-slate-200'}`}
              onClick={()=>onOpenChat?.({ ownerId, friendId })}>
              Open private chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
