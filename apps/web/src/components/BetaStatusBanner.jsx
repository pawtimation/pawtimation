import React, { useState, useEffect } from 'react';

export function BetaStatusBanner({ business }) {
  const [dismissed, setDismissed] = useState({});
  
  // Guard against missing or invalid business data
  if (!business || typeof business !== 'object') return null;
  if (!business.planStatus) return null;

  const now = new Date();
  const betaEndsAt = business.betaEndsAt ? new Date(business.betaEndsAt) : null;
  const trialEndsAt = business.trialEndsAt ? new Date(business.trialEndsAt) : null;

  const isBeta = business.planStatus === 'BETA';
  const isTrial = business.planStatus === 'FREE_TRIAL';
  const isPaid = business.planStatus === 'PAID';
  const isFoundingMember = business.planType === 'FOUNDING_MEMBER';
  
  // Load dismissed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedBanners');
    if (stored) {
      try {
        setDismissed(JSON.parse(stored));
      } catch (e) {
        setDismissed({});
      }
    }
  }, []);
  
  const handleDismiss = (bannerType) => {
    const newDismissed = { ...dismissed, [bannerType]: Date.now() };
    setDismissed(newDismissed);
    localStorage.setItem('dismissedBanners', JSON.stringify(newDismissed));
  };
  
  // Check if a banner was dismissed within the last hour
  const isDismissed = (bannerType) => {
    const dismissedTime = dismissed[bannerType];
    if (!dismissedTime) return false;
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - dismissedTime) < oneHour;
  };
  
  // Founding Member status banner (always shown unless dismissed)
  if (isFoundingMember && !isDismissed('founding-member')) {
    const billingStart = business.billingStartDate ? new Date(business.billingStartDate) : null;
    const lockedPrice = business.lockedPrice ? (business.lockedPrice / 100).toFixed(2) : '19.00';
    
    return (
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-l-4 border-amber-500 p-4 mb-6 shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
              <span className="text-white text-xl">⭐</span>
            </div>
            <div className="flex-1">
              <h3 className="text-amber-900 font-bold text-lg mb-1">You're a Founding Member!</h3>
              <p className="text-amber-800 mb-2">
                As one of our first beta testers, you get <strong>lifetime access at £{lockedPrice}/month</strong>, permanently locked in.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-amber-800">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No price increases. Ever.</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No limits on staff, clients or bookings</span>
                </div>
                {billingStart && (
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Billing starts: {billingStart.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-amber-700 mt-3 italic">
                Thank you for helping shape Pawtimation!
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDismiss('founding-member')}
            className="text-amber-500 hover:text-amber-700 ml-4"
            title="Dismiss for 1 hour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  
  // Beta ending soon (within 7 days)
  if (isBeta && betaEndsAt) {
    const daysLeft = Math.ceil((betaEndsAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0 && !isDismissed('beta-ended')) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Your Pawtimation Beta Has Ended</h3>
                <p className="text-red-700 mb-3">
                  Your beta access has ended. To continue using Pawtimation, please activate a paid plan.
                </p>
                <a
                  href="mailto:hello@pawtimation.co.uk?subject=Activate Paid Plan"
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Contact Us to Activate
                </a>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('beta-ended')}
              className="text-red-500 hover:text-red-700 ml-4"
              title="Dismiss for 1 hour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    } else if (daysLeft > 0 && daysLeft <= 7 && !isDismissed('beta-warning')) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-yellow-800 font-semibold mb-1">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</h3>
                <p className="text-yellow-700 mb-2">
                  Your beta access ends on {betaEndsAt.toLocaleDateString()}.
                </p>
                <p className="text-yellow-700 text-sm">
                  Contact us to activate a paid plan and continue using Pawtimation.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('beta-warning')}
              className="text-yellow-500 hover:text-yellow-700 ml-4"
              title="Dismiss for 1 hour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }
  }

  // Trial ending soon (within 7 days)
  if (isTrial && trialEndsAt) {
    const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0 && !isDismissed('trial-ended')) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Your Pawtimation Free Trial Has Ended</h3>
                <p className="text-red-700 mb-3">
                  Your {business.trialDays || 30}-day free trial has ended. Choose a paid plan to continue using Pawtimation.
                </p>
                <a
                  href="mailto:hello@pawtimation.co.uk?subject=Activate Paid Plan"
                  className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Choose a Plan
                </a>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('trial-ended')}
              className="text-red-500 hover:text-red-700 ml-4"
              title="Dismiss for 1 hour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    } else if (daysLeft > 0 && daysLeft <= 7 && !isDismissed('trial-warning')) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-1">
              <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-yellow-800 font-semibold mb-1">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left of free trial</h3>
                <p className="text-yellow-700 mb-2">
                  Your free trial ends on {trialEndsAt.toLocaleDateString()}.
                </p>
                <p className="text-yellow-700 text-sm">
                  Contact us to discuss pricing and continue using Pawtimation.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss('trial-warning')}
              className="text-yellow-500 hover:text-yellow-700 ml-4"
              title="Dismiss for 1 hour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }
  }

  return null;
}
