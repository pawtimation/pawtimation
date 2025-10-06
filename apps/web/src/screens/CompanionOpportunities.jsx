import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function CompanionOpportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadOpportunities() {
    try {
      const response = await fetch(`${API_BASE}/companion/opportunities`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAccept(oppId) {
    showToast('✓ Interest recorded — Live bookings coming soon!');
  }

  function handleDecline(oppId) {
    showToast('Opportunity declined');
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="text-slate-500">Loading opportunities...</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 bg-green-600 text-white">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Opportunities</h2>
          <p className="text-slate-600 mt-1">AI-matched booking requests in your area</p>
        </div>
        <button onClick={() => navigate('/companion')} className="text-slate-600 hover:text-slate-800">
          ← Dashboard
        </button>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <div className="font-semibold text-blue-900">Preview Mode</div>
            <div className="text-sm text-blue-800 mt-1">
              Live bookings coming soon! These are AI-matched requests based on your profile and availability.
            </div>
          </div>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-xl font-semibold mb-2">No opportunities yet</h3>
          <p className="text-slate-600 mb-4">Complete your checklist to start receiving AI-matched booking requests</p>
          <button
            onClick={() => navigate('/companion/checklist')}
            className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700"
          >
            Go to Checklist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-brand-teal transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{opp.serviceType}</h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full font-medium">
                      {opp.matchScore}% match
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>📍 {opp.location}</div>
                    <div>📅 {new Date(opp.windowStart).toLocaleDateString()} - {new Date(opp.windowEnd).toLocaleDateString()}</div>
                    <div>🐾 {opp.pets?.length || 1} pet(s)</div>
                    {opp.budget && <div>💰 Budget: £{(opp.budget / 100).toFixed(2)}/day</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-teal">£{(opp.estimatedEarnings / 100).toFixed(0)}</div>
                  <div className="text-xs text-slate-500">Est. earnings</div>
                </div>
              </div>

              {opp.matchReasons && opp.matchReasons.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                  <div className="text-xs font-semibold text-teal-900 mb-2">Why you're a great match:</div>
                  <ul className="text-sm text-teal-800 space-y-1">
                    {opp.matchReasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx}>✓ {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(opp.id)}
                  className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700 font-medium"
                >
                  Express Interest
                </button>
                <button
                  onClick={() => handleDecline(opp.id)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
