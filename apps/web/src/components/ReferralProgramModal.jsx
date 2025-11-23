import { useState } from 'react';

export function ReferralProgramModal({ isOpen, onClose, business }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralLink = business?.referralCode 
    ? `${window.location.origin}/beta?ref=${business.referralCode}`
    : 'Generating...';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const referralStats = {
    totalReferred: 0,
    activeReferrals: 0,
    commissionEarned: 0,
    nextPayout: 0
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Referral Program</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Earn 10% Monthly Commission</h3>
                <p className="text-sm text-slate-700">
                  Every business you refer earns you <strong>10% recurring commission</strong> for as long as they stay subscribed.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Your Unique Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Share Your Link</h4>
                  <p className="text-sm text-slate-600">Share your unique referral link with other pet-care businesses you know.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">They Sign Up</h4>
                  <p className="text-sm text-slate-600">When they apply for beta access using your link, they're automatically tracked as your referral.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Earn Commission</h4>
                  <p className="text-sm text-slate-600">Once they become a paying customer, you earn 10% of their monthly subscription fee. Forever.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Referral Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-900">{referralStats.totalReferred}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Active Paying</p>
                <p className="text-2xl font-bold text-slate-900">{referralStats.activeReferrals}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Earned to Date</p>
                <p className="text-2xl font-bold text-teal-600">£{(referralStats.commissionEarned / 100).toFixed(2)}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Next Payout</p>
                <p className="text-2xl font-bold text-teal-600">£{(referralStats.nextPayout / 100).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Payouts are processed monthly. Contact support for payment details.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold text-amber-900 text-sm mb-1">No Limits. No Expiry.</h4>
                <p className="text-xs text-amber-800">
                  There's no cap on how many businesses you can refer or how much you can earn. Your commission continues as long as your referrals stay subscribed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
