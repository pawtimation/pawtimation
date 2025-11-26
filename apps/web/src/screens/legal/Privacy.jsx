import React from 'react';
import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C10.34 2 9 3.34 9 5c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3zm7 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM5 11c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm7 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <h1 className="text-3xl font-bold text-slate-800">Privacy Policy</h1>
        </div>
        
        <p className="text-sm text-slate-500 mb-8">Last Updated: 26 November 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Overview</h2>
            <p>
              Pawtimation processes personal data for the purpose of allowing pet-care businesses to manage their operations.
            </p>
            <p className="mt-4">
              We comply with the <span className="font-medium">UK GDPR</span> and the <span className="font-medium">Data Protection Act 2018</span>.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Data We Collect</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name</li>
              <li>Email</li>
              <li>Role (Admin / Staff / Client)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Business Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Business name</li>
              <li>Services</li>
              <li>Staff and client associations</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Operational Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bookings</li>
              <li>Dog profiles</li>
              <li>Addresses required for job fulfilment</li>
              <li>Messages between business and clients</li>
              <li>Staff availability</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Payment Data</h3>
            <p>
              Handled exclusively by Stripe.
              <br />
              Pawtimation stores only non-sensitive metadata.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. How We Use Data</h2>
            <p>We use data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide the Pawtimation service</li>
              <li>Allow scheduling, job assignment and invoicing</li>
              <li>Enable communication</li>
              <li>Improve platform functionality</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Legal Basis</h2>
            <p>We process data under:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contractual necessity</li>
              <li>Legitimate interest</li>
              <li>User consent (where applicable)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Data Sharing</h2>
            <p>We only share data with essential service providers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><span className="font-medium">Stripe</span> (payment processing) — US-based</li>
              <li><span className="font-medium">Resend</span> (transactional emails) — US-based</li>
              <li><span className="font-medium">Replit/Neon</span> (hosting and database) — US-based</li>
              <li><span className="font-medium">MapTiler</span> (map tiles for location services) — EU-based</li>
              <li><span className="font-medium">OpenRouteService</span> (route calculation) — EU-based</li>
            </ul>
            <p className="mt-4 font-medium">We never sell personal data.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data persists while an account remains active</li>
              <li>Backups may be retained for security and continuity</li>
            </ul>
            <p className="mt-4">Users may request deletion via email.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Security</h2>
            <p>We use:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted connections</li>
              <li>Access controls</li>
              <li>Audit and error logging</li>
            </ul>
            <p className="mt-4">
              No system is 100% secure, but we follow best practices for a SaaS of this scale.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Rights</h2>
            <p>Users may:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access personal data</li>
              <li>Request correction or deletion</li>
              <li>Object to certain processing</li>
            </ul>
            <p className="mt-4">
              Requests:{' '}
              <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline font-medium">
                pawtimation.uk@gmail.com
              </a>
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. International Data Transfers</h2>
            <p>
              Some of our service providers operate outside the UK/EEA. Where we transfer personal data internationally, we ensure appropriate safeguards are in place, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Standard Contractual Clauses (SCCs) approved by the UK ICO</li>
              <li>Transfers to countries with adequate data protection laws</li>
            </ul>
            <p className="mt-4">
              Our hosting infrastructure (Replit/Neon) is located in the United States.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Complaints</h2>
            <p>
              If you are unhappy with how we handle your data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO):
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Website: <a href="https://ico.org.uk" className="text-teal-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
              <li>Phone: 0303 123 1113</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Contact</h2>
            <p>
              Questions or concerns?
              <br />
              <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline font-medium">
                pawtimation.uk@gmail.com
              </a>
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Andrew James Beattie / Pawtimation<br />
              Lytchett House, 13 Freeland Park<br />
              Wareham Road, Poole<br />
              Dorset BH16 6FA<br />
              United Kingdom
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
