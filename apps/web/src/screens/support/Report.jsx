import React from 'react';
import { Link } from 'react-router-dom';

export function Report() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Report an Issue</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Found a bug or experiencing technical difficulties? We're here to help.
          </p>
          
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">How to report an issue:</h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Send an email to <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline">pawtimation.uk@gmail.com</a></li>
            <li>Include a brief description of the issue</li>
            <li>If possible, include screenshots or steps to reproduce the problem</li>
            <li>Mention your account email (if applicable)</li>
          </ol>
          
          <p className="text-slate-600 mt-6">
            We'll investigate and respond as quickly as possible.
          </p>
        </div>
      </div>
    </div>
  );
}
