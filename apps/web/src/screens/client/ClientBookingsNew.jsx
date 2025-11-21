import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/auth';
import dayjs from 'dayjs';

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
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'BOOKED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-slate-200 text-slate-700';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'BOOKED': return 'Confirmed';
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
      <div className="p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">My Bookings</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'past'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        {displayBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No {activeTab} bookings
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {activeTab === 'upcoming' ? 'Book your next walk today!' : 'Your booking history will appear here'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/client/book')}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Book a Walk
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayBookings.map(booking => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                onCancel={cancelBooking}
                navigate={navigate}
                isUpcoming={activeTab === 'upcoming'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, navigate, isUpcoming }) {
  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'BOOKED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-slate-200 text-slate-700';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Pending';
      case 'BOOKED': return 'Confirmed';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status || 'Unknown';
    }
  }

  const status = booking.status?.toUpperCase();
  const canCancel = isUpcoming && (status === 'PENDING' || status === 'BOOKED');
  const canEdit = isUpcoming && status === 'PENDING';

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => navigate(`/client/bookings/${booking.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {dayjs(booking.dateTime || booking.start).format('ddd, MMM D')}
            </p>
            <p className="text-sm text-slate-600">
              {dayjs(booking.dateTime || booking.start).format('h:mm A')}
            </p>
          </div>
          {booking.price && (
            <div className="text-right">
              <p className="text-lg font-bold text-teal-700">${booking.price}</p>
            </div>
          )}
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{booking.dogNames?.join(', ') || 'No dogs assigned'}</span>
          </div>

          {booking.staffName && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{booking.staffName}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{booking.serviceName}</span>
          </div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <button
              onClick={() => navigate(`/client/bookings/${booking.id}/edit`)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
          )}
          
          {booking.status?.toUpperCase() === 'COMPLETED' && (
            <button
              onClick={() => navigate(`/client/bookings/${booking.id}/invoice`)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              View Invoice
            </button>
          )}

          {booking.staffName && (
            <button
              onClick={() => navigate(`/client/messages/${booking.id}`)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Message
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex-1 px-3 py-2 text-sm border border-rose-300 text-rose-700 rounded-lg font-medium hover:bg-rose-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {booking.status?.toUpperCase() === 'COMPLETED' && (
            <button
              onClick={() => navigate('/client/book')}
              className="flex-1 px-3 py-2 text-sm bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Rebook
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
