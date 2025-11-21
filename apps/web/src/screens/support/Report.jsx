import React from 'react';
import { Link } from 'react-router-dom';

export function Report() {
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
          <h1 className="text-3xl font-bold text-slate-800">Report an Issue</h1>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            If you've experienced a bug, glitch, or unexpected behaviour, please report it.
          </p>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">What to Include</h2>
            <p>Include where possible:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>What you were doing</li>
              <li>What you expected</li>
              <li>What happened instead</li>
              <li>Screenshots (if available)</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">How to Report</h2>
            <p>
              Send all reports to:
            </p>
            <p className="text-xl mt-4">
              <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline font-medium">
                📧 pawtimation.uk@gmail.com
              </a>
            </p>
            <p className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
              <span className="font-medium text-teal-900">We'll investigate and respond as quickly as possible.</span>
            </p>
          </section>
          
          <section className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Typical Issues We Help With</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Login issues</li>
              <li>Bugs or unexpected behaviour</li>
              <li>Data correction or account issues</li>
              <li>Business onboarding questions</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
