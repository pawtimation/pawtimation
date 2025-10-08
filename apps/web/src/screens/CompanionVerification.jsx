import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';
import { useToast } from '../components/Toast';

function getSitterId() {
  try {
    const u = JSON.parse(localStorage.getItem('pt_user') || '{}');
    return u.sitterId || 's_demo_companion';
  } catch {
    return 's_demo_companion';
  }
}

export function CompanionVerification() {
  const navigate = useNavigate();
  const id = getSitterId();
  const [idDocument, setIdDocument] = useState(null);
  const [insuranceDocument, setInsuranceDocument] = useState(null);
  const [idPreview, setIdPreview] = useState('');
  const [insurancePreview, setInsurancePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  async function handleFileUpload(file, type) {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be under 10MB', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPG, PNG, or PDF files allowed', 'error');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        
        if (type === 'id') {
          setIdDocument(data.url);
          setIdPreview(data.url);
        } else {
          setInsuranceDocument(data.url);
          setInsurancePreview(data.url);
        }

        showToast(`${type === 'id' ? 'ID' : 'Insurance'} document uploaded!`, 'success');
      } else {
        showToast('Upload failed', 'error');
      }
    } catch (err) {
      showToast('Upload failed', 'error');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  async function saveVerification() {
    if (!idDocument && !insuranceDocument) {
      showToast('Please upload at least one document', 'error');
      return;
    }

    try {
      await fetch(`${API_BASE}/sitters/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationDocs: {
            idDocument,
            insuranceDocument,
            status: 'pending_review',
            uploadedAt: new Date().toISOString()
          }
        })
      });

      showToast('Documents submitted for review!', 'success');
      setTimeout(() => navigate('/companion/checklist'), 1500);
    } catch (err) {
      showToast('Failed to save documents', 'error');
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">ID & Insurance Verification</h2>
          <p className="text-slate-600 mt-1">Upload verification documents to become a Pro companion</p>
        </div>
        <button onClick={() => navigate('/companion/checklist')} className="text-[color:var(--brand)] font-medium hover:text-[color:var(--brandDark)] transition-colors">
          ← Back
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl">ℹ️</span>
        <div className="flex-1 text-sm text-amber-800">
          <strong>Optional Now, Required for Pro Status</strong>
          <p className="mt-1">You can complete your profile without these documents, but you'll need them to unlock Pro companion status with higher visibility and premium features.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Photo ID</h3>
            <p className="text-sm text-slate-600">Passport, driving license, or national ID card</p>
          </div>

          {idPreview ? (
            <div className="relative">
              {idPreview.endsWith('.pdf') ? (
                <div className="bg-slate-100 rounded-lg p-8 text-center">
                  <span className="text-6xl">📄</span>
                  <p className="text-sm text-slate-600 mt-2">PDF uploaded</p>
                </div>
              ) : (
                <img src={idPreview} alt="ID" className="w-full rounded-lg border-2 border-slate-200" />
              )}
              <button
                onClick={() => {
                  setIdDocument(null);
                  setIdPreview('');
                }}
                className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition">
              <span className="text-5xl mb-3">📸</span>
              <span className="text-sm font-medium text-slate-700">Click to upload ID</span>
              <span className="text-xs text-slate-500 mt-1">JPG, PNG or PDF (max 10MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e.target.files[0], 'id')}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Insurance Document</h3>
            <p className="text-sm text-slate-600">Pet care liability insurance certificate</p>
          </div>

          {insurancePreview ? (
            <div className="relative">
              {insurancePreview.endsWith('.pdf') ? (
                <div className="bg-slate-100 rounded-lg p-8 text-center">
                  <span className="text-6xl">📄</span>
                  <p className="text-sm text-slate-600 mt-2">PDF uploaded</p>
                </div>
              ) : (
                <img src={insurancePreview} alt="Insurance" className="w-full rounded-lg border-2 border-slate-200" />
              )}
              <button
                onClick={() => {
                  setInsuranceDocument(null);
                  setInsurancePreview('');
                }}
                className="absolute top-2 right-2 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition">
              <span className="text-5xl mb-3">📋</span>
              <span className="text-sm font-medium text-slate-700">Click to upload Insurance</span>
              <span className="text-xs text-slate-500 mt-1">JPG, PNG or PDF (max 10MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e.target.files[0], 'insurance')}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>🔒 Security & Privacy:</strong>
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          <li>All documents are encrypted and stored securely</li>
          <li>Only Pawtimation verification team can access these files</li>
          <li>Documents are never shared with pet owners</li>
          <li>We comply with UK GDPR data protection regulations</li>
        </ul>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold mb-3">What happens next?</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <p>Upload your ID and insurance documents (optional for now)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <p>Our verification team reviews your documents within 24-48 hours</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <p>Once approved, you'll receive a "Verified Pro" badge on your profile</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">4️⃣</span>
            <p>Unlock premium features and higher search visibility!</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {(idDocument || insuranceDocument) && (
          <button
            onClick={saveVerification}
            disabled={uploading}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
          >
            Submit for Review
          </button>
        )}
        <button
          onClick={() => navigate('/companion/checklist')}
          className="px-6 py-3 bg-slate-200 rounded-lg hover:bg-slate-300 font-medium"
        >
          {(idDocument || insuranceDocument) ? 'Save & Continue Later' : 'Skip for now'}
        </button>
      </div>

      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-slate-700">Uploading document...</p>
          </div>
        </div>
      )}
    </div>
  );
}
