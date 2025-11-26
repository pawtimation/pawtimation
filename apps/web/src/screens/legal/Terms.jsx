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
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Version: 1.0</span>
          <span>Last Updated: 26 November 2025</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Beta Release</span>
        </div>
        
        <p className="text-slate-700 mb-4">
          These Terms of Service ("Terms") govern your use of the Pawtimation platform, website, and services ("Service"). By creating an account or using the Service, you agree to be bound by these Terms.
        </p>
        <p className="font-medium text-slate-800 mb-8">
          If you do not agree with these Terms, you must not use Pawtimation.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. About Pawtimation</h2>
            <p className="mb-4">Pawtimation is operated by:</p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-medium">Andrew James Beattie</p>
              <p className="text-sm text-slate-600">Trading as Pawtimation (sole trader)</p>
              <p className="text-sm text-slate-600 mt-2">
                <span className="font-medium">Registered Business Address:</span><br />
                Lytchett House, 13 Freeland Park,<br />
                Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
              <p className="text-sm mt-2">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:support@pawtimation.co.uk" className="text-teal-600 hover:underline">support@pawtimation.co.uk</a>
              </p>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Eligibility</h2>
            <p className="mb-4">To use Pawtimation, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>be at least 18 years of age;</li>
              <li>be legally able to enter into a binding contract; and</li>
              <li>use the Service only for lawful business purposes.</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Pawtimation may suspend or terminate accounts that violate eligibility requirements.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Nature of the Service</h2>
            <p className="mb-4">Pawtimation is a software-as-a-service (SaaS) platform designed for pet-care businesses. It provides tools for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>managing bookings and schedules</li>
              <li>maintaining client and pet profiles</li>
              <li>messaging between staff and clients</li>
              <li>generating invoices</li>
              <li>uploading and viewing dog photos</li>
              <li>managing staff accounts</li>
              <li>basic administrative reporting</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">No payments are processed in the beta version.</p>
            <p className="mt-2 font-medium">Pawtimation does not provide pet-care services itself.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Beta Disclaimer</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-amber-900">Pawtimation is currently in a beta phase.</p>
            </div>
            <p className="mb-4">This means:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Features may change without notice</li>
              <li>Interruptions, bugs and unexpected behaviour may occur</li>
              <li>Data may be modified or removed as part of testing</li>
              <li>Support response times may vary</li>
              <li>Service levels are not guaranteed</li>
            </ul>
            <p className="mt-4 font-medium">You use the beta version at your own risk.</p>
            <p className="text-sm text-slate-600">You should not rely on the beta for mission-critical operations.</p>
            <p className="text-sm text-slate-600 mt-2">A formal release version will be introduced at a later date with revised Terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Accounts and Access</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.1 Business Accounts</h3>
            <p className="mb-2">Businesses may create an account and invite staff or clients to access the platform.</p>
            <p className="mb-2">The business owner is responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>all activity under their account</li>
              <li>access granted to staff</li>
              <li>accuracy of data entered</li>
              <li>maintaining confidentiality of login credentials</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.2 Staff Accounts</h3>
            <p>Staff accounts are restricted to functionality permitted by the business. Staff may not access other businesses' data.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.3 Client Accounts</h3>
            <p className="mb-2">Clients (pet owners) are provided access to their own:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>bookings</li>
              <li>invoices</li>
              <li>pets</li>
              <li>messages</li>
              <li>uploaded media related to their pets</li>
            </ul>
            <p className="mt-2 font-medium">Clients cannot view other clients' data under any circumstances.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Data and Privacy</h2>
            <p className="mb-4">
              Your use of Pawtimation is governed by our{' '}
              <Link to="/legal/privacy" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>, 
              which forms part of these Terms.
            </p>
            <p className="mb-4">Key points include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pawtimation acts as Data Processor for business-entered data</li>
              <li>Address data is stored in text-only form</li>
              <li>Mapping, GPS and routing features are fully disabled</li>
              <li>No geolocation or tracking occurs</li>
              <li>Data is processed in accordance with UK GDPR</li>
              <li>Third-party processors include Replit, Neon, Resend and Stripe (payments disabled)</li>
            </ul>
            <p className="mt-4 font-medium">Please review the Privacy Policy carefully.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Your Responsibilities</h2>
            <p className="mb-4">Users agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>provide accurate information</li>
              <li>comply with all applicable laws</li>
              <li>use the Service only for lawful business activities</li>
              <li>ensure that staff and clients follow these Terms</li>
              <li>avoid uploading harmful, illegal, or inappropriate content</li>
              <li>maintain secure passwords</li>
              <li>notify Pawtimation immediately of any suspected unauthorised access</li>
            </ul>
            
            <p className="mt-4 mb-4 font-medium">Users must not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>misuse or reverse-engineer the platform</li>
              <li>attempt to access data belonging to other businesses</li>
              <li>circumvent security measures</li>
              <li>use the platform for fraudulent or harmful activity</li>
              <li>automate access without written permission</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Intellectual Property</h2>
            <p className="mb-4">All intellectual property rights in Pawtimation, including:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>software code</li>
              <li>design</li>
              <li>workflows</li>
              <li>documentation</li>
              <li>branding</li>
              <li>databases (excluding user-owned data)</li>
            </ul>
            <p className="mb-4">remain the exclusive property of Pawtimation.</p>
            <p className="mb-4">Users receive a non-transferable, non-exclusive, revocable licence to use the Service for legitimate business purposes.</p>
            <p className="font-medium">You may not copy, distribute, modify, or create derivative works of the Service without written consent.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Acceptable Use</h2>
            <p className="mb-4">Users must not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>upload viruses or malicious code</li>
              <li>interfere with system operations</li>
              <li>conduct security testing without authorisation</li>
              <li>attempt to access source code</li>
              <li>use the platform to harass or abuse others</li>
              <li>upload unlawful content</li>
              <li>attempt to bypass access controls or restrictions</li>
            </ul>
            <p className="mt-4 font-medium text-red-700">Violations may result in immediate account termination.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Availability and Support</h2>
            <p className="mb-4">Pawtimation aims for a high level of availability, but makes no guarantees during the beta phase.</p>
            <p className="mb-4">The Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>may be unavailable for maintenance</li>
              <li>may experience outages</li>
              <li>may change without notice</li>
              <li>may include temporary features or placeholders</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Support is provided on a reasonable-efforts basis via email.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Modifications to the Service</h2>
            <p className="mb-4">Pawtimation may:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>add or remove features</li>
              <li>introduce new controls</li>
              <li>update interfaces</li>
              <li>adjust system behaviour</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Changes may occur without prior notice during beta.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Termination</h2>
            <p className="mb-4">Pawtimation may suspend or terminate access to the Service if:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>a user breaches these Terms</li>
              <li>a user poses a security or legal risk</li>
              <li>the Service is misused</li>
              <li>required by law or regulatory action</li>
            </ul>
            <p className="mt-4 mb-4">You may terminate your account at any time by contacting support or closing the business account.</p>
            <p className="mb-4">Upon termination:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>access will cease immediately</li>
              <li>data may be retained or deleted according to the Privacy Policy</li>
              <li>legal obligations may require continued storage of some records (e.g., invoices)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">13. Limitation of Liability</h2>
            <p className="mb-4">As the Service is in beta:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pawtimation provides the Service "as is" and "as available"</li>
              <li>No warranties (express or implied) are given</li>
              <li>Pawtimation is not liable for loss of profits, data, business interruption, missed bookings, or any indirect or consequential loss</li>
              <li>Liability for foreseeable losses is capped at £0 during beta, as no fees are charged</li>
            </ul>
            <p className="mt-4 mb-4">Nothing in these Terms limits liability for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>fraud</li>
              <li>death or personal injury caused by negligence</li>
              <li>any liability that cannot be excluded under UK law</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">14. Indemnity</h2>
            <p className="mb-4">You agree to indemnify and hold harmless Pawtimation against claims arising from:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>misuse of the Service</li>
              <li>breach of these Terms</li>
              <li>violation of applicable laws</li>
              <li>disputes between you and your customers, staff or contractors</li>
            </ul>
            <p className="mt-4 font-medium">Pawtimation provides software only and is not responsible for the conduct of businesses using the platform.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">15. Governing Law and Jurisdiction</h2>
            <p className="mb-4">These Terms are governed by the laws of England and Wales.</p>
            <p>Any dispute shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">16. Changes to These Terms</h2>
            <p className="mb-4">We may update these Terms from time to time.</p>
            <p className="mb-4">Material updates will be communicated through the platform or by email.</p>
            <p className="font-medium">Continued use of the Service constitutes acceptance of the updated Terms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">17. Contact Information</h2>
            <p className="mb-4">For questions about these Terms, contact:</p>
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
            END OF TERMS OF SERVICE
          </div>
        </div>
      </div>
    </div>
  );
}
