import React from 'react';

export function LegalCookies({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button 
        onClick={onBack} 
        className="mb-6 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded transition-colors inline-flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">1. What Are Cookies</h2>
          <p className="text-slate-700">
            Cookies are small text files stored on your device that help us provide and improve our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">2. Essential Cookies</h2>
          <p className="text-slate-700">
            These cookies are necessary for the platform to function. They include:
          </p>
          <ul className="list-disc list-inside text-slate-700 mt-2 space-y-1">
            <li><code className="text-sm bg-slate-100 px-1 rounded">pt_user</code> - Authentication state</li>
            <li><code className="text-sm bg-slate-100 px-1 rounded">pt_token</code> - Session security</li>
            <li><code className="text-sm bg-slate-100 px-1 rounded">pt_plan</code> - Subscription tier</li>
            <li><code className="text-sm bg-slate-100 px-1 rounded">pt_prefs</code> - User preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">3. Analytics Cookies (Optional)</h2>
          <p className="text-slate-700">
            When enabled, we use analytics cookies to understand how users interact with the platform. These help us improve the user experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Managing Cookies</h2>
          <p className="text-slate-700">
            You can manage cookie preferences through the banner when first visiting the site, or through your browser settings. Note that disabling essential cookies may limit platform functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Third-Party Cookies</h2>
          <p className="text-slate-700">
            We use Stripe for payments (their cookies apply per their privacy policy) and may use analytics providers if you've consented.
          </p>
        </section>

        <p className="text-sm text-slate-500 mt-12">
          Last updated: October 2025
        </p>
      </div>
    </div>
  );
}
