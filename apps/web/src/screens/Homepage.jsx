import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { BetaApplicationModal } from '../components/BetaApplicationModal';

export function Homepage() {
  const navigate = useNavigate();
  const [betaStatus, setBetaStatus] = useState(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [, forceUpdate] = useState();

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE || '';
    fetch(`${apiBase}/api/beta/status`)
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data) setBetaStatus(data);
      })
      .catch(() => {
        // Silently handle beta status fetch errors
      });
  }, []);

  const mailtoLink = `mailto:hello@pawtimation.co.uk?subject=${encodeURIComponent('Start My Pawtimation Free Trial')}&body=${encodeURIComponent(`Hi Andrew, I'd like to start my free trial. 
Here are my details:
Business name:
My name:
Staff login email:
Approx number of clients/dogs:
Anything specific I'd like to test:`)}`;

  const getCTAText = () => {
    if (!betaStatus) return 'Get Early Access';
    if (betaStatus.betaEnded) return 'Get Early Access';
    if (betaStatus.slotsAvailable > 0) return 'Get Early Access';
    return 'Join Waiting List';
  };

  const handleCTAClick = (e) => {
    e.preventDefault(); // Always prevent default
    
    if (!betaStatus) {
      // If beta status not loaded yet, show modal anyway
      setShowBetaModal(true);
      return;
    }
    
    // Show modal for all cases (beta active, waitlist, or trial signup)
    setShowBetaModal(true);
  };

  const showBetaBanner = new Date() < new Date('2025-12-01');

  return (
    <div className="min-h-screen bg-white">
      {showBetaBanner && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white text-center py-2 px-4">
          <p className="text-sm font-medium">
            Pawtimation Beta launches Monday — early access opening soon!
          </p>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="flex justify-between items-center mb-8 sm:mb-16 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src="/pawtimation-paw.png" alt="Pawtimation paw logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <span className="text-xl sm:text-2xl font-bold text-slate-800">Pawtimation</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link 
              to="/login" 
              className="px-2 sm:px-4 py-2 text-sm sm:text-base font-medium hover:opacity-80 transition-opacity text-slate-700"
            >
              Login
            </Link>
            <button 
              onClick={handleCTAClick}
              className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: '#3F9C9B' }}
            >
              <span className="hidden sm:inline">{getCTAText()}</span>
              <span className="sm:hidden">Early Access</span>
            </button>
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-2 leading-tight">
              Effortless Dog-Walking & Pet-Care Management.
            </h1>
            <p className="text-lg font-semibold mb-6" style={{ color: '#3F9C9B' }}>
              Simple. Smart. Powerful.
            </p>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed font-normal">
              Pawtimation helps dog-walkers and pet-care businesses organise clients, staff, schedules and invoices — all in one fast, intuitive CRM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={handleCTAClick}
                className="px-8 py-4 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-center shadow-lg w-full sm:w-auto cursor-pointer"
                style={{ backgroundColor: '#3F9C9B' }}
              >
                {getCTAText()}
              </button>
            </div>
            
            <div className="flex items-center gap-4 mt-8">
              <div className="relative">
                <img 
                  src="/founder.jpg" 
                  alt="Andrew James with his dog" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-white"
                  style={{ 
                    filter: 'saturate(0.88)',
                    boxShadow: '0 10px 30px rgba(14, 147, 133, 0.08), 0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none" 
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                ></div>
              </div>
              <p className="text-sm text-slate-600 italic">
                Created by Andrew James<br />for real pet-care businesses.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-slate-50 rounded-3xl p-8 shadow-xl">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-slate-100">
                    <div className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center" style={{ backgroundColor: '#3F9C9B' }}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-16 mb-3"></div>
                    <div className="h-6 rounded w-full" style={{ backgroundColor: '#3F9C9B' }}></div>
                  </div>
                  
                  <div className="flex-1 bg-white rounded-xl p-5 shadow-md border border-slate-100">
                    <div className="w-12 h-12 bg-slate-700 rounded-lg mb-4 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="h-2 bg-slate-200 rounded w-14 mb-3"></div>
                    <div className="h-6 bg-slate-700 rounded w-full"></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-md border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs font-semibold text-slate-700 tracking-wide">TODAY'S SCHEDULE</div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3F9C9B' }}></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ backgroundColor: '#3F9C9B1A', borderColor: '#3F9C9B3D' }}>
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-white">
                        <img 
                          src="/hector.jpg" 
                          alt="Hector" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 mb-0.5">Hector</div>
                        <div className="text-xs" style={{ color: '#3F9C9B' }}>30-min Walk</div>
                      </div>
                      <div className="px-3 py-1 text-white text-xs font-medium rounded-full flex-shrink-0" style={{ backgroundColor: '#3F9C9B' }}>
                        2:00 PM
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-white">
                        <img 
                          src="/luna.jpg" 
                          alt="Luna" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 mb-0.5">Luna</div>
                        <div className="text-xs text-slate-500">Group Walk</div>
                      </div>
                      <div className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full flex-shrink-0">
                        3:30 PM
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-white">
                        <img 
                          src="/milo.jpg" 
                          alt="Milo" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 mb-0.5">Milo</div>
                        <div className="text-xs text-slate-500">Puppy Visit</div>
                      </div>
                      <div className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full flex-shrink-0">
                        4:15 PM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What Pawtimation Does</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Smart Scheduling</h3>
              <p className="text-slate-600">
                Manage bookings, staff availability, recurring walks and daily schedules in seconds — not hours.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Staff & Client Portals</h3>
              <p className="text-slate-600">
                Separate mobile-friendly logins for staff and clients with real-time updates, reminders and secure messaging.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Invoicing & Payments</h3>
              <p className="text-slate-600">
                Auto-generated invoices, payment tracking, card payments (Stripe), reminders and full revenue insights.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Check-Ins & Notes</h3>
              <p className="text-slate-600">
                Staff can check in/out of visits, add notes, share photos and keep clients updated effortlessly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Fast Client Management</h3>
              <p className="text-slate-600">
                Profiles for clients and pets, medical notes, emergency contacts, keys, addresses, onboarding status and more.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#3F9C9B' }}>Smart Automations & Analytics</h3>
              <p className="text-slate-600">
                Automated onboarding, reminders, invoice items, status updates, email flows and real-time analytics — saving hours every week and eliminating admin overload.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Who It's For</h2>
            <p className="text-xl text-slate-600">Built for real dog-service businesses</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-5 h-5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-lg font-medium text-slate-800">Dog Walkers</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-5 h-5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-lg font-medium text-slate-800">Pet Sitters</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-5 h-5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-lg font-medium text-slate-800">Doggy Daycare</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-5 h-5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-medium text-slate-800">Dog Trainers</span>
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3F9C9B1A' }}>
                <svg className="w-5 h-5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </div>
              <span className="text-lg font-medium text-slate-800">Dog Groomers</span>
            </div>
          </div>
        </section>

        <section className="mb-32 bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-16 rounded-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">
                  Built by a team who actually understand the pet-care industry.
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Pawtimation was designed from the ground up around the real day-to-day workflows of dog walkers and pet-care businesses — managing clients, multi-dog households, staff availability, cancellations, messaging and revenue, without any of the typical software headaches.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Ultra-fast admin dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Reliable staff app</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Client portal for bookings & updates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Real-time job statuses</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Automated invoice items</span>
                  </li>
                </ul>
                <a href="#screenshots" className="font-medium inline-flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: '#3F9C9B' }}>
                  See how it works 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>

              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-2xl transform rotate-2 opacity-10 blur-sm" 
                  style={{ backgroundColor: '#3F9C9B' }}
                ></div>
                <div className="relative bg-white rounded-2xl shadow-2xl p-2 w-4/5 mx-auto">
                  <img 
                    src="/hero-dog-ball.jpg" 
                    alt="Happy dog" 
                    className="rounded-xl w-full h-auto object-cover"
                    style={{ 
                      filter: 'saturate(0.88)',
                      boxShadow: '0 20px 50px rgba(14, 147, 133, 0.08)'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-xl pointer-events-none" 
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="screenshots" className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">See Pawtimation in Action</h2>
            <p className="text-xl text-slate-600">Everything you need to run your pet-care business</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 bg-white p-4 flex items-center justify-center h-[500px]">
                <img
                  src="/admin-dashboard-preview.jpg?v=6"
                  alt="Admin Dashboard"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-lg">Admin Dashboard</h4>
                <p className="text-slate-600">Real-time analytics and business insights</p>
              </div>
            </div>
            
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-transparent to-teal-500/10 z-10"></div>
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 w-full h-full flex items-center justify-center">
                  <div className="max-w-[280px]">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                      <div className="p-4" style={{ backgroundColor: '#3F9C9B' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                          </div>
                        </div>
                        <div className="text-white/90 text-xs font-medium mb-1">Today's Schedule</div>
                        <div className="text-2xl font-bold text-white">6 walks</div>
                        <div className="text-white/70 text-xs">2 completed, 4 upcoming</div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-xl p-3 border-2 border-teal-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                              <img src="/hector.jpg" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-800">Hector</div>
                              <div className="text-xs text-teal-600">30-min Solo Walk</div>
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#3F9C9B' }}>
                              2:00 PM
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                              <img src="/luna.jpg" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-700">Luna</div>
                              <div className="text-xs text-slate-500">Group Walk</div>
                            </div>
                            <div className="px-2 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
                              3:30 PM
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                              <img src="/milo.jpg" alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-slate-700">Milo</div>
                              <div className="text-xs text-slate-500">Puppy Visit</div>
                            </div>
                            <div className="px-2 py-1 bg-slate-200 rounded-full text-xs font-medium text-slate-600">
                              4:15 PM
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-lg">Staff Mobile View</h4>
                <p className="text-slate-600">Accept jobs and update status on the go</p>
              </div>
            </div>
            
            <div className="group">
              <div className="relative overflow-hidden rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 h-[500px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 z-10"></div>
                <div className="p-6 w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #f0fdfa, #ccfbf1)' }}>
                  <div className="bg-white rounded-2xl shadow-2xl p-5 border border-teal-100">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-slate-100">
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-md" style={{ backgroundColor: '#3F9C9B' }}>
                        <img src="/hector.jpg" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-slate-900">Hector</div>
                        <div className="text-sm text-slate-600">Labrador • 3 years old</div>
                      </div>
                    </div>
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">SERVICE</label>
                        <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                          <div className="text-sm font-medium text-slate-800">30-Minute Solo Walk</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">DATE</label>
                          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 text-sm text-slate-700">
                            Dec 15
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">TIME</label>
                          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 text-sm text-slate-700">
                            2:00 PM
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <svg className="w-4 h-4" style={{ color: '#3F9C9B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant updates enabled</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 text-white rounded-xl py-3 font-semibold text-sm shadow-md" style={{ backgroundColor: '#3F9C9B' }}>
                        Confirm Booking
                      </button>
                      <button className="flex-1 bg-white rounded-xl py-3 font-semibold text-sm border-2" style={{ borderColor: '#3F9C9B', color: '#3F9C9B' }}>
                        Modify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-slate-900 text-lg">Client Booking Flow</h4>
                <p className="text-slate-600">Simple, instant walk bookings</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 rounded-2xl p-10 border border-slate-300 shadow-xl">
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                  All-In-One
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Why Pet-Care Businesses Love Pawtimation</h3>
              <p className="text-slate-700 mb-6 leading-relaxed font-medium">
                Because it replaces six different tools with one powerful, lightning-fast platform.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="#0E9385" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Cuts admin work by 50–70% in the first week</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="#0E9385" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Staff onboarding takes under 1 minute</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="#0E9385" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Bookings, cancellations & changes handled instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="#0E9385" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Automated reminders reduce missed payments to near-zero</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="#0E9385" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Every client, pet, key, note & invoice stays perfectly organised</span>
                </li>
              </ul>
            </div>

            <div className="relative bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 rounded-2xl p-10 border border-teal-300 shadow-xl">
              <div className="absolute -top-3 left-6">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                  Mobile-First
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Built for Mobile — Made for Real-World Work</h3>
              <p className="text-slate-700 mb-6 leading-relaxed font-medium">
                Whether you're on a walk, at the park, in the van or at home:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: '#0E9385' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Staff update jobs instantly with a single tap</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: '#0E9385' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Admins manage the business from anywhere</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: '#0E9385' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Clients receive real-time notifications & updates</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: '#0E9385' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">Check-ins, notes & photos happen on the go</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <svg className="w-6 h-6 mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: '#0E9385' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-800 leading-relaxed font-medium">No crashing. No spinning wheels. Everything is built mobile-first</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-50 rounded-2xl p-12 border border-teal-200 shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md uppercase tracking-wide mb-4">
                  Limited Availability
                </span>
                <h2 className="text-4xl font-bold text-slate-900 mb-4">Founding Member Early Access</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Join as a founding member and help shape the future of Pawtimation while locking in exclusive benefits.
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Lifetime Discounted Pricing</h3>
                  <p className="text-slate-600 text-sm">Lock in special founder rates that never increase, even as we add more features.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Priority Onboarding</h3>
                  <p className="text-slate-600 text-sm">Get personal setup assistance and dedicated support to get you running fast.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Feature Influence</h3>
                  <p className="text-slate-600 text-sm">Your feedback directly shapes what we build next. Your voice matters most.</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border border-teal-100 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#3F9C9B1A' }}>
                    <svg className="w-6 h-6" fill="none" stroke="#3F9C9B" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Early Integrations</h3>
                  <p className="text-slate-600 text-sm">Be first to access new integrations, features and automations before anyone else.</p>
                </div>
              </div>
              <div className="text-center mt-10">
                <button 
                  onClick={handleCTAClick}
                  className="px-10 py-4 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg shadow-lg cursor-pointer"
                  style={{ backgroundColor: '#3F9C9B' }}
                >
                  Become a Founding Member
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing — launching soon.
            </h2>
            <p className="text-xl text-slate-600 mb-6">
              During our beta period, all features are free for early adopters.
              <br />
              Unlimited clients, staff, bookings, invoices and automations.
            </p>
            <button 
              onClick={handleCTAClick}
              className="px-10 py-5 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg shadow-xl mb-4 cursor-pointer"
              style={{ backgroundColor: '#3F9C9B' }}
            >
              Get Early Access
            </button>
            <p className="text-sm text-slate-500 mt-4">
              No credit card required. No contracts. Cancel anytime.
            </p>
          </div>
        </section>

        <section className="mb-32 relative overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-20 rounded-2xl" style={{ background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)' }}>
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: 'url(/pawtimation-paw-watermark.png)', 
              backgroundSize: '300px 300px', 
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              filter: 'invert(1) brightness(2)'
            }}
          ></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to simplify your entire pet-care business?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              One platform for clients, staff, schedules, invoices and payments — without the admin burden.
            </p>
            <button 
              onClick={handleCTAClick}
              className="px-10 py-5 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg shadow-xl cursor-pointer"
              style={{ backgroundColor: '#3F9C9B' }}
            >
              Get Early Access
            </button>
          </div>
        </section>
      </div>

      <BetaApplicationModal 
        isOpen={showBetaModal} 
        onClose={() => setShowBetaModal(false)}
        betaStatus={betaStatus}
      />

      <Footer />
    </div>
  );
}
