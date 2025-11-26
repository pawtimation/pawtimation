import React from 'react';
import { Link } from 'react-router-dom';

export function Terms() {
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
          <h1 className="text-3xl font-bold text-slate-800">Terms of Service</h1>
        </div>
        
        <p className="text-sm text-slate-500 mb-8">Last Updated: 26 November 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            Welcome to <span className="font-semibold">Pawtimation</span>.
            <br />
            These Terms govern your access to and use of the Pawtimation CRM platform ("Service").
          </p>
          
          <p className="font-medium">By using Pawtimation, you agree to these Terms.</p>
          
          <hr className="my-8 border-slate-200" />
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Who We Are</h2>
            <p>
              Pawtimation is a software service created and operated by Andrew James Beattie ("we", "us"). The service provides tools for dog walking and pet-care businesses including scheduling, staff management, invoicing and communication.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Registered Address:<br />
              Lytchett House, 13 Freeland Park<br />
              Wareham Road, Poole<br />
              Dorset BH16 6FA<br />
              United Kingdom
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Eligibility</h2>
            <p>You must be:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>At least 18 years old</li>
              <li>A business owner, staff member, or approved client of a business using Pawtimation</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Your Account</h2>
            <p>Users are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Keeping login details secure</li>
              <li>Providing accurate information</li>
              <li>Ensuring activity via their account complies with these Terms</li>
            </ul>
            <p className="mt-4">
              We may suspend or disable accounts that engage in misuse, fraud, or interfere with system security.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Use of the Service</h2>
            <p>Businesses may use Pawtimation for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Managing bookings and schedules</li>
              <li>Handling staff and client data</li>
              <li>Generating invoices and documents</li>
            </ul>
            <p className="mt-4 font-medium">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reverse engineer the platform</li>
              <li>Access the system without authorisation</li>
              <li>Upload harmful content</li>
              <li>Misuse personal data</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Data & Privacy</h2>
            <p>
              We handle user data according to our <Link to="/legal/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link> and <Link to="/legal/data-protection" className="text-teal-600 hover:underline">GDPR Statement</Link>.
            </p>
            <p className="mt-4">
              Businesses are responsible for informing their own clients about data usage consistent with GDPR and local laws.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Availability</h2>
            <p>We aim to provide continuous service but do not guarantee:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uninterrupted uptime</li>
              <li>Zero bugs</li>
              <li>Compatibility with every device or browser</li>
            </ul>
            <p className="mt-4">Scheduled or emergency maintenance may occur.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Billing & Payments</h2>
            <p>
              Some businesses may use Stripe through Pawtimation to take payments. Stripe processes payments securely; Pawtimation does not store card information.
            </p>
            <p className="mt-4">
              Businesses remain responsible for the accuracy of invoices they issue.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Liability</h2>
            <p>To the fullest extent permitted by law:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pawtimation is provided "as is"</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Your responsibility is to verify the correctness of bookings, financial data, and communications</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Termination</h2>
            <p>You may stop using the service at any time.</p>
            <p className="mt-2">We may terminate access for breach of Terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Changes</h2>
            <p>We may update these Terms. Continued use means acceptance.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Contact</h2>
            <p>
              For questions:{' '}
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
