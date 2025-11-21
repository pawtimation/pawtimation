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
        
        <p className="text-sm text-slate-500 mb-8">Last Updated: 21 November 2025</p>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            Pawtimation uses cookies to operate the service.
          </p>
          
          <hr className="my-8 border-slate-200" />
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. What Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">A. Essential Cookies</h3>
            <p>Used for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authentication (login sessions)</li>
              <li>Security</li>
              <li>Routing between pages</li>
            </ul>
            <p className="mt-4 font-medium">Required for platform functionality.</p>
            
            <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">B. Analytics Cookies (if enabled)</h3>
            <p>
              We may use minimal analytics to understand usage and improve performance.
            </p>
            <p className="mt-4 font-medium">No advertising cookies are used.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Managing Cookies</h2>
            <p>
              You may disable cookies through your browser, but the platform may not function correctly.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. Contact</h2>
            <p>
              <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline font-medium">
                pawtimation.uk@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
