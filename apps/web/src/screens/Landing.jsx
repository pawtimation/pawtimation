import React from 'react';
export function Landing({ onOwner, onCompanion }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-900 to-sky-600 text-white rounded-3xl p-6 shadow">
        <h1 className="text-3xl font-bold">Welcome to Pawtimation</h1>
        <p className="text-slate-200 mt-2">Trusted pet care for families — friends or professionals, your choice.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-2">I'm a Pet Owner</h3>
          <p className="text-slate-700 mb-3">Invite a friend or book a vetted Companion. Daily photos and AI diary summaries included.</p>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={onOwner}>Continue</button>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="text-xl font-semibold mb-2">I'm a Pet Companion</h3>
          <p className="text-slate-700 mb-3">Create your profile, set rates and upload documents to move from Trainee to Pro.</p>
          <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={onCompanion}>Continue</button>
        </div>
      </div>
    </div>
  );
}
