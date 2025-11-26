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
          <h1 className="text-3xl font-bold text-slate-800">Beta Tester Addendum</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Version: 1.0</span>
          <span>Last Updated: 26 November 2025</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Beta Release Addendum</span>
        </div>
        
        <p className="text-slate-700 mb-4">
          This Addendum forms part of the Pawtimation{' '}
          <Link to="/legal/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
        </p>
        <p className="text-slate-700 mb-8">
          This Addendum applies to all users (businesses, staff, and clients) who access the Pawtimation platform during its beta testing phase. By using the platform, you agree to this Addendum in addition to the Terms of Service.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Purpose of the Beta Programme</h2>
            <p className="mb-4">The purpose of this beta programme is to allow early access to the Pawtimation platform so that users can:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>evaluate functionality</li>
              <li>identify issues, defects and usability concerns</li>
              <li>submit feedback to improve the final release version</li>
            </ul>
            <p className="mt-4 font-medium">The platform is provided at no charge during the beta period.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Pre-Release Status</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-amber-900">The beta version is not the final product.</p>
            </div>
            <p className="mb-4">This means:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>may contain defects, bugs or incomplete features</li>
              <li>may be updated frequently and without notice</li>
              <li>may experience downtime or instability</li>
              <li>may change significantly before full release</li>
              <li>may include temporary or disabled features</li>
              <li>does not include guaranteed service levels</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Users acknowledge that reliability may not meet production-grade standards.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Scope of Use</h2>
            <p className="mb-4">Beta users may use the platform:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>for real business operations, or</li>
              <li>for testing environments, training and evaluation</li>
            </ul>
            <p className="mt-4 mb-4">However, users accept that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>the Service may not operate continuously</li>
              <li>planned or unplanned outages may occur</li>
              <li>data entered during beta may be migrated, altered or removed</li>
            </ul>
            <p className="mt-4 font-medium text-red-700">The platform should not be used as a sole operational system for critical services during beta.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. No Fees and No Billing During Beta</h2>
            <p className="mb-4">No subscription fees or charges apply during the beta period.</p>
            <p>Stripe and payment functions are not fully enabled. No payments will be collected or processed.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Test Data and Real Data</h2>
            <p className="mb-4">Users may enter real customer, staff, and pet data into the platform.</p>
            <p className="mb-4">All such data is processed in accordance with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>the <Link to="/legal/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link></li>
              <li>the <Link to="/legal/data-protection" className="text-teal-600 hover:underline">Data Protection Statement</Link></li>
              <li>the DPA (where applicable)</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Pawtimation does not require users to use anonymised or synthetic data, but caution is recommended due to beta instability.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Data Integrity and Data Loss Risk</h2>
            <p className="mb-4">Users acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>data may change during updates</li>
              <li>database structures may be modified</li>
              <li>bugs may cause data inconsistency</li>
              <li>backups may not be fully comprehensive</li>
            </ul>
            <p className="mt-4 mb-4">Pawtimation will take reasonable steps to protect data, but no guarantee is provided during beta.</p>
            <p className="font-medium">Users should maintain their own backups of critical operational information.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Feedback and Reporting</h2>
            <p className="mb-4">Beta users agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>report defects, issues or errors</li>
              <li>provide feedback voluntarily</li>
              <li>allow Pawtimation to use anonymised feedback to improve the platform</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Feedback does not grant the user any ownership or intellectual property rights over improvements.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Disabled Features During Beta</h2>
            <p className="mb-4">During the beta phase, specific features are intentionally disabled for safety and compliance:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>mapping and routing</li>
              <li>geolocation</li>
              <li>GPS collection</li>
              <li>geocoding</li>
              <li>staff location tracking</li>
              <li>client location processing</li>
              <li>automated address-to-coordinate conversion</li>
              <li>in-platform payment processing</li>
              <li>any feature that uses coordinates, tiles or maps</li>
            </ul>
            <p className="mt-4 font-medium">These features are not to be activated unless explicitly communicated in a later release.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Liability During Beta</h2>
            <p className="mb-4">Given the pre-release nature of the platform:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>the Service is provided "as is" without warranties</li>
              <li>Pawtimation is not responsible for data loss, downtime, or errors</li>
              <li>Pawtimation limits its liability to zero financial compensation during beta</li>
              <li>Pawtimation is not responsible for any business interruption, missed bookings, or consequential losses</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Nothing in this Addendum excludes liability for fraud or death/personal injury caused by negligence.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Termination of Beta Access</h2>
            <p className="mb-4">Pawtimation may terminate or restrict beta access at any time in order to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>maintain security</li>
              <li>perform maintenance</li>
              <li>upgrade infrastructure</li>
              <li>modify or test new features</li>
              <li>protect platform integrity</li>
            </ul>
            <p className="mt-4">Users may cease participation in the beta at any time by closing their account.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. End of Beta and Transition to Full Release</h2>
            <p className="mb-4">At the conclusion of the beta period:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>user data may be migrated to the production environment</li>
              <li>some data may be archived or removed if required</li>
              <li>users will be informed of upcoming changes</li>
              <li>new Terms of Service and pricing may be introduced</li>
              <li>users may be asked to reaccept updated agreements</li>
            </ul>
            <p className="mt-4">Pawtimation will provide reasonable notice before major transitions.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Governing Law</h2>
            <p>This Addendum is governed by the laws of England and Wales. Disputes arising from or connected to this Addendum shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>
          
          <div className="border-t pt-6 mt-8 text-center text-sm text-slate-500">
            END OF BETA TESTER ADDENDUM
          </div>
        </div>
      </div>
    </div>
  );
}
