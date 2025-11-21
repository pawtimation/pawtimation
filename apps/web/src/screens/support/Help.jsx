import React from 'react';
import { Link } from 'react-router-dom';

export function Help() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Help Centre</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-6">
            Welcome to the Pawtimation Help Centre. Our comprehensive documentation is currently being prepared.
          </p>
          
          <h2 className="text-xl font-semibold text-slate-800 mt-8 mb-4">Need immediate assistance?</h2>
          <p className="text-slate-600">
            Contact our support team at{' '}
            <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline">
              pawtimation.uk@gmail.com
            </a>
          </p>
          
          <p className="text-slate-600 mt-4">
            We typically respond within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}
