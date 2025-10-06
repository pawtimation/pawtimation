import React from 'react';
import { auth } from '../lib/auth';

export function Landing({ onOwner, onCompanion, onSignIn, onRegister, onDashboard }) {
  const user = auth.user;
  
  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-brand-teal to-brand-blue rounded-2xl overflow-hidden mb-6 shadow-lg">
        <div className="absolute inset-0 opacity-30">
          <img src="/hero-dog.jpg" alt="" className="w-full h-full object-cover"/>
        </div>
        <div className="relative z-10 p-8 md:p-12 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome to Pawtimation</h1>
          <p className="text-xl md:text-2xl opacity-95">Trusted pet care for families — friends or professionals, your choice</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-2">I'm a Pet Owner</h3>
          <p className="text-slate-700 mb-4">Invite a friend or book a vetted Companion. Daily photos and AI diary summaries included.</p>
          {user ? (
            <button 
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" 
              onClick={() => onDashboard('owner')}
            >
              Open my dashboard
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" 
                onClick={onSignIn}
              >
                Sign in
              </button>
              <button 
                className="flex-1 px-4 py-2 border border-emerald-600 text-emerald-600 rounded hover:bg-emerald-50" 
                onClick={() => onRegister('owner')}
              >
                Create account
              </button>
            </div>
          )}
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-2">I'm a Pet Companion</h3>
          <p className="text-slate-700 mb-4">Create your profile, set rates and upload documents to move from Trainee to Pro.</p>
          {user ? (
            <button 
              className="w-full px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700" 
              onClick={() => onDashboard('companion')}
            >
              Open my dashboard
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700" 
                onClick={onSignIn}
              >
                Sign in
              </button>
              <button 
                className="flex-1 px-4 py-2 border border-slate-800 text-slate-800 rounded hover:bg-slate-50" 
                onClick={() => onRegister('companion')}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
