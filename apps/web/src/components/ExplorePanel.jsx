import React, { useEffect, useState } from 'react';

export function ExplorePanel({ onGo }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('explore') === '1') setOpen(true);
  }, []);
  if (!open) {
    return (
      <button className="fixed bottom-4 right-4 px-3 py-2 bg-slate-800 text-white rounded-full shadow hover:bg-slate-900"
              onClick={()=>setOpen(true)}>☰ Explore</button>
    );
  }
  return (
    <div className="fixed bottom-4 right-4 w-72 bg-white border rounded-2xl shadow-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Explore</div>
        <button className="text-sm px-2 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={()=>setOpen(false)}>Close</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('landing')}>Landing</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('ownerStart')}>Owner start</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('companionStart')}>Companion start</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('ownerCircle')}>My Circle</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('ownerPets')}>My pets</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('sitterEdit')}>Edit profile</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('sitterPublic')}>Public profile</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('chat')}>Community chat</button>
        <button className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200" onClick={()=>onGo('join')}>Join invite</button>
      </div>
      <div className="text-xs text-slate-500">Tip: add <code>?explore=1</code> to the URL to auto-open.</div>
    </div>
  );
}
