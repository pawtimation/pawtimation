import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth';
import { API_BASE } from '../config';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from '../components/UpgradeModal';
import { HeroBanner } from '../ui/primitives';

export function DashboardOwner() {
  const navigate = useNavigate();
  const [firstPetName, setFirstPetName] = useState(null);
  const { plan } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Derive access from current plan state
  const canUseAiMatch = ['PLUS', 'PREMIUM'].includes(plan);

  useEffect(() => {
    async function loadFirstPet() {
      try {
        const response = await fetch(`${API_BASE}/pets`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            setFirstPetName(data.pets[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load pets:', err);
      }
    }
    loadFirstPet();
  }, []);

  const petDisplayName = firstPetName || 'your pet';

  return (
    <div className="space-y-4">
      <HeroBanner 
        title="Pet Owner Dashboard" 
        subtitle={`Welcome back! Ready to book care for ${petDisplayName}?`}
        imageUrl="/curly-brown-dog.jpg"
      />

      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/browse')}
          className="bg-white border-2 border-slate-200 p-6 rounded-xl hover:border-brand-teal transition-all text-left"
        >
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold text-lg mb-1">Browse Companions</h3>
          <p className="text-sm text-slate-600">Search by location, services, and availability. Start a chat before booking.</p>
        </button>

        <div className="relative">
          <button 
            onClick={() => canUseAiMatch && navigate('/owner/booking')}
            className={`w-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl transition-all shadow-sm text-left ${
              canUseAiMatch ? 'hover:from-emerald-600 hover:to-emerald-700' : 'opacity-60'
            }`}
          >
            <div className="text-2xl mb-2">✨</div>
            <h3 className="font-semibold text-lg mb-1">AI-Match {petDisplayName}</h3>
            <p className="text-sm text-emerald-100">Let AI rank by locality, reliability score & fit. (Plus/Premium)</p>
          </button>
          
          {!canUseAiMatch && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-center px-4">
                <div className="text-3xl mb-2">🔒</div>
                <h4 className="text-white font-semibold mb-1">Plus/Premium Feature</h4>
                <p className="text-slate-300 text-sm mb-3">Upgrade to unlock AI-powered matching</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUpgradeModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition font-medium text-sm"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>

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
      </div>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        currentPlan={plan}
      />
    </div>
  );
}
