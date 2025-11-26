import React from 'react';
import { Link } from 'react-router-dom';

export function Cookies() {
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
          <h1 className="text-3xl font-bold text-slate-800">Cookie Policy</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Version: 1.0</span>
          <span>Last Updated: 26 November 2025</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Beta Release</span>
        </div>
        
        <p className="text-slate-700 mb-8">
          This Cookie Policy explains how Pawtimation uses cookies and similar technologies in accordance with the Privacy and Electronic Communications Regulations (PECR) and the UK General Data Protection Regulation (UK GDPR). This Policy should be read together with the Pawtimation{' '}
          <Link to="/legal/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. About Pawtimation</h2>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="mb-2"><span className="font-medium">Business Name:</span> Pawtimation</p>
              <p className="mb-2"><span className="font-medium">Legal Form:</span> Sole Trader</p>
              <p className="mb-2"><span className="font-medium">Owner:</span> Andrew James Beattie</p>
              <p className="mb-2"><span className="font-medium">Registered Business Address:</span></p>
              <p className="text-sm text-slate-600 ml-4">
                Lytchett House, 13 Freeland Park,<br />
                Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
              <p className="mt-2"><span className="font-medium">Email:</span> <a href="mailto:support@pawtimation.co.uk" className="text-teal-600 hover:underline">support@pawtimation.co.uk</a></p>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. What Are Cookies?</h2>
            <p className="mb-4">Cookies are small text files placed on your device when you access a website or web application. They help to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>maintain secure sessions</li>
              <li>enable essential functions</li>
              <li>remember preferences (where necessary)</li>
              <li>improve reliability</li>
            </ul>
            <p className="mt-4">Cookies may be set by Pawtimation ("first-party cookies") or by third-party service providers ("third-party cookies").</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Types of Cookies We Use</h2>
            <p className="mb-4 font-medium">Pawtimation uses only essential cookies by default.</p>
            <p className="mb-4">No advertising, profiling, or tracking cookies are used in the beta version.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.1 Essential Cookies</h3>
            <p className="mb-4">These cookies are strictly necessary for the operation of the platform. They enable:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>user authentication</li>
              <li>secure session management</li>
              <li>basic platform functionality</li>
              <li>prevention of fraudulent access</li>
              <li>request routing reliability</li>
            </ul>
            <p className="mb-4 text-sm text-slate-600">Essential cookies do not require user consent under PECR, but we disclose them for transparency.</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Purpose</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Storage Method</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2">pt_session</td><td className="px-4 py-2">Authentication session token</td><td className="px-4 py-2">Secure cookie</td><td className="px-4 py-2">24 hours</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">pt_client</td><td className="px-4 py-2">Client portal local state</td><td className="px-4 py-2">LocalStorage</td><td className="px-4 py-2">Until removed</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">pt_notifications</td><td className="px-4 py-2">Notification state</td><td className="px-4 py-2">LocalStorage</td><td className="px-4 py-2">Until removed</td></tr>
                  <tr><td className="px-4 py-2">_csrf (if applicable)</td><td className="px-4 py-2">Anti-CSRF token</td><td className="px-4 py-2">Cookie</td><td className="px-4 py-2">Session</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-600">These cookies contain no sensitive personal data and are used solely to operate the platform securely.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.2 Functional Preferences Cookies (Only If Enabled)</h3>
            <p>If a business enables certain advanced features in future updates, we may use cookies to remember user preferences. These features are currently disabled in beta.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.3 Analytics Cookies (Currently Disabled)</h3>
            <p>Pawtimation does not currently use analytics cookies. If analytics are enabled in future, users will be informed and consent will be obtained where required.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.4 No Advertising or Tracking Cookies</h3>
            <p className="mb-2">Pawtimation:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>does not use advertising cookies</li>
              <li>does not use behavioural profiling cookies</li>
              <li>does not share data with ad networks</li>
              <li>does not embed third-party trackers</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. LocalStorage and SessionStorage Use</h2>
            <p className="mb-4">Pawtimation uses local browser storage for certain low-risk, user-initiated features.</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Purpose</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2">pt_client</td><td className="px-4 py-2">Client portal UI state</td><td className="px-4 py-2">Essential</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">pt_notifications</td><td className="px-4 py-2">Notification preferences</td><td className="px-4 py-2">Essential</td></tr>
                  <tr><td className="px-4 py-2">pt_booking_statuses</td><td className="px-4 py-2">Tracking read/unread booking changes</td><td className="px-4 py-2">Essential</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-600">No personal data (such as email, name, address) is stored in browser storage.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Third-Party Cookies</h2>
            <p className="mb-4">Currently, no third-party cookies are set by Pawtimation.</p>
            <p>If in future analytics is enabled, or payment flow via Stripe Checkout is activated, a separate notice and consent mechanism will be applied.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. How to Manage Cookies</h2>
            <p className="mb-4">Although essential cookies cannot be disabled (as the platform will not function), users may manage other cookies through their browser settings.</p>
            <p className="mb-4">Most browsers allow you to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>block cookies</li>
              <li>delete cookies</li>
              <li>block third-party cookies</li>
              <li>clear storage</li>
              <li>enable strict tracking prevention modes</li>
            </ul>
            <p className="mb-2">Instructions are available at:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Chrome: support.google.com/chrome</li>
              <li>Mozilla Firefox: support.mozilla.org</li>
              <li>Safari: support.apple.com/safari</li>
              <li>Edge: support.microsoft.com/edge</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Changes to This Cookie Policy</h2>
            <p className="mb-4">Pawtimation may update this Cookie Policy to reflect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>regulatory changes</li>
              <li>new features</li>
              <li>changes to cookie use</li>
              <li>the introduction of analytics or optional features</li>
            </ul>
            <p className="mt-4">Material changes will be communicated through the platform.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Contact Us</h2>
            <p className="mb-4">For questions about this Cookie Policy:</p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="mb-2">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:support@pawtimation.co.uk" className="text-teal-600 hover:underline">support@pawtimation.co.uk</a>
              </p>
              <p>
                <span className="font-medium">Post:</span> Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
            </div>
          </section>
          
          <div className="border-t pt-6 mt-8 text-center text-sm text-slate-500">
            END OF COOKIE POLICY
          </div>
        </div>
      </div>
    </div>
  );
}
