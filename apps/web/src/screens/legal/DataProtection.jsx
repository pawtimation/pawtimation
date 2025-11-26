import React from 'react';
import { Link } from 'react-router-dom';

export function DataProtection() {
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
          <h1 className="text-3xl font-bold text-slate-800">Data Protection Statement</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Version: 1.0</span>
          <span>Last Updated: 26 November 2025</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Beta Release</span>
        </div>
        
        <p className="text-slate-700 mb-8">
          This Data Protection Statement explains how Pawtimation complies with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and other applicable data protection laws. This statement should be read alongside the Pawtimation{' '}
          <Link to="/legal/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link> and{' '}
          <Link to="/legal/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Who We Are</h2>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="mb-2"><span className="font-medium">Business Name:</span> Pawtimation</p>
              <p className="mb-2"><span className="font-medium">Legal Form:</span> Sole Trader</p>
              <p className="mb-2"><span className="font-medium">Owner:</span> Andrew James Beattie</p>
              <p className="mb-2"><span className="font-medium">Registered Business Address:</span></p>
              <p className="text-sm text-slate-600 ml-4">
                Lytchett House, 13 Freeland Park,<br />
                Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
              <p className="mt-2"><span className="font-medium">Email:</span> <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline">hello@pawtimation.co.uk</a></p>
            </div>
            <p>
              Pawtimation provides a cloud-based CRM platform for pet-care businesses, including client management, booking management, staff scheduling, messaging, record keeping, invoicing and related administrative tools.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Data Controller and Data Processor Roles</h2>
            <p className="mb-4">Under the UK GDPR, Pawtimation may act as a Data Controller, a Data Processor, or both, depending on the context.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">2.1 Pawtimation as Data Processor</h3>
            <p className="mb-4">Pawtimation acts as a Data Processor for all personal data entered by businesses using the platform.</p>
            <p className="mb-2">This includes data relating to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>clients of the business (pet owners)</li>
              <li>pets</li>
              <li>bookings and schedules</li>
              <li>staff details (entered by the business)</li>
              <li>business notes and communications</li>
              <li>any files uploaded by businesses or clients</li>
              <li>contact information entered into client or staff profiles</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              In these cases, the business using Pawtimation is the Data Controller. Pawtimation processes this data strictly on the controller's instructions.
            </p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">2.2 Pawtimation as Data Controller</h3>
            <p className="mb-2">Pawtimation acts as a Data Controller for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>platform operational logs</li>
              <li>security logs</li>
              <li>authentication records</li>
              <li>account registration information</li>
              <li>customer support communications</li>
              <li>website analytics</li>
              <li>administrative and billing records</li>
              <li>system-level monitoring and error reporting</li>
              <li>platform improvement activities</li>
              <li>marketing communications (if consented to, currently none during beta)</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Pawtimation determines the means and purposes of this processing.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Responsibilities of Pawtimation as Data Processor</h2>
            <p className="mb-4">When acting as a Data Processor, Pawtimation will:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Process personal data only on documented instructions from the business.</li>
              <li>Ensure staff with access to data are subject to confidentiality obligations.</li>
              <li>Implement appropriate technical and organisational security measures.</li>
              <li>Assist the business (controller) in responding to data subject rights requests.</li>
              <li>Assist with DPIA-related queries where required.</li>
              <li>Notify the business without undue delay of any personal data breach.</li>
              <li>Delete or return personal data at the end of service provision, unless legally required to retain it.</li>
              <li>Make available information necessary to demonstrate compliance.</li>
              <li>Not transfer data outside the UK without appropriate safeguards.</li>
              <li>Not engage sub-processors without ensuring adequate contractual protection.</li>
            </ol>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Businesses' Responsibilities as Data Controllers</h2>
            <p className="mb-4">Where a business uses Pawtimation to process personal data belonging to its clients or staff, the business remains responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>ensuring a lawful basis exists for processing</li>
              <li>providing appropriate privacy notices to its clients and staff</li>
              <li>ensuring data accuracy</li>
              <li>handling consent where required</li>
              <li>managing data subject rights requests</li>
              <li>ensuring retention practices align with legal requirements</li>
              <li>complying with all applicable UK data protection laws</li>
            </ul>
            <p className="mt-4 font-medium">Pawtimation supports, but does not replace, a business's legal duties.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Sub-Processors Used by Pawtimation</h2>
            <p className="mb-4">Pawtimation uses the following third-party processors to operate the Service:</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Sub-Processor</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Purpose</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Replit</td>
                    <td className="px-4 py-2">Hosting infrastructure</td>
                    <td className="px-4 py-2">United States</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Neon</td>
                    <td className="px-4 py-2">PostgreSQL database service</td>
                    <td className="px-4 py-2">United States / EU</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Resend</td>
                    <td className="px-4 py-2">Transactional emails</td>
                    <td className="px-4 py-2">United States</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Stripe</td>
                    <td className="px-4 py-2">Payment processing infrastructure (disabled during beta)</td>
                    <td className="px-4 py-2">EU / US</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mb-2">Sub-processors are reviewed for compliance and contractual safeguards are in place, including Standard Contractual Clauses (SCCs) and the UK Addendum where required.</p>
            
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-4">
              <p className="font-semibold text-teal-900">No mapping or geolocation sub-processors are used.</p>
              <p className="text-teal-800">Mapping, geocoding and routing features are fully disabled.</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. International Transfers</h2>
            <p className="mb-4">Pawtimation may transfer personal data outside the United Kingdom to approved sub-processors listed above.</p>
            <p className="mb-2">Such transfers are protected using:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Standard Contractual Clauses (SCCs) with the UK Addendum</li>
              <li>Appropriate technical and organisational safeguards</li>
              <li>Access controls and encryption</li>
              <li>Data minimisation practices</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">No other international transfers occur.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Security Measures</h2>
            <p className="mb-4">Pawtimation employs a range of technical and organisational controls including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (HTTPS)</li>
              <li>AES-256-GCM encryption for sensitive fields</li>
              <li>Password hashing</li>
              <li>Role-Based Access Control (RBAC)</li>
              <li>Rate limiting</li>
              <li>Strict Content Security Policy (CSP)</li>
              <li>Sanitised logging</li>
              <li>Regular vulnerability assessment</li>
              <li>No geolocation or mapping scripts</li>
              <li>API key isolation and environment separation</li>
              <li>Session controls and secure cookies</li>
              <li>Zero collection of GPS or coordinate data</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">Security measures are reviewed and updated routinely.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Data Deletion and Retention</h2>
            <p className="mb-4">Pawtimation complies with the Data Controller's instructions for data deletion.</p>
            <p className="mb-4">Default retention periods (unless otherwise instructed) are:</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Data Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2">Client, staff, business account records</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Bookings and notes</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Dog profiles and photos</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Messages</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Invoices and financial documents</td><td className="px-4 py-2">7 years</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Operational logs</td><td className="px-4 py-2">30-90 days</td></tr>
                  <tr><td className="px-4 py-2">Beta-phase data</td><td className="px-4 py-2">Deleted at beta conclusion</td></tr>
                </tbody>
              </table>
            </div>
            
            <p>Businesses may request earlier deletion of their data. Some records may be retained where legally required.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Breach Notification</h2>
            <p className="mb-4">In the event of a personal data breach affecting customer data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pawtimation will notify the impacted business without undue delay</li>
              <li>Provide details of the breach, likely impact, and mitigations</li>
              <li>Support the controller in fulfilling its legal obligations, including any requirement to notify the ICO or affected individuals</li>
            </ul>
            <p className="mt-4 text-sm text-slate-600">
              Internal platform-level breaches affecting controller-owned data will be handled directly under Pawtimation's responsibilities as a controller.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Data Subject Rights</h2>
            <p className="mb-4">Pawtimation supports rights under the UK GDPR, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access</li>
              <li>Rectification</li>
              <li>Erasure</li>
              <li>Restriction</li>
              <li>Data portability</li>
              <li>Objection</li>
            </ul>
            <p className="mt-4">Requests relating to business-controlled data will be directed to the relevant business.</p>
            <p className="mt-2">
              Requests relating to platform or administrative data can be submitted to:{' '}
              <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline font-medium">hello@pawtimation.co.uk</a>
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Updates to This Statement</h2>
            <p className="mb-4">This Data Protection Statement may be updated to reflect changes to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>the platform</li>
              <li>legal requirements</li>
              <li>processing practices</li>
              <li>sub-processor lists</li>
            </ul>
            <p className="mt-4">Significant updates will be communicated where appropriate.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Contact Information</h2>
            <p className="mb-4">For all data protection matters, contact:</p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="mb-2">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline">hello@pawtimation.co.uk</a>
              </p>
              <p>
                <span className="font-medium">Post:</span> Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
            </div>
          </section>
          
          <div className="border-t pt-6 mt-8 text-center text-sm text-slate-500">
            END OF DATA PROTECTION STATEMENT
          </div>
        </div>
      </div>
    </div>
  );
}
