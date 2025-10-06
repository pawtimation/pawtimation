import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

function getSitterId() {
  try {
    const u = JSON.parse(localStorage.getItem('pt_user') || '{}');
    return u.sitterId || 's_demo_companion';
  } catch {
    return 's_demo_companion';
  }
}

export function CompanionBio() {
  const navigate = useNavigate();
  const id = getSitterId();
  const [sitter, setSitter] = useState(null);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch(`${API_BASE}/sitters/${id}`);
      const data = await response.json();
      setSitter(data.sitter);
      setBio(data.sitter.bio || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  async function saveBio() {
    if (bio.length < 80) {
      showToast('Bio must be at least 80 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await fetch(`${API_BASE}/sitters/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio })
      });

      showToast('Bio saved successfully!', 'success');
      setTimeout(() => navigate('/companion/checklist'), 1500);
    } catch (err) {
      showToast('Failed to save bio', 'error');
    } finally {
      setSaving(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (!sitter) return <div className="flex justify-center py-12"><div className="text-slate-500">Loading...</div></div>;

  const charCount = bio.length;
  const isValid = charCount >= 80;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-rose-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Write Your Bio</h2>
          <p className="text-slate-600 mt-1">Tell pet owners about yourself (minimum 80 characters)</p>
        </div>
        <button onClick={() => navigate('/companion/checklist')} className="text-slate-600 hover:text-slate-800">
          ← Back to Checklist
        </button>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            About You
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
            placeholder="Tell pet owners about your experience with pets, your personality, and why you love caring for animals..."
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className={`font-medium ${isValid ? 'text-emerald-600' : 'text-slate-500'}`}>
              {charCount} / 80 characters {isValid && '✓'}
            </span>
            {!isValid && <span className="text-rose-600">Need {80 - charCount} more characters</span>}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>💡 Tips for a great bio:</strong>
          <ul className="mt-2 space-y-1 ml-4 list-disc">
            <li>Mention your experience with different types of pets</li>
            <li>Share what makes you passionate about pet care</li>
            <li>Include any relevant qualifications or training</li>
            <li>Keep it friendly and genuine</li>
            <li>If you have pets yourself, mention them!</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveBio}
            disabled={saving || !isValid}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
          <button
            onClick={() => navigate('/companion/checklist')}
            className="px-6 py-3 bg-slate-200 rounded-lg hover:bg-slate-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
