import React from 'react';

export function LegalPrivacy({ onBack }) {
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

      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-700">
            We collect information you provide directly (name, email, pet details), automatically (usage data, device info), and from third parties (payment processors, identity verification).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Data</h2>
          <p className="text-slate-700">
            Your data enables booking management, companion matching (including AI-powered recommendations), payment processing, safety features (GPS check-in/out), and platform improvements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Sharing</h2>
          <p className="text-slate-700">
            We share necessary information with Pet Companions for bookings, payment processors (Stripe), and analytics providers (when enabled). We never sell your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Storage & Security</h2>
          <p className="text-slate-700">
            Data is stored securely with encryption. Some data is stored locally in your browser for performance. We implement industry-standard security measures.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Your Rights (UK GDPR)</h2>
          <p className="text-slate-700">
            You have the right to access, rectify, erase, restrict processing, data portability, and object to processing. Contact us to exercise these rights or use the "Download my data" feature in Account settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Cookies & Tracking</h2>
          <p className="text-slate-700">
            We use essential cookies for functionality and optional analytics cookies (with your consent). See our <a href="#/legal/cookies" className="text-brand-teal hover:underline">Cookie Policy</a> for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact</h2>
          <p className="text-slate-700">
            For privacy concerns, contact Andy@aj-beattie.com
          </p>
        </section>

        <p className="text-sm text-slate-500 mt-12">
          Last updated: October 2025
        </p>
      </div>
    </div>
  );
}
