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
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Last Updated: 26 November 2025</span>
          <span>Version: 1.0</span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Beta Release</span>
        </div>
        
        <p className="text-slate-700 mb-8">
          This Privacy Policy explains how Pawtimation processes personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and all applicable UK privacy laws.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. About Pawtimation</h2>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="mb-2"><span className="font-medium">Business Name:</span> Pawtimation</p>
              <p className="mb-2"><span className="font-medium">Owner:</span> Andrew James Beattie (Sole Trader)</p>
              <p className="mb-2"><span className="font-medium">Registered Business Address:</span></p>
              <p className="text-sm text-slate-600 ml-4">
                Lytchett House, 13 Freeland Park,<br />
                Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
              <p className="mt-2"><span className="font-medium">Email:</span> <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline">hello@pawtimation.co.uk</a></p>
            </div>
            <p className="mb-4">
              Pawtimation provides a cloud-based CRM platform for pet-care businesses, including tools for managing bookings, clients, pets, staff and communications.
            </p>
            <p className="font-medium mb-2">Pawtimation acts:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>as a <span className="font-medium">Data Processor</span> for all information entered by businesses, their staff and their clients; and</li>
              <li>as a <span className="font-medium">Data Controller</span> for platform administration, support, logs, website analytics and operational activities.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Scope of This Privacy Policy</h2>
            <p className="mb-4">This Privacy Policy applies to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Business owners using the Pawtimation CRM</li>
              <li>Staff using the staff portal</li>
              <li>Clients using the client portal</li>
              <li>Website visitors</li>
              <li>Beta testers</li>
              <li>Any user who interacts with Pawtimation in any capacity</li>
            </ul>
            <p className="mb-4">It covers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The data we collect</li>
              <li>How and why we use it</li>
              <li>The lawful bases for processing</li>
              <li>Who we share data with</li>
              <li>International transfers</li>
              <li>Data retention</li>
              <li>Security measures</li>
              <li>Your legal rights</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Categories We Process</h2>
            <p className="mb-4">Pawtimation processes personal data provided directly by businesses, staff and clients, as well as operational data generated during platform use.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.1. Data you provide to Pawtimation</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name</li>
              <li>Address (stored as text only)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Business details</li>
              <li>Staff details</li>
              <li>Client details</li>
              <li>Dog details (name, breed, behaviour notes, age, veterinary information, photos)</li>
              <li>Booking information</li>
              <li>Messages sent within the platform</li>
              <li>Uploaded files (limited to dog photos)</li>
              <li>Emergency contact information</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.2. Automatically collected data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device type and browser</li>
              <li>IP address</li>
              <li>Timestamped audit logs</li>
              <li>Error logs (sanitised to avoid message bodies and sensitive content)</li>
              <li>Session cookies</li>
              <li>Basic analytics (non-identifying)</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">3.3. Data we do not collect</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>GPS data</li>
              <li>Live location</li>
              <li>Geocoded coordinates</li>
              <li>Routing data</li>
              <li>Biometric data</li>
              <li>Payment card data (handled solely by Stripe when enabled)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Location Data and Mapping</h2>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-teal-900">Pawtimation does not process geolocation or mapping data.</p>
            </div>
            <p className="mb-4">Specifically:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>No GPS coordinates are collected</li>
              <li>No client or staff locations are tracked</li>
              <li>No geocoding is performed</li>
              <li>No routing or directions are generated</li>
              <li>No map visuals are displayed</li>
              <li>No mapping-related APIs are contacted</li>
            </ul>
            <p className="mb-4">All addresses stored in Pawtimation are retained as text only.</p>
            <p className="text-sm text-slate-600 italic">
              If mapping features are introduced in future versions, they will be disabled by default and subject to a separate data protection notice and opt-in controls.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Lawful Bases for Processing (UK GDPR Article 6)</h2>
            <p className="mb-4">Pawtimation relies on the following lawful bases:</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.1. Contract</h3>
            <p className="mb-2">To provide the Pawtimation service, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account creation and management</li>
              <li>Client portal functionality</li>
              <li>Staff portal functionality</li>
              <li>Booking management</li>
              <li>Invoice management</li>
              <li>Messaging</li>
              <li>Mandatory service-related emails</li>
              <li>File uploads</li>
            </ul>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.2. Legitimate Interests</h3>
            <p className="mb-2">To operate, secure and improve the platform, including:</p>
            <ul className="list-disc pl-6 space-y-1 mb-2">
              <li>Security logging</li>
              <li>Fraud prevention</li>
              <li>Debugging and error resolution</li>
              <li>Protecting the integrity and availability of the service</li>
            </ul>
            <p className="text-sm text-slate-600">Our legitimate interests do not override your rights or freedoms.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.3. Legal Obligations</h3>
            <p>To meet UK tax and accounting obligations (when financial features are fully enabled).</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">5.4. Consent</h3>
            <p>Used only for optional cookies or marketing communications.</p>
            <p className="text-sm text-slate-600">Pawtimation currently does not send marketing communications during beta.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. How We Use Personal Data</h2>
            <p className="mb-4">We use personal data to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Deliver CRM features to businesses</li>
              <li>Facilitate messaging between businesses, staff and clients</li>
              <li>Enable management of dogs, bookings and invoices</li>
              <li>Provide essential operational emails</li>
              <li>Maintain platform security</li>
              <li>Improve the reliability and performance of Pawtimation</li>
            </ul>
            <p className="font-medium">We do not use personal data for advertising or profiling, and we do not sell or broker personal data to any third parties.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Data Sharing and Processors</h2>
            <p className="mb-4">Pawtimation uses third-party service providers to deliver the platform. These providers act as Data Processors under UK GDPR.</p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Provider</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Role</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Region</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Replit</td>
                    <td className="px-4 py-2">Hosting environment</td>
                    <td className="px-4 py-2">United States</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Neon</td>
                    <td className="px-4 py-2">PostgreSQL database provider</td>
                    <td className="px-4 py-2">United States / EU</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-2 font-medium">Stripe</td>
                    <td className="px-4 py-2">Payment processing infrastructure (disabled in beta)</td>
                    <td className="px-4 py-2">EU / US</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Resend</td>
                    <td className="px-4 py-2">Transactional email service</td>
                    <td className="px-4 py-2">United States</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mb-2">All processors operate under enforceable Standard Contractual Clauses (SCCs) and meet applicable data protection requirements.</p>
            <p className="font-medium">Pawtimation does not share data with any marketing or advertising platforms.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. International Transfers</h2>
            <p className="mb-4">Personal data is transferred outside the UK to service providers located in the United States.</p>
            <p className="mb-2">All transfers rely on:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>UK Addendum to the EU Standard Contractual Clauses</li>
              <li>Contractual safeguards</li>
              <li>Security measures enforced at each provider</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Data Retention</h2>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Data Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="px-4 py-2">User accounts (business, staff, client)</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Bookings</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Dog profiles</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Messages</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Uploaded photos</td><td className="px-4 py-2">Active period + 12 months</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">Invoices and financial records</td><td className="px-4 py-2">7 years (legal requirement)</td></tr>
                  <tr className="border-b"><td className="px-4 py-2">System logs</td><td className="px-4 py-2">30 to 90 days</td></tr>
                  <tr><td className="px-4 py-2">Beta data</td><td className="px-4 py-2">Deleted at the end of the beta phase</td></tr>
                </tbody>
              </table>
            </div>
            <p>You may request deletion at any time, subject to legal retention requirements.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Data Security</h2>
            <p className="mb-4">We implement technical and organisational measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>HTTPS encryption</li>
              <li>HSTS</li>
              <li>Role-based access control</li>
              <li>AES-256-GCM encryption for sensitive fields</li>
              <li>Rate limiting</li>
              <li>Sanitised logging</li>
              <li>Content Security Policy</li>
              <li>Password hashing</li>
              <li>Environment-based secret management</li>
              <li>No inline execution of third-party scripts</li>
              <li>Zero geolocation permissions</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Your Rights Under UK GDPR</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion</li>
              <li>Obtain a copy of your data</li>
              <li>Restrict certain processing</li>
              <li>Object to processing based on legitimate interests</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
            <p className="mb-4">
              To exercise any rights, contact: <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline font-medium">hello@pawtimation.co.uk</a>
            </p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">Right to Complain to the ICO</h3>
            <p>
              You may complain to the UK Information Commissioner's Office:<br />
              <a href="https://ico.org.uk/make-a-complaint/" className="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer">https://ico.org.uk/make-a-complaint/</a>
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Children</h2>
            <p>Pawtimation is intended for use only by individuals aged 18 or older.</p>
            <p>We do not knowingly process children's personal data.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">13. Beta Status</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="mb-2">Pawtimation is currently in a beta phase.</p>
              <p className="mb-2">Features may change, and occasional service interruptions may occur.</p>
              <p>All reasonable efforts are made to safeguard data during this period.</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">14. Contact Information</h2>
            <p className="mb-4">For any queries about this policy or your data, please contact:</p>
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
            END OF PRIVACY POLICY
          </div>
        </div>
      </div>
    </div>
  );
}
