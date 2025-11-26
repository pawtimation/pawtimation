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
          <h1 className="text-3xl font-bold text-slate-800">Data Protection & GDPR</h1>
        </div>
        
        <p className="text-sm text-slate-500 mb-8">Last Updated: 26 November 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            Pawtimation acts as a <span className="font-medium">Data Processor</span> on behalf of pet-care businesses, who act as <span className="font-medium">Data Controllers</span>.
          </p>
          
          <hr className="my-8 border-slate-200" />
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Our Responsibilities</h2>
            <p>We:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process data only as instructed by the business</li>
              <li>Store data securely</li>
              <li>Provide tools for access and deletion</li>
              <li>Maintain GDPR-compliant technical measures</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Your Responsibilities (Businesses Using Pawtimation)</h2>
            <p>You must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Inform your clients how their data is used</li>
              <li>Obtain consent where necessary</li>
              <li>Ensure data entered is lawful and accurate</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Data Subject Rights</h2>
            <p>We assist businesses with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access requests</li>
              <li>Corrections</li>
              <li>Deletion requests</li>
            </ul>
            <p className="mt-4">
              All handled via{' '}
              <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline font-medium">
                pawtimation.uk@gmail.com
              </a>
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Contact</h2>
            <p className="text-sm text-slate-500">
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
