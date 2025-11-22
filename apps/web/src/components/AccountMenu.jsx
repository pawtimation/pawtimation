import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';

function getCurrentUser(pathname) {
  // Route-aware session selection to prevent multi-session leakage
  if (pathname.startsWith('/client')) {
    const clientSession = getSession('CLIENT');
    return clientSession?.userSnapshot || null;
  }
  if (pathname.startsWith('/staff')) {
    const staffSession = getSession('STAFF');
    return staffSession?.userSnapshot || null;
  }
  if (pathname.startsWith('/owner')) {
    const superAdminSession = getSession('SUPER_ADMIN');
    return superAdminSession?.userSnapshot || null;
  }
  // Default to admin or first available session
  const adminSession = getSession('ADMIN');
  const staffSession = getSession('STAFF');
  const clientSession = getSession('CLIENT');
  const superAdminSession = getSession('SUPER_ADMIN');
  const session = adminSession || staffSession || clientSession || superAdminSession;
  return session?.userSnapshot || null;
}

export function AccountMenu({ onSignIn, onRegister, onDashboard, onSignOut }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const user = getCurrentUser(location.pathname);
  
  return (
    <div className="relative">
      <button 
        className="px-4 py-2 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white font-medium hover:from-slate-600 hover:to-slate-800 transition-all shadow-sm" 
        onClick={()=>setOpen(!open)}
      >
        {user ? (user.name?.split(' ')[0] || 'Account') : 'Account'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {!user ? (
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onSignIn?.(); }}>Sign in</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onRegister?.(); }}>Create account</button>
            </div>
          ) : (
            <div className="py-1">
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm" onClick={()=>{ setOpen(false); onDashboard?.(); }}>Dashboard</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition text-sm text-brand-teal" onClick={()=>{ setOpen(false); onSignOut?.(); }}>Sign out</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
