import React from 'react';
import { Link } from 'react-router-dom';

export function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Terms of Service</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 italic mb-6">
            Our Terms of Service are currently being finalized. This page will be updated soon with comprehensive terms governing the use of Pawtimation.
          </p>
          
          <p className="text-slate-600">
            For any questions regarding our terms, please contact us at{' '}
            <a href="mailto:pawtimation.uk@gmail.com" className="text-teal-600 hover:underline">
              pawtimation.uk@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
