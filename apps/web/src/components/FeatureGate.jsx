import React, { useState, useEffect } from 'react';
import { auth } from '../lib/auth';

// Plan feature gating component with upgrade tooltips
export function FeatureGate({ feature, children, compact = false, fallback = null }) {
  const [plan, setPlan] = useState('FREE');
  const [needed, setNeeded] = useState(null);

  useEffect(() => {
    fetch('/api/me/plan', {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
    })
      .then(r => r.json())
      .then(data => setPlan(data.plan || 'FREE'))
      .catch(() => setPlan('FREE'));
  }, []);

  const featureMap = {
    autopostSocial: 'PREMIUM',
    analyticsInsights: 'PREMIUM',
    autoMatchCompanion: 'PLUS',
    prioritySupport: 'PREMIUM',
    createEvent: 'PLUS',
    liveTracking: 'PREMIUM',
    aiDiary: 'PLUS',
    unlimitedBio: 'PREMIUM',
    verifiedBadge: 'PREMIUM',
    bannerTheme: 'PREMIUM',
    instantAiSummaries: 'PREMIUM',
    weeklyInsights: 'PREMIUM',
    preferredContactMethod: 'PLUS',
    notificationTone: 'PLUS',
    pinChat: 'PREMIUM',
    summariseThread: 'PREMIUM'
  };

  const planHierarchy = { FREE: 0, PLUS: 1, PREMIUM: 2 };
  const requiredPlan = featureMap[feature];

  if (!requiredPlan || planHierarchy[plan] >= planHierarchy[requiredPlan]) {
    return <>{children}</>;
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 relative group">
        <span className="text-amber-500">🔒</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Upgrade to {requiredPlan} to unlock
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded">
        <div className="text-center p-4 bg-white rounded-lg shadow-lg max-w-xs">
          <div className="text-3xl mb-2">🔒</div>
          <div className="font-semibold mb-1">
            {requiredPlan === 'PLUS' ? 'Plus' : 'Premium'} Feature
          </div>
          <div className="text-sm text-slate-600 mb-3">
            Upgrade to unlock this feature
          </div>
          <button 
            onClick={() => window.location.href = '#billing'}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
          >
            Upgrade now
          </button>
        </div>
      </div>
      {fallback}
    </div>
  );
}
