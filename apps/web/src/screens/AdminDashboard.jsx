import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resetDemoData } from '../lib/seedDemo';

export function AdminDashboard() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Masquerade',
      icon: '👤',
      description: 'Act as any user to debug issues',
      path: '/admin/masquerade',
      color: 'from-slate-600 to-slate-700'
    },
    {
      title: 'Support Queue',
      icon: '💬',
      description: 'Review escalated support conversations',
      path: '/admin/support',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Verification Queue',
      icon: '✓',
      description: 'Approve Pro companion applications',
      path: '/admin/verification',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Metrics',
      icon: '📊',
      description: 'Platform health and performance',
      path: '/admin/metrics',
      color: 'from-teal-500 to-teal-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-brand-ink">Admin Dashboard</h2>
        <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-800">← Home</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className={`bg-gradient-to-br ${card.color} text-white p-6 rounded-xl hover:shadow-lg transition-all text-left`}
          >
            <div className="text-4xl mb-3">{card.icon}</div>
            <h3 className="font-semibold text-xl mb-2">{card.title}</h3>
            <p className="text-sm opacity-90">{card.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-3 text-slate-800">Demo Data</h3>
        <p className="text-sm text-slate-600 mb-4">Reset demo data to clear all seeded companions and events. This will reload the app.</p>
        <button
          onClick={resetDemoData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
        >
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}
