import React from 'react';
import { Link } from 'react-router-dom';

export function Footer({ onNav }) {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Section 1: Branding + Purpose */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src='/brand/paw.svg' alt='Pawtimation' className='w-8 h-8'/>
              <h3 className="text-lg font-semibold text-slate-800">Pawtimation</h3>
            </div>
            <p className="text-sm text-slate-600">
              Smart CRM for Dog Walking & Pet Care Businesses.
            </p>
          </div>

          {/* Section 2: Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/terms" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/data-protection" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Data Protection & GDPR
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 2: Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/support/help" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Help Centre
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:pawtimation.uk@gmail.com" 
                  className="text-sm text-slate-600 hover:text-teal-600 transition"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <Link to="/support/report" className="text-sm text-slate-600 hover:text-teal-600 transition">
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Company Details */}
        <div className="border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600 mb-1">
            Pawtimation is a product by <span className="font-medium text-slate-700">Andrew James</span>
          </p>
          <p className="text-sm text-slate-600 mb-1">
            Registered in the United Kingdom
          </p>
          <p className="text-xs text-slate-500">
            © 2025 All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
