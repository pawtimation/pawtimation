import React from 'react';
import { Link } from 'react-router-dom';

export function BetaAgreement() {
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
          <h1 className="text-3xl font-bold text-slate-800">Beta User Agreement</h1>
        </div>
        
        <p className="text-sm text-slate-500 mb-8">Last Updated: 26 November 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            This Beta User Agreement ("Addendum") supplements the Pawtimation{' '}
            <Link to="/legal/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
            By participating in the Pawtimation Beta Programme, you agree to the following additional terms.
          </p>
          
          <hr className="my-8 border-slate-200" />
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Beta Programme Overview</h2>
            <p>
              The Pawtimation Beta Programme provides early access to our platform before general availability. 
              Beta users help us refine features, identify bugs, and improve the overall experience.
            </p>
            <p className="mt-4">
              During the beta period, you will have access to core CRM features including client management, 
              booking, staff scheduling, and invoicing.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Beta Period</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The beta period runs for a defined duration communicated at signup</li>
              <li>We may extend or end the beta at our discretion</li>
              <li>You will receive notice before transitioning to paid plans</li>
              <li>No payment is required during the beta period</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Beta User Responsibilities</h2>
            <p>As a beta user, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide constructive feedback when requested</li>
              <li>Report bugs, issues, or unexpected behaviour</li>
              <li>Not rely solely on Pawtimation for critical business operations during beta</li>
              <li>Maintain backup records of important data</li>
              <li>Respect the confidentiality of beta features not yet publicly announced</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Service Limitations</h2>
            <p>During the beta period:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Features may change, be added, or removed without notice</li>
              <li>Service interruptions may occur for updates or maintenance</li>
              <li>Performance and reliability may vary</li>
              <li>Support response times may be longer than post-launch</li>
              <li>Data migration to final version is provided on a best-effort basis</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Data During Beta</h2>
            <p>Your data during the beta:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Is stored securely using the same protections as our production systems</li>
              <li>Remains your property and subject to our{' '}
                <Link to="/legal/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>
              </li>
              <li>May be used anonymously to improve the platform</li>
              <li>Will be preserved when transitioning to paid plans</li>
              <li>Can be exported or deleted upon request</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Feedback and Intellectual Property</h2>
            <p>
              Feedback you provide during the beta (bug reports, feature suggestions, usability observations) 
              may be used by Pawtimation to improve the platform. You grant us a non-exclusive, royalty-free 
              licence to use such feedback.
            </p>
            <p className="mt-4">
              This does not affect your ownership of your business data or content.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Transition to Paid Plans</h2>
            <p>When the beta period ends:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You will be notified at least 14 days before the transition</li>
              <li>Beta users may receive special pricing or extended trials</li>
              <li>Your data and settings will be preserved</li>
              <li>You can choose to continue with a paid plan or export your data</li>
              <li>Accounts not converted within 30 days may be suspended</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Termination</h2>
            <p>Either party may end beta participation at any time:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may stop using the service and request data deletion</li>
              <li>We may remove beta access for violations of these terms</li>
              <li>Upon termination, you may request a data export</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Disclaimer</h2>
            <p>
              The beta service is provided "as is" without warranty. We do not guarantee uptime, 
              data preservation, or feature availability. Beta users acknowledge this is a 
              testing environment.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Governing Terms</h2>
            <p>
              This Addendum is governed by and supplements the main{' '}
              <Link to="/legal/terms" className="text-teal-600 hover:underline">Terms of Service</Link>. 
              In case of conflict, this Addendum takes precedence for beta-related matters.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Contact</h2>
            <p>
              For beta programme questions:{' '}
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
