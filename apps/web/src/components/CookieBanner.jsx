import React, { useState, useEffect } from 'react';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if analytics key present or explicitly enabled
    const hasAnalytics = import.meta.env.VITE_POSTHOG_KEY;
    const bannerEnabled = import.meta.env.VITE_COOKIE_BANNER === '1';
    
    if (!hasAnalytics && !bannerEnabled) {
      return;
    }

    // Check if user has already consented
    const consent = localStorage.getItem('pt_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem('pt_cookie_consent', 'accepted');
    setShow(false);
  }

  function handleReject() {
    localStorage.setItem('pt_cookie_consent', 'rejected');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-lg z-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">We use cookies</h3>
          <p className="text-sm text-slate-600">
            We use essential cookies to make our site work. With your consent, we may also use analytics cookies to improve your experience.{' '}
            <a href="#/legal/cookies" className="text-brand-teal hover:underline">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            Essential only
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors text-sm font-medium"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
