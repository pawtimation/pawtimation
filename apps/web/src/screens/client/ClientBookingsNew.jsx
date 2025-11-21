import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../../components/mobile/MobileEmptyState';
import { MobileCard } from '../../components/mobile/MobileCard';

export function ClientBookingsNew() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const response = await api('/bookings/mine');
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const upcomingBookings = bookings
    .filter(b => {
      const bookingTime = new Date(b.dateTime || b.start);
      return bookingTime >= now && b.status?.toUpperCase() !== 'CANCELLED';
    })
    .sort((a, b) => new Date(a.dateTime || a.start) - new Date(b.dateTime || b.start));

  const pastBookings = bookings
    .filter(b => {
      const bookingTime = new Date(b.dateTime || b.start);
      return bookingTime < now || b.status?.toUpperCase() === 'CANCELLED';
    })
    .sort((a, b) => new Date(b.dateTime || b.start) - new Date(a.dateTime || a.start));

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-200 text-slate-600';
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';
      case 'EN ROUTE': return 'bg-purple-100 text-purple-800';
      case 'STARTED': return 'bg-amber-100 text-amber-800';
      case 'COMPLETED': return 'bg-teal-100 text-teal-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Awaiting Approval';
      case 'BOOKED': return 'Confirmed';
      case 'EN ROUTE': return 'En Route';
      case 'STARTED': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status || 'Unknown';
    }
  }

  async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await api(`/bookings/${bookingId}/update`, {
        method: 'POST',
        body: JSON.stringify({ status: 'CANCELLED' })
      });

      if (response.ok) {
        loadBookings();
      } else {
        alert('Failed to cancel booking');
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking');
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <MobilePageHeader 
          title="My Bookings" 
          subtitle="View and manage your appointments"
        />
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {displayBookings.length === 0 ? (
          <MobileEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title={activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
            message={activeTab === 'upcoming' ? 'Book your first dog walk!' : 'Your booking history will appear here'}
          />
        ) : (
          displayBookings.map(booking => (
            <MobileCard 
              key={booking.id}
              onClick={() => navigate(`/client/bookings/${booking.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  {dayjs(booking.dateTime || booking.start).format('MMM D, YYYY')}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-base font-bold text-slate-900">
                    {dayjs(booking.dateTime || booking.start).format('h:mm A')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-700">
                    {booking.dogNames?.join(', ') || 'Your dog(s)'}
                  </p>
                </div>

                {booking.staffName && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm text-slate-700">{booking.staffName}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-sm font-medium text-slate-900">{booking.serviceName}</span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </MobileCard>
          ))
        )}
      </div>

      {activeTab === 'upcoming' && (
        <div className="text-center pt-4">
          <button
            onClick={() => navigate('/client/book')}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-sm"
          >
            Book New Walk
          </button>
        </div>
      )}
    </div>
  );
}
