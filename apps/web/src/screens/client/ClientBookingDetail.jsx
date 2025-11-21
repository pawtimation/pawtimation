import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/auth';
import { RouteDisplay } from '../../components/RouteDisplay';
import { buildNavigationURL } from '../../lib/navigationUtils';
import { MobilePageHeader } from '../../components/mobile/MobilePageHeader';
import { MobileCard } from '../../components/mobile/MobileCard';
import dayjs from 'dayjs';

export function ClientBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function loadBooking() {
    try {
      setLoading(true);
      const response = await api(`/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load booking');
      }
      
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateRoute() {
    try {
      const response = await api(`/bookings/${id}/generate-route`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate route');
      }
      
      const data = await response.json();
      setBooking({ ...booking, route: data.route });
    } catch (err) {
      console.error('Failed to generate route:', err);
      alert('Failed to generate route. Please try again.');
    }
  }

  function handleNavigate() {
    if (!booking || !booking.route || !booking.lat || !booking.lng) {
      alert('No navigation data available');
      return;
    }

    const coords = booking.route.geojson?.geometry?.coordinates;
    const url = buildNavigationURL(booking.lat, booking.lng, coords);
    
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Unable to open navigation');
    }
  }

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'BOOKED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  function getStatusText(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Awaiting Approval';
      case 'BOOKED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-semibold">Failed to load booking</p>
          <button
            onClick={() => navigate('/client/bookings')}
            className="mt-2 text-sm text-red-700 underline"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/client/bookings')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <MobilePageHeader 
          title={booking.clientName || 'Booking Detail'}
          subtitle={dayjs(booking.start).format('ddd D MMM • HH:mm')}
        />
      </div>

      <MobileCard>
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Time</p>
            <p className="text-base text-slate-900">{dayjs(booking.start).format('h:mm A')}</p>
          </div>

          {booking.addressLine1 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Your Location</p>
              <p className="text-sm text-slate-700">{booking.addressLine1}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Service</p>
            <p className="text-base text-slate-900">{booking.serviceName || 'N/A'}</p>
          </div>

          {booking.dogNames && booking.dogNames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Dogs</p>
              <p className="text-base text-slate-900">{booking.dogNames.join(', ')}</p>
            </div>
          )}

          {booking.staffName && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Walker</p>
              <p className="text-base text-slate-900">{booking.staffName}</p>
            </div>
          )}

          {booking.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
        </div>
      </MobileCard>

      {booking.route && (
        <MobileCard>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Walking Route
          </h3>

          <RouteDisplay 
            route={booking.route}
            onNavigate={handleNavigate}
            showNavigation={true}
          />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={() => {
                if (booking.lat && booking.lng) {
                  const appleUrl = `maps://?daddr=${booking.lat},${booking.lng}&dirflg=w`;
                  window.open(appleUrl, '_blank');
                }
              }}
              className="px-4 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.5 2.75L12 5.25L9.5 2.75L6 6.25V19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19V6.25L14.5 2.75Z"/>
              </svg>
              Apple Maps
            </button>
            
            <button
              onClick={() => {
                if (booking.lat && booking.lng) {
                  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.lat},${booking.lng}&travelmode=walking`;
                  window.open(googleUrl, '_blank');
                }
              }}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              Google Maps
            </button>
          </div>

          <a
            href={`${window.location.origin}/api/bookings/${id}/download-gpx`}
            download
            className="w-full mt-3 px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download GPX File
          </a>

          <button
            onClick={handleGenerateRoute}
            className="w-full mt-2 px-4 py-2 border-2 border-teal-600 text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition-colors text-sm"
          >
            Regenerate Route
          </button>
        </MobileCard>
      )}
    </div>
  );
}
