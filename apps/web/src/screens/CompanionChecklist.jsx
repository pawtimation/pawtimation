import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';
import { trackEvent } from '../lib/metrics';
import { HeroBanner } from '../ui/primitives';

export function CompanionChecklist() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState({
    photo: false,
    bio: false,
    services: false,
    availability: false,
    verification: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklistStatus();
  }, []);

  async function loadChecklistStatus() {
    try {
      const response = await fetch(`${API_BASE}/companion/checklist`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setChecklist(data.checklist || checklist);
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
    } finally {
      setLoading(false);
    }
  }

  const items = [
    {
      key: 'photo',
      title: 'Upload photo',
      desc: 'Add a friendly profile picture',
      icon: '🐕',
      link: '/companion/photo',
      complete: checklist.photo
    },
    {
      key: 'bio',
      title: 'Add short bio',
      desc: 'Minimum 80 characters about you',
      icon: '✍️',
      link: '/companion/bio',
      complete: checklist.bio
    },
    {
      key: 'services',
      title: 'Set services & prices',
      desc: 'Walk 30/60, day care, drop-in rates',
      icon: '💵',
      link: '/companion/services',
      complete: checklist.services
    },
    {
      key: 'availability',
      title: 'Set availability',
      desc: 'Add at least 3 time slots',
      icon: '📆',
      link: '/companion/calendar',
      complete: checklist.availability
    },
    {
      key: 'verification',
      title: 'ID & Insurance',
      desc: 'Optional now, needed for Pro status',
      icon: '🛡️',
      link: '/companion/verification',
      complete: checklist.verification
    }
  ];

  const completedCount = items.filter(i => i.complete).length;
  const progress = Math.round((completedCount / items.length) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading checklist...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <HeroBanner 
        title="Welcome to Pawtimation!" 
        subtitle="Complete these steps to start receiving booking requests"
      />

      <div className="bg-gradient-to-r from-brand-teal to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-semibold">{progress}% Complete</div>
          <div className="text-sm opacity-90">{completedCount} of {items.length} steps</div>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3">
          <div 
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.link)}
            className={`card-base mb-3 w-full text-left transition-all hover:shadow-md border-2 ${
              item.complete 
                ? 'bg-green-50 border-green-300' 
                : 'bg-white border-slate-200 hover:border-brand-teal'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`text-4xl ${item.complete ? 'opacity-50' : ''}`}>
                {item.complete ? '✅' : item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.complete && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
              </div>
              <div className="text-slate-400">→</div>
            </div>
          </button>
        ))}
      </div>

      {progress === 100 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-6 text-center shadow-lg">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-2xl font-bold mb-2">Profile Complete!</h3>
          <p className="mb-4">You're ready to start receiving booking requests</p>
          <button
            onClick={() => {
              trackEvent('companion_complete_checklist');
              navigate('/companion/opportunities');
            }}
            className="px-6 py-3 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
          >
            View Opportunities
          </button>
        </div>
      )}
    </div>
  );
}
