import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../../components/mobile/MobileEmptyState';
import { MobileCard } from '../../components/mobile/MobileCard';
import { Paw } from '../../ui/Paw';
import { ClientWelcomeModal } from '../../components/ClientWelcomeModal';

export function ClientHome() {
  const [nextBooking, setNextBooking] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [clientRes, bookingsRes, dogsRes] = await Promise.all([
        clientApi('/me'),
        clientApi('/bookings/mine'),
        clientApi('/dogs/list')
      ]);

      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
        
        if (!clientData.hasSeenWelcomeModal) {
          setShowWelcomeModal(true);
        }
      }

      if (dogsRes.ok) {
        const dogsData = await dogsRes.json();
        setDogs(Array.isArray(dogsData) ? dogsData : []);
      }

      if (bookingsRes.ok) {
        const bookings = await bookingsRes.json();
        setAllBookings(bookings);
        
        const upcoming = bookings
          .filter(b => {
            const bookingTime = new Date(b.dateTime || b.start);
            return bookingTime >= new Date() && b.status?.toUpperCase() !== 'CANCELLED';
          })
          .sort((a, b) => new Date(a.dateTime || a.start) - new Date(b.dateTime || b.start));
        
        if (upcoming.length > 0) {
          setNextBooking(upcoming[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-200 text-slate-600';
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';
      case 'COMPLETED': return 'bg-teal-100 text-teal-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Awaiting Approval';
      case 'BOOKED': return 'Confirmed';
      case 'COMPLETED': return 'Completed';
      default: return status || 'Unknown';
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="h-48 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  const recentActivity = allBookings
    .filter(b => b.status?.toUpperCase() === 'COMPLETED')
    .sort((a, b) => new Date(b.dateTime || b.start) - new Date(a.dateTime || a.start))
    .slice(0, 3);

  const upcomingBookings = allBookings
    .filter(b => {
      const bookingTime = new Date(b.dateTime || b.start);
      return bookingTime >= new Date() && b.status?.toUpperCase() !== 'CANCELLED';
    })
    .sort((a, b) => new Date(a.dateTime || a.start) - new Date(b.dateTime || b.start))
    .slice(0, 3);

  const firstName = client?.name?.split(' ')[0] || 'there';
  const primaryDog = dogs.length > 0 ? dogs[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-white -mx-4 -my-4 px-4 py-4">
      {showWelcomeModal && (
        <ClientWelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          clientName={firstName}
        />
      )}
      
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-5 shadow-sm border border-teal-100/50">
          <div className="flex items-center gap-4 mb-3">
            {dogs.length > 0 && (
              <div className="flex -space-x-2">
                {dogs.slice(0, 3).map((dog, idx) => (
                  <div 
                    key={dog.id}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 border-2 border-white flex items-center justify-center shadow-sm"
                    style={{ zIndex: 3 - idx }}
                  >
                    <svg className="w-6 h-6 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                  </div>
                ))}
                {dogs.length > 3 && (
                  <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-slate-600">+{dogs.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Hi, {firstName}!
          </h1>
          <p className="text-slate-600">
            {primaryDog 
              ? `Here's what's happening with ${primaryDog.name} today.`
              : `Welcome to your client portal.`
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center gap-3">
          <Paw className="w-10 h-10" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pawtimation</h2>
            <h1 className="text-base font-bold text-slate-900">Demo Dog Walking</h1>
            <p className="text-xs text-slate-500">Client Portal</p>
          </div>
        </div>

        <div className="space-y-6">
          {nextBooking ? (
          <>
            <MobileCard>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(nextBooking.status)}`}>
                  {getStatusText(nextBooking.status)}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {dayjs(nextBooking.dateTime || nextBooking.start).format('MMM D')}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg font-bold text-slate-900">
                    {dayjs(nextBooking.dateTime || nextBooking.start).format('h:mm A')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-base text-slate-700">
                    {nextBooking.dogNames?.join(', ') || 'Your dog(s)'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-base text-slate-700">
                    {nextBooking.staffName || 'Walker to be assigned'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-base text-slate-700">{nextBooking.serviceName}</p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => navigate(`/client/bookings/${nextBooking.id}`)}
                  className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </MobileCard>
          </>
        ) : (
          <MobileEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No upcoming bookings"
            message="Book your next dog walk today!"
          />
        )}

        {!nextBooking && (
          <div className="text-center">
            <button
              onClick={() => navigate('/client/book')}
              className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            >
              Book a Walk
            </button>
          </div>
        )}

        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
            {upcomingBookings.length > 0 && (
              <button
                onClick={() => navigate('/client/bookings')}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                View All
              </button>
            )}
          </div>
          
          {upcomingBookings.length > 0 ? (
            <div className="space-y-3">
              {upcomingBookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => navigate(`/client/bookings/${booking.id}`)}
                  className="p-3 border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {dayjs(booking.dateTime || booking.start).format('MMM D, h:mm A')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{booking.serviceName}</p>
                  {booking.dogNames?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{booking.dogNames.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-600 font-medium mb-3">No upcoming walks booked</p>
              <button
                onClick={() => navigate('/client/book')}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors text-sm"
              >
                Book a Walk
              </button>
            </div>
          )}
        </MobileCard>

        {recentActivity.length > 0 && (
          <MobileCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map(booking => (
                <div key={booking.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{booking.serviceName}</p>
                    <p className="text-xs text-slate-600">
                      {dayjs(booking.dateTime || booking.start).format('MMM D, YYYY')}
                      {booking.dogNames?.length > 0 && ` • ${booking.dogNames.join(', ')}`}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-teal-600">Completed</span>
                </div>
              ))}
            </div>
          </MobileCard>
        )}

        {primaryDog && (
          <MobileCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your Dog</h2>
              <button
                onClick={() => navigate('/client/dogs')}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                View All
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-8 h-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{primaryDog.name}</h3>
                <div className="space-y-1 mt-2">
                  {primaryDog.breed && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Breed:</span> {primaryDog.breed}</p>
                  )}
                  {primaryDog.age && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Age:</span> {primaryDog.age} {primaryDog.age === 1 ? 'year' : 'years'} old</p>
                  )}
                  {primaryDog.colour && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Colour:</span> {primaryDog.colour}</p>
                  )}
                </div>
              </div>
            </div>
          </MobileCard>
        )}

        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
            <button
              onClick={() => navigate('/client/invoices')}
              className="text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              View All
            </button>
          </div>
          <button
            onClick={() => navigate('/client/invoices')}
            className="w-full flex items-center justify-between p-4 border-2 border-slate-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">View Invoices</p>
                <p className="text-sm text-slate-600">Track payments and history</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </MobileCard>
        </div>
      </div>
    </div>
  );
}
