import React from 'react';
import { Link } from 'react-router-dom';

export function LoginSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-3 mb-4">
            <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-16 h-16" />
            <h1 className="text-4xl font-bold text-slate-900">Pawtimation</h1>
          </div>
          <p className="text-xl text-slate-600">Select your portal to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            to="/admin/login"
            className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-teal-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                <svg className="w-10 h-10 text-teal-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Business Owner</h2>
              <p className="text-slate-600 mb-4">
                Manage your entire business, staff, clients, bookings and finances
              </p>
              <span className="text-teal-600 font-semibold group-hover:underline">
                Admin Portal →
              </span>
            </div>
          </Link>

          <Link
            to="/staff/login"
            className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <svg className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Staff Member</h2>
              <p className="text-slate-600 mb-4">
                View your schedule, manage bookings and communicate with clients
              </p>
              <span className="text-blue-600 font-semibold group-hover:underline">
                Staff Portal →
              </span>
            </div>
          </Link>

          <Link
            to="/client/login"
            className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <svg className="w-10 h-10 text-purple-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Pet Owner</h2>
              <p className="text-slate-600 mb-4">
                Book services, manage your pets, view schedules and pay invoices
              </p>
              <span className="text-purple-600 font-semibold group-hover:underline">
                Client Portal →
              </span>
            </div>
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/"
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
