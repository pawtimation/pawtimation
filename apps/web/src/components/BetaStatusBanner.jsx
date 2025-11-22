import React, { useState, useEffect } from 'react';

export function BetaStatusBanner({ business }) {
  if (!business) return null;

  const now = new Date();
  const betaEndsAt = business.betaEndsAt ? new Date(business.betaEndsAt) : null;
  const trialEndsAt = business.trialEndsAt ? new Date(business.trialEndsAt) : null;

  const isBeta = business.planStatus === 'BETA';
  const isTrial = business.planStatus === 'FREE_TRIAL';
  const isPaid = business.planStatus === 'PAID';
  
  // Beta ending soon (within 7 days)
  if (isBeta && betaEndsAt) {
    const daysLeft = Math.ceil((betaEndsAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">Beta Period Ended</h3>
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
        </div>
      );
    } else if (daysLeft <= 7) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-yellow-800 font-semibold mb-1">Beta Ending Soon</h3>
              <p className="text-yellow-700 mb-2">
                Your beta access ends in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> on {betaEndsAt.toLocaleDateString()}.
              </p>
              <p className="text-yellow-700 text-sm">
                Contact us to activate a paid plan and continue using Pawtimation.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Trial ending soon (within 7 days)
  if (isTrial && trialEndsAt) {
    const daysLeft = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-1">Free Trial Ended</h3>
              <p className="text-red-700 mb-3">
                Your {business.trialDays || 30}-day free trial has ended. Activate a paid plan to continue using Pawtimation.
              </p>
              <a
                href="mailto:hello@pawtimation.co.uk?subject=Activate Paid Plan"
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Activate Paid Plan
              </a>
            </div>
          </div>
        </div>
      );
    } else if (daysLeft <= 7) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-800 font-semibold mb-1">Trial Ending Soon</h3>
              <p className="text-blue-700 mb-2">
                Your free trial ends in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> on {trialEndsAt.toLocaleDateString()}.
              </p>
              <p className="text-blue-700 text-sm">
                Contact us to discuss pricing and continue using Pawtimation.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
