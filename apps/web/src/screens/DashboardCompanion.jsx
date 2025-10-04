import React from 'react';
import { auth } from '../lib/auth';

export function DashboardCompanion({ onNavigate, onBack }) {
  const sitterId = auth.user?.sitterId || 's_demo_companion';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Pet Companion Dashboard</h2>
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('sitterEdit')}
          className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-6 rounded-xl hover:from-slate-600 hover:to-slate-800 transition-all shadow-sm text-left"
        >
          <div className="text-2xl mb-2">✏️</div>
          <h3 className="font-semibold text-lg mb-1">Edit my profile</h3>
          <p className="text-sm text-slate-300">Update bio, services, rates & availability</p>
        </button>

        <button 
          onClick={() => onNavigate('sitterPublic')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">👁️</div>
          <h3 className="font-semibold text-lg mb-1">Preview my public page</h3>
          <p className="text-sm text-slate-600">See how owners view your profile</p>
        </button>

        <button 
          onClick={() => onNavigate('sitterEdit')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-semibold text-lg mb-1">Services & Pricing</h3>
          <p className="text-sm text-slate-600">Configure your offerings</p>
        </button>

        <button 
          onClick={() => onNavigate('sitterEdit')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">📅</div>
          <h3 className="font-semibold text-lg mb-1">Availability Calendar</h3>
          <p className="text-sm text-slate-600">Manage your schedule</p>
        </button>
      </div>
    </div>
  );
}
