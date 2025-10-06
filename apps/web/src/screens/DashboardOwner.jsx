import React from 'react';
import { useNavigate } from 'react-router-dom';

export function DashboardOwner() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Pet Owner Dashboard</h2>
        <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/owner/booking')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm text-left"
        >
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold text-lg mb-1">Auto-book a Companion</h3>
          <p className="text-sm text-emerald-100">Smart matching based on your preferences</p>
        </button>

        <button 
          onClick={() => navigate('/owner/pets')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">🐾</div>
          <h3 className="font-semibold text-lg mb-1">Manage my pets</h3>
          <p className="text-sm text-slate-600">Add or edit your pet profiles</p>
        </button>

        <button 
          onClick={() => navigate('/owner/circle')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-semibold text-lg mb-1">My Circle</h3>
          <p className="text-sm text-slate-600">Invite friends, manage your trusted network</p>
        </button>

        <button 
          onClick={() => navigate('/chat')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-semibold text-lg mb-1">Community chat</h3>
          <p className="text-sm text-slate-600">Connect with other pet owners</p>
        </button>
      </div>
    </div>
  );
}
