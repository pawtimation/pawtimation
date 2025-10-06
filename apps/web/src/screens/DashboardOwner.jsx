import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/auth';
import { API_BASE } from '../config';

export function DashboardOwner() {
  const navigate = useNavigate();
  const [firstPetName, setFirstPetName] = useState(null);

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
      <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl overflow-hidden shadow-sm border border-teal-100 p-6">
        <div className="absolute inset-0 opacity-20">
          <img src="/hector-2.jpg" alt="" className="w-full h-full object-cover object-center"/>
        </div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-ink">Pet Owner Dashboard</h2>
            <p className="text-slate-600 mt-1">Welcome back! Ready to book care for {petDisplayName}?</p>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-600 hover:text-slate-800 font-medium">← Back</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/owner/booking')}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm text-left"
        >
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold text-lg mb-1">Find {petDisplayName} Companion</h3>
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
