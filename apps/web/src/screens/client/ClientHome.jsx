import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../../components/mobile/MobileEmptyState';
import { MobileCard } from '../../components/mobile/MobileCard';
import { Paw } from '../../ui/Paw';

export function ClientHome() {
  const [nextBooking, setNextBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNextBooking();
  }, []);

  async function loadNextBooking() {
    try {
      const response = await api('/bookings/mine');
      if (response.ok) {
        const bookings = await response.json();
        
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
      console.error('Failed to load bookings:', err);
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

  return (
    <div className="space-y-6">
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

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/client/bookings/${nextBooking.id}`)}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  View Details
                </button>
                {nextBooking.staffName && (
                  <button
                    onClick={() => navigate(`/client/messages/${nextBooking.id}`)}
                    className="px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Message
                  </button>
                )}
              </div>
            </MobileCard>

            <MobileCard>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/client/book')}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
                >
                  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">New Booking</span>
                </button>

                <button
                  onClick={() => navigate('/client/bookings')}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
                >
                  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">All Bookings</span>
                </button>

                <button
                  onClick={() => navigate('/client/dogs')}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
                >
                  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">My Dogs</span>
                </button>

                <button
                  onClick={() => navigate('/client/invoices')}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-slate-200 rounded-xl hover:border-teal-600 hover:bg-teal-50 transition-all"
                >
                  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-900">Invoices</span>
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
      </div>
    </div>
  );
}
