import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth';

export function DashboardCompanion() {
  const navigate = useNavigate();
  const sitterId = auth.user?.sitterId || 's_demo_companion';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetch('/api/companion/checklist', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(data => {
        const completedSteps = [
          data.photo,
          data.bio,
          data.services,
          data.availability,
          data.verification
        ].filter(Boolean).length;
        setProgress(Math.round((completedSteps / 5) * 100));
      })
      .catch(() => {});
  }, []);

  const cards = [
    {
      title: 'Profile',
      icon: '✓',
      desc: 'Update bio, services & rates',
      path: '/companion/edit',
      color: 'from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
    },
    {
      title: 'Opportunities',
      icon: '🎯',
      desc: 'AI-matched booking requests',
      path: '/companion/opportunities',
      color: 'from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600'
    },
    {
      title: 'Messages',
      icon: '💬',
      desc: 'Chat with pet owners',
      path: '/companion/messages',
      color: 'from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600'
    },
    {
      title: 'Calendar',
      icon: '📅',
      desc: 'Manage your availability',
      path: '/companion/calendar',
      color: 'from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600'
    }
  ];

  const profileCards = [
    {
      title: 'Preview Page',
      icon: '👁️',
      desc: 'See your public profile',
      path: `/companion/preview?id=${sitterId}`
    },
    {
      title: 'Services & Pricing',
      icon: '💰',
      desc: 'Configure your offerings',
      path: '/companion/services'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl overflow-hidden shadow-sm border border-cyan-100 p-6">
        <div className="absolute inset-0 opacity-20">
          <img src="/hector-3.jpg" alt="" className="w-full h-full object-cover object-top"/>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-brand-ink">Pet Companion Dashboard</h2>
            <p className="text-slate-600 mt-1">Welcome back, {auth.user?.name}!</p>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-800 font-medium">← Home</button>
        </div>
      </div>

      {progress < 100 && (
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Onboarding Progress</span>
              <span className="text-sm text-slate-600">{progress}% Complete</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button 
            onClick={() => navigate('/companion/checklist')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium whitespace-nowrap"
          >
            Complete Steps
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <button 
            key={card.path}
            onClick={() => navigate(card.path)}
            className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-xl transition-all shadow-sm text-left`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <h3 className="font-semibold text-xl mb-1">{card.title}</h3>
            <p className="text-sm text-white/90">{card.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <button 
          onClick={() => navigate(`/companion/preview?id=${sitterId}`)}
          className="bg-white border-2 border-slate-200 p-4 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-left"
        >
          <div className="text-2xl mb-2">👁️</div>
          <h4 className="font-semibold mb-1 text-slate-800">Preview Page</h4>
          <p className="text-xs text-slate-600">See your public profile</p>
        </button>
      </div>
    </div>
  );
}
