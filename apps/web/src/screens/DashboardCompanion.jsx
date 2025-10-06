import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth';

export function DashboardCompanion() {
  const navigate = useNavigate();
  const sitterId = auth.user?.sitterId || 's_demo_companion';

  const cards = [
    {
      title: 'Profile Checklist',
      icon: '✓',
      desc: 'Complete your onboarding',
      path: '/companion/checklist',
      color: 'from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
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
      color: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
    },
    {
      title: 'Calendar',
      icon: '📅',
      desc: 'Manage your availability',
      path: '/companion/calendar',
      color: 'from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600'
    }
  ];

  const profileCards = [
    {
      title: 'Edit Profile',
      icon: '✏️',
      desc: 'Update bio, services & rates',
      path: '/companion/edit'
    },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-ink">Pet Companion Dashboard</h2>
          <p className="text-slate-600 mt-1">Welcome back, {auth.user?.name}!</p>
        </div>
        <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-800">← Home</button>
      </div>

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

      <div>
        <h3 className="font-semibold text-lg mb-3">Profile Management</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {profileCards.map((card) => (
            <button 
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white border-2 border-slate-200 p-4 rounded-xl hover:border-brand-teal transition-all text-left"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <h4 className="font-semibold mb-1">{card.title}</h4>
              <p className="text-xs text-slate-600">{card.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
