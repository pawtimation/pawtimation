import React from 'react';

export function DashboardChoose({ onChoose, onBack }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Choose Your Dashboard</h2>
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      <p className="text-slate-600">You have both Pet Owner and Pet Companion roles. Which dashboard would you like to access?</p>

      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => onChoose('owner')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm text-center"
        >
          <div className="text-4xl mb-3">🐾</div>
          <h3 className="font-semibold text-xl mb-2">Pet Owner</h3>
          <p className="text-sm text-emerald-100">Book companions, manage pets, connect with friends</p>
        </button>

        <button 
          onClick={() => onChoose('companion')}
          className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-8 rounded-xl hover:from-slate-600 hover:to-slate-800 transition-all shadow-sm text-center"
        >
          <div className="text-4xl mb-3">👋</div>
          <h3 className="font-semibold text-xl mb-2">Pet Companion</h3>
          <p className="text-sm text-slate-300">Manage profile, services, availability</p>
        </button>
      </div>
    </div>
  );
}
