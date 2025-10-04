import React, { useState, useEffect } from 'react';
import { auth } from '../lib/auth';
import { FeatureGate } from '../components/FeatureGate';

export function Account({ onBack, onNavigate }) {
  const [plan, setPlan] = useState('FREE');
  const [chats, setChats] = useState([]);
  const [feedbackScore, setFeedbackScore] = useState({ downcount: 0, needsEscalation: false });
  const [profile, setProfile] = useState({ name: '', role: 'Owner', location: 'Beaconsfield' });

  useEffect(() => {
    // Fetch user plan
    fetch('/api/me/plan', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(data => setPlan(data.plan || 'FREE'));

    // Fetch PawBot chats
    fetch('/api/ai/chats', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(data => setChats(data.chats || []));

    // Fetch feedback score
    fetch('/api/ai/feedback/score', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(data => setFeedbackScore(data));

    // Get user info
    if (auth.user) {
      setProfile({ name: auth.user.name, role: 'Owner', location: 'Beaconsfield' });
    }
  }, []);

  async function giveFeedback(chatId, value) {
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      },
      body: JSON.stringify({ chatId, value })
    });
    
    // Refresh score
    const r = await fetch('/api/ai/feedback/score', {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const data = await r.json();
    setFeedbackScore(data);
  }

  async function escalateToHuman() {
    const lastChat = chats[0];
    await fetch('/api/ai/escalate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      },
      body: JSON.stringify({ reason: 'manual', lastChatId: lastChat?.id })
    });
    alert('Our team has been notified. We\'ll email you at hello@pawtimation.co.uk soon.');
  }

  const planChip = {
    FREE: { bg: 'bg-slate-200', text: 'text-slate-700', label: 'Free' },
    PLUS: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Plus' },
    PREMIUM: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Premium ⭐' }
  };

  const currentChip = planChip[plan];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Hub</h1>
          <p className="text-slate-600">Manage your profile, subscription and preferences</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300">
            ← Back
          </button>
        )}
      </div>

      {/* 1. Profile Section */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">
            🐕
          </div>
          <div>
            <div className="font-semibold text-lg">{profile.name}</div>
            <div className="text-sm text-slate-600">🐕 {profile.role}</div>
            <div className="text-sm text-slate-500">📍 {profile.location}</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={() => onNavigate?.('pets')}
            className="w-full text-left px-4 py-2 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
          >
            Manage my pets
          </button>
          <button 
            onClick={() => onNavigate?.('services')}
            className="w-full text-left px-4 py-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
          >
            Manage my services (Companion)
          </button>
          
          <FeatureGate feature="autopostSocial">
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Connect social media</div>
              <div className="space-y-2">
                <input placeholder="Instagram handle" className="border rounded px-3 py-1 w-full text-sm" />
                <input placeholder="Facebook page" className="border rounded px-3 py-1 w-full text-sm" />
              </div>
            </div>
          </FeatureGate>

          <FeatureGate feature="unlimitedBio">
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Premium extras</div>
              <textarea placeholder="Unlimited bio..." className="border rounded px-3 py-2 w-full text-sm" rows={3} />
            </div>
          </FeatureGate>
        </div>
      </div>

      {/* 2. Subscription & Billing */}
      <div className="bg-white rounded-lg shadow-card p-6" id="billing">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Subscription & Billing</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentChip.bg} ${currentChip.text}`}>
            {currentChip.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded p-4 text-center">
            <div className="font-semibold">Free</div>
            <div className="text-2xl font-bold my-2">£0</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ Basic booking</div>
              <div>✓ Up to 2 pets</div>
              <div>✓ Community access</div>
            </div>
          </div>
          <div className="border-2 border-sky-400 rounded p-4 text-center bg-sky-50">
            <div className="font-semibold">Plus</div>
            <div className="text-2xl font-bold my-2">£4.99<span className="text-sm">/mo</span></div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ Unlimited pets</div>
              <div>✓ AI diary summaries</div>
              <div>✓ Create events</div>
              <div>✓ Smart matching</div>
            </div>
          </div>
          <div className="border-2 border-amber-400 rounded p-4 text-center bg-amber-50">
            <div className="font-semibold">Premium ⭐</div>
            <div className="text-2xl font-bold my-2">£9.99<span className="text-sm">/mo</span></div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ All Plus features</div>
              <div>✓ Live tracking</div>
              <div>✓ Auto-post social</div>
              <div>✓ Priority support</div>
              <div>✓ Weekly insights</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded p-3 mb-4 text-sm text-slate-600">
          You've used 80% of your free features. Upgrade for unlimited access!
        </div>

        {plan === 'FREE' && (
          <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors">
            Upgrade to Plus →
          </button>
        )}
        {plan === 'PLUS' && (
          <button className="w-full px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors">
            Upgrade to Premium ⭐
          </button>
        )}
      </div>

      {/* 3. Preferences & Notifications */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences & Notifications</h2>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Email booking updates</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </label>
          <label className="flex items-center justify-between">
            <span>Event invitations</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </label>
          
          <FeatureGate feature="preferredContactMethod" compact>
            <label className="flex items-center justify-between opacity-50">
              <span>Preferred contact (Email/SMS/WhatsApp)</span>
              <select className="border rounded px-2 py-1 text-sm" disabled>
                <option>Email</option>
              </select>
            </label>
          </FeatureGate>

          <FeatureGate feature="instantAiSummaries" compact>
            <label className="flex items-center justify-between opacity-50">
              <span>Instant AI summaries after every walk</span>
              <input type="checkbox" className="toggle" disabled />
            </label>
          </FeatureGate>

          <FeatureGate feature="weeklyInsights" compact>
            <label className="flex items-center justify-between opacity-50">
              <span>Weekly insights report</span>
              <input type="checkbox" className="toggle" disabled />
            </label>
          </FeatureGate>

          <label className="flex items-center justify-between">
            <span>Surprise me! (Weekly pet tips)</span>
            <input type="checkbox" className="toggle" />
          </label>
        </div>
      </div>

      {/* 4. AI Chat Assistant History */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">AI Chat Assistant History (PawBot)</h2>
        
        {feedbackScore.needsEscalation && (
          <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
            🐾 PawBot has alerted our human team — we'll email you soon at hello@pawtimation.co.uk
          </div>
        )}

        <div className="space-y-2 mb-4">
          {chats.map(chat => (
            <div key={chat.id} className="border rounded p-3 flex items-center justify-between hover:bg-slate-50">
              <div className="flex-1">
                <div className="text-sm">{chat.preview}</div>
                <div className="text-xs text-slate-500">
                  {new Date(chat.ts).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => giveFeedback(chat.id, 1)}
                  className="text-emerald-600 hover:text-emerald-700"
                  title="Helpful"
                >
                  🐾 ↑
                </button>
                <button 
                  onClick={() => giveFeedback(chat.id, -1)}
                  className="text-rose-600 hover:text-rose-700"
                  title="Not helpful"
                >
                  🐾 ↓
                </button>
                <FeatureGate feature="summariseThread" compact>
                  <button className="text-sm text-sky-600 opacity-50" disabled>Summarise</button>
                </FeatureGate>
                <FeatureGate feature="pinChat" compact>
                  <button className="text-sm text-slate-600 opacity-50" disabled>Pin</button>
                </FeatureGate>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Support & Feedback */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Support & Feedback</h2>
          {plan === 'PREMIUM' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Priority Support</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm">
            📚 FAQ
          </button>
          <a 
            href="mailto:hello@pawtimation.co.uk" 
            className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm text-center"
          >
            ✉️ Contact team
          </a>
          <button className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm">
            🐛 Report issue
          </button>
          <button className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm">
            📋 Community guidelines
          </button>
        </div>

        <button 
          onClick={escalateToHuman}
          className="w-full mt-4 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
        >
          Ask to speak to a human
        </button>
      </div>

      {/* 6. Logout */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => {
                auth.token = '';
                auth.user = null;
                fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/';
              }}
              className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="text-sm text-slate-600">
            {plan === 'PREMIUM' && <span>✓ Auto-remember (Premium)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
