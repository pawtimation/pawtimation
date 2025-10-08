import React, { useState, useEffect } from 'react';
import { auth } from '../lib/auth';
import { FeatureGate } from '../components/FeatureGate';
import { AccountAccordion } from '../components/AccountAccordion';
import { UpgradeModal } from '../components/UpgradeModal';
import { usePlan } from '../hooks/usePlan';
import { useToast } from '../components/Toast';

export function Account({ onBack, onNavigate }) {
  const { plan, loading } = usePlan();
  const { showToast, ToastComponent } = useToast();
  
  const [chats, setChats] = useState([]);
  const [feedbackScore, setFeedbackScore] = useState({ downcount: 0, needsEscalation: false });
  const [profile, setProfile] = useState({ name: '', role: 'Owner', location: 'Beaconsfield' });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Preferences state
  const [prefs, setPrefs] = useState({
    bookingUpdates: true,
    eventInvitations: true,
    weeklyTips: false,
    marketingConsent: false
  });

  useEffect(() => {
    // Load preferences from localStorage
    try {
      const saved = localStorage.getItem('pt_prefs');
      if (saved) {
        setPrefs(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    }

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
      setProfile({ 
        name: auth.user.name, 
        role: auth.user.role || 'Owner', 
        location: 'Beaconsfield' 
      });
    }
  }, []);

  function savePreferences(newPrefs) {
    setPrefs(newPrefs);
    localStorage.setItem('pt_prefs', JSON.stringify(newPrefs));
    showToast('Preferences saved', 'success');
  }

  async function giveFeedback(chatId, value) {
    await fetch('/api/ai/feedback', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}` 
      },
      body: JSON.stringify({ chatId, value })
    });
    
    const r = await fetch('/api/ai/feedback/score', {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    const data = await r.json();
    setFeedbackScore(data);
  }

  function downloadMyData() {
    const data = {
      profile: {
        name: auth.user?.name,
        email: auth.user?.email,
        role: profile.role,
        location: profile.location,
        plan: plan
      },
      preferences: prefs,
      chats: chats.length,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pawtimation-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data downloaded', 'success');
  }

  function handleDeleteAccount() {
    console.log('Account deletion requested by:', auth.user?.email);
    showToast('Request received - our team will contact you', 'info');
    setShowDeleteModal(false);
  }

  const planChip = {
    FREE: { bg: 'bg-slate-200', text: 'text-slate-700', label: 'Free' },
    PLUS: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Plus' },
    PREMIUM: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Premium ⭐' }
  };

  const currentChip = planChip[plan];
  const isOwnerOnly = profile.role === 'Owner';
  const isCompanion = profile.role === 'Companion' || auth.user?.isCompanion;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {ToastComponent}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Hub</h1>
          <p className="text-slate-600">Manage your profile, subscription and preferences</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            ← Back
          </button>
        )}
      </div>

      {/* Profile Section */}
      <AccountAccordion id="profile" title="Profile" defaultOpen>
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
            className="w-full text-left px-4 py-2 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Manage my pets
          </button>
          
          {isCompanion && (
            <button 
              onClick={() => onNavigate?.('services')}
              className="w-full text-left px-4 py-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Manage my services (Companion)
            </button>
          )}
          
          <FeatureGate feature="autopostSocial">
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Connect social media</div>
              <div className="space-y-2">
                <input placeholder="Instagram handle" className="border rounded px-3 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input placeholder="Facebook page" className="border rounded px-3 py-1 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </FeatureGate>

          <FeatureGate feature="unlimitedBio">
            <div className="border rounded p-3">
              <div className="font-medium mb-2">Premium extras</div>
              <textarea placeholder="Unlimited bio..." className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={3} />
            </div>
          </FeatureGate>
        </div>
      </AccountAccordion>

      {/* Subscription & Billing Section */}
      <AccountAccordion 
        id="billing" 
        title="Subscription & Billing"
        badge={
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentChip.bg} ${currentChip.text}`}>
            {currentChip.label}
          </span>
        }
      >
        <div className="bg-slate-50 rounded p-3 mb-4 text-sm text-slate-600">
          {plan === 'FREE' && "You've used 80% of your free features. Upgrade for unlimited access!"}
          {plan === 'PLUS' && "You're on Plus! Upgrade to Premium for live tracking and more."}
          {plan === 'PREMIUM' && "You're on Premium! Enjoy all features unlocked."}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded p-4 text-center">
            <div className="font-semibold text-lg">Free</div>
            <div className="text-2xl font-bold my-2">£0</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ Basic booking</div>
              <div>✓ Up to 2 pets</div>
              <div>✓ Community access</div>
            </div>
          </div>
          <div className="border rounded p-4 text-center bg-teal-50">
            <div className="font-semibold text-lg">Plus</div>
            <div className="text-2xl font-bold my-2">£4.99<span className="text-sm">/mo</span></div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ Unlimited pets</div>
              <div>✓ AI diary summaries</div>
              <div>✓ Create events</div>
              <div>✓ Smart matching</div>
            </div>
          </div>
          <div className="border rounded p-4 text-center bg-emerald-50">
            <div className="font-semibold text-lg">Premium ⭐</div>
            <div className="text-2xl font-bold my-2">£9.99<span className="text-sm">/mo</span></div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>✓ All Plus features</div>
              <div>✓ Live tracking</div>
              <div>✓ Auto-post social</div>
              <div>✓ Priority support</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowUpgradeModal(true)}
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {plan === 'FREE' && 'Upgrade to Plus →'}
          {plan === 'PLUS' && 'Upgrade to Premium ⭐'}
          {plan === 'PREMIUM' && 'Manage billing'}
        </button>
      </AccountAccordion>

      {/* Preferences & Notifications Section */}
      <AccountAccordion id="preferences" title="Preferences & Notifications">
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">Email booking updates</span>
            <input 
              type="checkbox" 
              checked={prefs.bookingUpdates}
              onChange={(e) => savePreferences({ ...prefs, bookingUpdates: e.target.checked })}
              className="toggle h-5 w-5 text-emerald-600 focus:ring-emerald-500 rounded" 
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">Event invitations</span>
            <input 
              type="checkbox" 
              checked={prefs.eventInvitations}
              onChange={(e) => savePreferences({ ...prefs, eventInvitations: e.target.checked })}
              className="toggle h-5 w-5 text-emerald-600 focus:ring-emerald-500 rounded" 
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">Weekly pet tips</span>
            <input 
              type="checkbox" 
              checked={prefs.weeklyTips}
              onChange={(e) => savePreferences({ ...prefs, weeklyTips: e.target.checked })}
              className="toggle h-5 w-5 text-emerald-600 focus:ring-emerald-500 rounded" 
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">Marketing consent</span>
            <input 
              type="checkbox" 
              checked={prefs.marketingConsent}
              onChange={(e) => savePreferences({ ...prefs, marketingConsent: e.target.checked })}
              className="toggle h-5 w-5 text-emerald-600 focus:ring-emerald-500 rounded" 
            />
          </label>
        </div>
      </AccountAccordion>

      {/* Security Section */}
      <AccountAccordion id="security" title="Security">
        <div className="space-y-3">
          <button 
            onClick={downloadMyData}
            className="w-full text-left px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            📥 Download my data
          </button>
          
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full text-left px-4 py-2 border border-rose-200 text-rose-700 rounded hover:bg-rose-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            🗑️ Delete my account
          </button>
        </div>
      </AccountAccordion>

      {/* Support & Feedback Section */}
      <AccountAccordion 
        id="support" 
        title="Support & Feedback"
        badge={plan === 'PREMIUM' && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Priority Support</span>
        )}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={() => onNavigate?.('faq')}
            className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            📚 FAQ
          </button>
          
          <a 
            href={`mailto:hello@pawtimation.co.uk?subject=Pawtimation%20Issue&body=Issue%20from%3A%20${window.location.href}%0D%0ARole%3A%20${profile.role}%0D%0A%0D%0A`}
            className="px-4 py-2 border rounded hover:bg-slate-50 transition-colors text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            🐛 Report issue
          </a>
          
          <a 
            href={`mailto:hello@pawtimation.co.uk?subject=Speak%20to%20a%20human&body=Request%20from%3A%20${window.location.href}%0D%0ARole%3A%20${profile.role}%0D%0A%0D%0AI%20would%20like%20to%20speak%20to%20someone%20about%3A%0D%0A`}
            className="col-span-2 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors text-sm font-medium text-center focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            💬 Speak to a human
          </a>
        </div>

        {/* AI Chat History */}
        {feedbackScore.needsEscalation && (
          <div className="bg-teal-50 border border-teal-200 rounded p-3 mb-4 text-sm">
            🐾 PawBot has alerted our human team — we'll email you soon at hello@pawtimation.co.uk
          </div>
        )}

        <div className="space-y-2">
          {chats.slice(0, 3).map(chat => (
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
              </div>
            </div>
          ))}
          {chats.length > 3 && (
            <div className="text-sm text-slate-500 text-center pt-2">
              + {chats.length - 3} more conversations
            </div>
          )}
        </div>
      </AccountAccordion>

      {/* Admin Panel (only for admins) */}
      {auth.user?.isAdmin && (
        <AccountAccordion 
          id="admin" 
          title="⚡ Admin Panel"
          badge={<span className="text-xs bg-slate-700 text-white px-2 py-1 rounded">Admin Access</span>}
        >
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate?.('supportMetrics')}
              className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              📊 Support Metrics
            </button>
            <button 
              onClick={() => onNavigate?.('community')}
              className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              💬 Community Chat
            </button>
            <button 
              onClick={() => onNavigate?.('communityEvents')}
              className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              📅 All Events
            </button>
            <button className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500">
              👥 User Management
            </button>
          </div>
        </AccountAccordion>
      )}

      {/* Logout Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              auth.token = '';
              auth.user = null;
              fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/';
            }}
            className="px-6 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Logout
          </button>
          {plan === 'PREMIUM' && (
            <div className="text-sm text-slate-600">
              ✓ Auto-remember (Premium)
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentPlan={plan}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Account?</h3>
            <p className="text-slate-600 mb-6">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
