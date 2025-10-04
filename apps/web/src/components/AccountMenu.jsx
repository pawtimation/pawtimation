import React, { useState } from 'react';
import { auth } from '../lib/auth';
export function AccountMenu({ onSignIn, onRegister, onDashboard, onSignOut }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        className="px-4 py-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white font-medium hover:from-slate-600 hover:to-slate-800 transition-all shadow-sm" 
        onClick={()=>setOpen(!open)}
      >
        {auth.user ? (auth.user.name?.split(' ')[0] || 'Account') : 'Account'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {!auth.user ? (
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onSignIn?.(); }}>Sign in</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onRegister?.(); }}>Create account</button>
            </div>
          ) : (
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onDashboard?.(); }}>Dashboard</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm text-rose-600" onClick={()=>{ setOpen(false); onSignOut?.(); }}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
