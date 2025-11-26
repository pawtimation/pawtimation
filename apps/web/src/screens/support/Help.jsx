import React from 'react';
import { Link } from 'react-router-dom';

export function Help() {
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
          <h1 className="text-3xl font-bold text-slate-800">Help Centre</h1>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-6 text-slate-700">
          <p className="text-lg">
            Welcome to the <span className="font-semibold">Pawtimation Help Centre</span>
          </p>
          
          <p>Here you'll find guides for:</p>
          
          <section className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Getting Started</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Logging in as Admin, Staff or Client</li>
              <li>Setup checklist</li>
              <li>Adding clients, dogs and services</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Bookings</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>How clients request a booking</li>
              <li>How admins approve</li>
              <li>How staff confirm/decline</li>
              <li>Calendar & scheduling</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Invoicing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>How invoices are generated</li>
              <li>Payment options</li>
              <li>Marking invoices as paid</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Account Management</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Updating user details</li>
              <li>Changing passwords</li>
              <li>Email notifications</li>
            </ul>
          </section>
          
          <hr className="my-8 border-slate-200" />
          
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Need Direct Help?</h2>
            <p>
              If you need direct assistance, contact our support team at:{' '}
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
