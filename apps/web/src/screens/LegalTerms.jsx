import React from 'react';

export function LegalTerms({ onBack }) {
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

      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose prose-slate max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-700">
            By accessing and using Pawtimation ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">2. Service Description</h2>
          <p className="text-slate-700">
            Pawtimation is a UK-focused pet care booking platform connecting pet owners with trusted friends or professional Pet Companions. We provide a marketplace for pet care services but do not directly provide pet care services ourselves.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">3. User Responsibilities</h2>
          <p className="text-slate-700">
            Users must provide accurate information, maintain account security, and comply with UK animal welfare laws including the Animal Welfare Act 2006.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">4. Payment Terms</h2>
          <p className="text-slate-700">
            Payments are processed through Stripe Connect with escrow protection. Platform commission applies to marketplace bookings. BNPL options available via approved providers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">5. Cancellation Policy</h2>
          <p className="text-slate-700">
            Cancellations follow a tiered forfeit system based on notice period. See individual companion profiles for specific policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">6. Liability</h2>
          <p className="text-slate-700">
            Pawtimation acts as a platform facilitator. Pet Companions are independent contractors. Users agree to follow platform safety guidelines and incident reporting procedures.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mt-8 mb-4">7. Contact</h2>
          <p className="text-slate-700">
            For questions about these terms, contact us at Andy@aj-beattie.com
          </p>
        </section>

        <p className="text-sm text-slate-500 mt-12">
          Last updated: October 2025
        </p>
      </div>
    </div>
  );
}
