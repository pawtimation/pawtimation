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
              <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-8 h-8 object-contain" />
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
                <Link to="/legal/terms" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/cookies" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/data-protection" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
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
                <Link to="/support/help" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  Help Centre
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:pawtimation.uk@gmail.com" 
                  className="text-sm text-slate-600 hover:opacity-80 transition"
                  style={{ color: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                >
                  Contact Support
                </a>
              </li>
              <li>
                <Link to="/support/report" className="text-sm text-slate-600 hover:opacity-80 transition" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3F9C9B'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 3: Company Details */}
        <div className="border-t border-slate-200 pt-6 text-center">
          <p className="text-sm text-slate-600 mb-1">
            Pawtimation is a product by <span className="font-medium text-slate-700">Andrew James Beattie</span>
          </p>
          <p className="text-sm text-slate-500 mb-1">
            Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset BH16 6FA, United Kingdom
          </p>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
