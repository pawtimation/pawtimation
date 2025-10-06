import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';
import { ImageUpload } from '../components/ImageUpload.jsx';

function getSitterId() {
  try {
    const u = JSON.parse(localStorage.getItem('pt_user') || '{}');
    return u.sitterId || 's_demo_companion';
  } catch {
    return 's_demo_companion';
  }
}

export function CompanionPhoto() {
  const navigate = useNavigate();
  const id = getSitterId();
  const [sitter, setSitter] = useState(null);
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
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  async function savePhoto() {
    if (!sitter?.avatarUrl) {
      showToast('Please upload a photo first', 'error');
      return;
    }

    setSaving(true);
    try {
      await fetch(`${API_BASE}/sitters/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: sitter.avatarUrl })
      });

      showToast('Photo saved successfully!', 'success');
      setTimeout(() => navigate('/companion/checklist'), 1500);
    } catch (err) {
      showToast('Failed to save photo', 'error');
    } finally {
      setSaving(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (!sitter) return <div className="flex justify-center py-12"><div className="text-slate-500">Loading...</div></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-rose-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Upload Profile Photo</h2>
          <p className="text-slate-600 mt-1">Add a friendly profile picture so pet owners can see you</p>
        </div>
        <button onClick={() => navigate('/companion/checklist')} className="text-slate-600 hover:text-slate-800">
          ← Back to Checklist
        </button>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-8">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            {sitter.avatarUrl ? (
              <img 
                src={sitter.avatarUrl} 
                alt="Profile" 
                className="w-48 h-48 rounded-full object-cover mx-auto border-4 border-emerald-200"
              />
            ) : (
              <div className="w-48 h-48 rounded-full bg-slate-100 mx-auto flex items-center justify-center border-4 border-slate-200">
                <span className="text-6xl text-slate-400">📷</span>
              </div>
            )}
          </div>

          <div>
            <ImageUpload
              currentImageUrl={sitter.avatarUrl}
              onImageUploaded={(url) => setSitter({ ...sitter, avatarUrl: url })}
              label={sitter.avatarUrl ? "Change Photo" : "Upload Photo"}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>💡 Tips for a great profile photo:</strong>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>Use a clear, recent photo of yourself</li>
              <li>Smile and look friendly!</li>
              <li>Good lighting helps pet owners trust you</li>
              <li>Bonus: Include your own pet in the photo</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={savePhoto}
              disabled={saving || !sitter.avatarUrl}
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
    </div>
  );
}
