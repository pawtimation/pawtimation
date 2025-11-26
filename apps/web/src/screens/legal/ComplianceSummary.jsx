import React from 'react';
import { Link } from 'react-router-dom';

export function ComplianceSummary() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <Link to="/" className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block">
          ← Back to Home
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <h1 className="text-3xl font-bold text-slate-800">Data Protection & Security Summary</h1>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-8">
          <span>Version: 1.0</span>
          <span>Issued: November 2025</span>
          <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded">For Businesses</span>
        </div>
        
        <p className="text-slate-700 mb-8 text-lg">
          Pawtimation is designed with privacy and security at its core.
          We operate as a UK-based sole trader business and ensure full transparency over how data is handled.
        </p>
        
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Key Measures</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  UK GDPR Compliance
                </h3>
                <p className="text-sm">Full compliance with UK General Data Protection Regulation</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Legal Documentation
                </h3>
                <p className="text-sm">Comprehensive Privacy Policy and Terms of Service</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Client Rights
                </h3>
                <p className="text-sm">Fully implemented client rights (access, export, deletion)</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Data Retention
                </h3>
                <p className="text-sm">Clear retention schedule for all data types</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  No Tracking
                </h3>
                <p className="text-sm">No analytics tracking, profiling or marketing cookies</p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  No Geolocation
                </h3>
                <p className="text-sm">No geolocation or mapping data processed (routing system disabled)</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Security Controls</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Database encryption at rest and TLS enforced in transit</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Secure authentication with RBAC and rate limiting</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Managed hosting with Replit, Neon, Resend and Stripe (when payments enabled)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>All data stored in structured, access-controlled environments</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Strict Content Security Policy (CSP) headers</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>AES-256-GCM encryption for sensitive fields</span>
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Latest Audit</h2>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
              <p className="text-teal-900 mb-4">
                A full internal GDPR and security audit was completed in <strong>November 2025</strong>, reviewing:
              </p>
              <div className="grid md:grid-cols-2 gap-2 text-sm text-teal-800">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  System architecture
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Privacy documentation
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Mapping disablement
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Security controls
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Sub-processor transparency
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Data flows and retention
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Email identity and templates
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Access controls
                </div>
              </div>
              <p className="text-teal-900 mt-4 font-medium">
                The audit found Pawtimation to be compliant for beta operations.
              </p>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Protection Statement</h2>
            <p className="mb-4">
              For full details on how Pawtimation processes data, including our roles as Data Controller and Data Processor, see our complete{' '}
              <Link to="/legal/data-protection" className="text-teal-600 hover:underline font-medium">
                Data Protection Statement
              </Link>.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact</h2>
            <p className="mb-4">
              If you require anything further, please contact:
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="mb-2">
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline">hello@pawtimation.co.uk</a>
              </p>
              <p className="text-sm text-slate-600">
                Pawtimation, Lytchett House, 13 Freeland Park, Wareham Road, Poole, Dorset, BH16 6FA, United Kingdom
              </p>
            </div>
          </section>
          
          <div className="border-t pt-6 mt-8 text-center text-sm text-slate-500">
            <p className="mb-2">
              This document is provided for informational purposes to businesses using or evaluating Pawtimation.
            </p>
            <p>
              Last updated: November 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
