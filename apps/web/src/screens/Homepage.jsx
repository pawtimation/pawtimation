import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <svg className="w-10 h-10 text-teal-600" fill="currentColor" viewBox="0 0 48 48">
              <circle cx="12" cy="8" r="3"/>
              <circle cx="18" cy="4" r="3"/>
              <circle cx="24" cy="8" r="3"/>
              <circle cx="30" cy="4" r="3"/>
              <circle cx="36" cy="8" r="3"/>
              <path d="M8 16 C8 16, 12 12, 24 12 C36 12, 40 16, 40 16 L40 32 C40 32, 36 36, 24 36 C12 36, 8 32, 8 32 Z"/>
            </svg>
            <span className="text-2xl font-bold text-slate-800">Pawtimation</span>
          </div>
          <Link 
            to="/admin/login" 
            className="px-6 py-2 text-teal-600 hover:text-teal-700 font-medium"
          >
            Login
          </Link>
        </header>

        <section className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Effortless Dog-Walking Management — Simple. Smart. Powerful.
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Pawtimation helps pet-care businesses organise clients, staff, schedules, routes and invoices — all in one fast, intuitive CRM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors text-center shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link 
                to="/admin/login" 
                className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-slate-400 transition-colors text-center"
              >
                Login
              </Link>
            </div>
            
            <div className="flex items-center gap-4 mt-8">
              <img 
                src="/founder.jpg" 
                alt="Andrew James with his dog" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <p className="text-sm text-slate-600 italic">
                Created by Andrew James<br />for real dog-walking businesses.
              </p>
            </div>
          </div>

          <div className="relative perspective-1000">
            <div className="bg-gradient-to-br from-slate-100 via-teal-50 to-slate-100 rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg border border-teal-100">
                    <div className="w-12 h-12 bg-teal-500/90 rounded-xl mb-4 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="h-3 bg-teal-200/80 rounded-full w-20 mb-3"></div>
                    <div className="h-8 bg-teal-500/90 rounded-lg w-full"></div>
                  </div>
                  
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="h-3 bg-slate-300 rounded-full w-16 mb-3"></div>
                    <div className="h-8 bg-slate-700 rounded-lg w-full"></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-teal-100 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs font-semibold text-slate-700 tracking-wide">TODAY'S SCHEDULE</div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50/80 to-teal-50/40 rounded-xl border border-teal-100/50">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-amber-100">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="20" fill="#FEF3C7"/>
                          <ellipse cx="14" cy="16" rx="2" ry="3" fill="#78350F"/>
                          <ellipse cx="26" cy="16" rx="2" ry="3" fill="#78350F"/>
                          <path d="M12 10 Q10 8, 8 9" stroke="#78350F" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M28 10 Q30 8, 32 9" stroke="#78350F" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <ellipse cx="20" cy="22" rx="1.5" ry="2" fill="#78350F"/>
                          <path d="M15 26 Q20 28, 25 26" stroke="#78350F" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M20 5 Q18 8, 20 10 Q22 8, 20 5" fill="#92400E"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 mb-0.5">Hector</div>
                        <div className="text-xs text-teal-600/90">30-min Walk</div>
                      </div>
                      <div className="px-3 py-1 bg-teal-500/90 text-white text-xs font-medium rounded-full flex-shrink-0">
                        2:00 PM
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-blue-100">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="20" fill="#DBEAFE"/>
                          <ellipse cx="14" cy="17" rx="2" ry="3" fill="#1E3A8A"/>
                          <ellipse cx="26" cy="17" rx="2" ry="3" fill="#1E3A8A"/>
                          <path d="M10 12 Q8 10, 6 11" stroke="#1E3A8A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <path d="M30 12 Q32 10, 34 11" stroke="#1E3A8A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <ellipse cx="20" cy="23" rx="1.5" ry="2" fill="#1E3A8A"/>
                          <path d="M14 27 Q20 30, 26 27" stroke="#1E3A8A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          <ellipse cx="12" cy="20" rx="1.5" ry="1.5" fill="#1E40AF"/>
                          <ellipse cx="28" cy="20" rx="1.5" ry="1.5" fill="#1E40AF"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 mb-0.5">Luna</div>
                        <div className="text-xs text-slate-500">Group Walk</div>
                      </div>
                      <div className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-medium rounded-full flex-shrink-0">
                        3:30 PM
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-rose-100">
                        <svg viewBox="0 0 40 40" className="w-full h-full">
                          <circle cx="20" cy="20" r="20" fill="#FFE4E6"/>
                          <ellipse cx="15" cy="18" rx="1.5" ry="2.5" fill="#881337"/>
                          <ellipse cx="25" cy="18" rx="1.5" ry="2.5" fill="#881337"/>
                          <path d="M12 13 Q10 11, 8 12" stroke="#881337" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                          <path d="M28 13 Q30 11, 32 12" stroke="#881337" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                          <circle cx="20" cy="24" r="1.2" fill="#881337"/>
                          <path d="M16 28 Q20 29, 24 28" stroke="#881337" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                          <path d="M13 20 L10 22" stroke="#BE123C" strokeWidth="1" strokeLinecap="round"/>
                          <path d="M27 20 L30 22" stroke="#BE123C" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
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
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Scheduling</h3>
              <p className="text-slate-600">
                Manage bookings, staff availability, routes and repeat walks in seconds.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Staff & Client Portals</h3>
              <p className="text-slate-600">
                Separate logins for staff and clients with real-time updates and mobile-friendly dashboards.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Invoicing & Payments</h3>
              <p className="text-slate-600">
                Auto-generated invoices, branded PDFs, and built-in online payments.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-32 bg-slate-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-16 rounded-2xl">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">
                  Built by someone who actually understands the pet-care industry.
                </h2>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Pawtimation was designed from the ground up to support the real workflows of dog-walking companies — managing clients, multi-dog homes, availability, route planning, cancellations, messaging and revenue, all without the usual SaaS complexity.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Ultra-fast admin dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Staff apps that don't break</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Client portal for bookings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Real-time status updates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Route tracking + GPX export</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Automated invoice items</span>
                  </li>
                </ul>
                <a href="#screenshots" className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-2">
                  See how it works 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl transform rotate-3 opacity-20 group-hover:rotate-6 transition-transform"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-2 transform group-hover:-rotate-1 transition-transform">
                  <img 
                    src="/hero-dog-ball.jpg" 
                    alt="Happy dog" 
                    className="rounded-2xl w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent rounded-2xl"></div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded h-48 mb-4 p-4 overflow-hidden">
                <div className="bg-white rounded shadow-sm p-3 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-2 bg-teal-600 rounded w-20"></div>
                    <div className="h-2 bg-slate-300 rounded w-12"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-teal-50 rounded p-2">
                      <div className="h-4 bg-teal-200 rounded w-full mb-1"></div>
                      <div className="h-2 bg-teal-300 rounded w-2/3"></div>
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <div className="h-4 bg-blue-200 rounded w-full mb-1"></div>
                      <div className="h-2 bg-blue-300 rounded w-2/3"></div>
                    </div>
                    <div className="bg-amber-50 rounded p-2">
                      <div className="h-4 bg-amber-200 rounded w-full mb-1"></div>
                      <div className="h-2 bg-amber-300 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white rounded shadow-sm p-2 flex-1">
                    <div className="h-1.5 bg-slate-300 rounded w-full mb-1"></div>
                    <div className="h-1.5 bg-slate-200 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white rounded shadow-sm p-2 flex-1">
                    <div className="h-1.5 bg-slate-300 rounded w-full mb-1"></div>
                    <div className="h-1.5 bg-slate-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-slate-800">Admin Dashboard</h4>
              <p className="text-sm text-slate-600">Complete overview of your business</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded h-48 mb-4 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-6 w-6 rounded-full bg-teal-500"></div>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-white"></div>
                    <div className="h-1 w-1 rounded-full bg-white"></div>
                    <div className="h-1 w-1 rounded-full bg-white"></div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="bg-teal-600 text-white rounded-lg p-2">
                    <div className="h-2 bg-teal-400 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-white rounded w-2/3 mb-1"></div>
                    <div className="h-2 bg-teal-300 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-700">
                    <div className="h-2 bg-slate-300 rounded w-1/3 mb-1"></div>
                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-700">
                    <div className="h-2 bg-slate-300 rounded w-1/4 mb-1"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 bg-teal-600 rounded h-8"></div>
                  <div className="flex-1 bg-slate-700 rounded h-8"></div>
                </div>
              </div>
              <h4 className="font-semibold text-slate-800">Staff Mobile App</h4>
              <p className="text-sm text-slate-600">Accept jobs on the go</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded h-48 mb-4 p-4">
                <div className="bg-white rounded-lg shadow-md p-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal-200"></div>
                    <div>
                      <div className="h-2 bg-slate-700 rounded w-16 mb-1"></div>
                      <div className="h-1.5 bg-slate-400 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <div className="h-2 bg-slate-300 rounded w-full mb-1"></div>
                    <div className="h-2 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="flex gap-2">
                      <div className="h-1.5 bg-teal-300 rounded w-12"></div>
                      <div className="h-1.5 bg-slate-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-teal-600 rounded h-7"></div>
                  <div className="flex-1 bg-white border-2 border-teal-600 rounded h-7"></div>
                </div>
              </div>
              <h4 className="font-semibold text-slate-800">Client Booking</h4>
              <p className="text-sm text-slate-600">Clients book walks instantly</p>
            </div>
          </div>
        </section>

        <section className="mb-32 bg-teal-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-16 rounded-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">What Business Owners Say</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <p className="text-slate-700 mb-4 italic">
                  "We cut admin work by 70% in the first week. My walkers actually like using it."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center text-teal-700 font-bold">
                    R
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Rachel</p>
                    <p className="text-sm text-slate-600">Paws & Co.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <p className="text-slate-700 mb-4 italic">
                  "Finally, a system built for dog walkers by someone who gets it. Game changer."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center text-teal-700 font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Marcus</p>
                    <p className="text-sm text-slate-600">Urban Tails</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <p className="text-slate-700 mb-4 italic">
                  "The client portal alone saved us hours every week. Customers love it too."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center text-teal-700 font-bold">
                    S
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Sarah</p>
                    <p className="text-sm text-slate-600">Happy Hounds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-32">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple pricing for growing businesses.
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              One plan. Unlimited clients, staff and bookings.
              <br />
              Real pricing launches soon.
            </p>
            <Link 
              to="/register" 
              className="inline-block px-8 py-4 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-lg"
            >
              Join the Waitlist
            </Link>
          </div>
        </section>

        <section className="mb-32 bg-slate-900 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-20 rounded-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to simplify your entire dog-walking business?
            </h2>
            <Link 
              to="/register" 
              className="inline-block px-10 py-5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-500 transition-colors text-lg shadow-xl"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </div>

      <Footer onNav={(path) => navigate(path)} />
    </div>
  );
}
