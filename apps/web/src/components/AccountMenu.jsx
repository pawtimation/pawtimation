import React, { useState } from 'react';
import { auth } from '../lib/auth';
export function AccountMenu({ onSignIn, onRegister, onDashboard, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button className="px-3 py-1 rounded bg-slate-100" onClick={()=>setOpen(!open)}>
        {auth.user ? (auth.user.name?.split(' ')[0] || 'Account') : 'Account'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow">
          {!auth.user ? (
            <div className="py-1">
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={()=>{ setOpen(false); onSignIn?.(); }}>Sign in</button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={()=>{ setOpen(false); onRegister?.(); }}>Create account</button>
            </div>
          ) : (
            <div className="py-1">
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50" onClick={()=>{ setOpen(false); onDashboard?.(); }}>Dashboard</button>
              <button className="w-full text-left px-3 py-2 hover:bg-slate-50 text-rose-600" onClick={()=>{ setOpen(false); onSignOut?.(); }}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
