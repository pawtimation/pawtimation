import React, { useState } from 'react';
import { adminApi } from '../lib/auth';

export function InviteClientModal({ isOpen, onClose, business }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setName('');
    setInviteData(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const res = await adminApi('/clients/invite', {
        method: 'POST',
        body: JSON.stringify({ email, name })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invite');
      }

      setInviteData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteData?.inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteData.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Invite New Client
            </h2>
            <p className="text-sm text-slate-600">
              Generate an invite link to onboard a new client to your business.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg mb-6 bg-red-50 text-red-800">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!inviteData ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 outline-none"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 outline-none"
                disabled={isGenerating}
              />
              <p className="text-xs text-slate-500 mt-1">
                The client will use this email to access their account.
              </p>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 text-green-800">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-medium">Invite link generated!</p>
              </div>
              <p className="text-sm">Share this link with {name || email} to complete their registration.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteData.inviteUrl}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This link will expire in 7 days. The client can use it to create their account.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => {
                  setInviteData(null);
                  setEmail('');
                  setName('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Invite Another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
