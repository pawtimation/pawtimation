import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientApi } from '../../lib/auth';
import { RouteDisplay } from '../../components/RouteDisplay';
import { ReadOnlyRouteMap } from '../../components/ReadOnlyRouteMap';
import { buildNavigationURL } from '../../lib/navigationUtils';
import { MobilePageHeader } from '../../components/mobile/MobilePageHeader';
import { MobileCard } from '../../components/mobile/MobileCard';
import { getBookingMessages, sendMessage, markBookingRead } from '../../lib/messagesApi';
import dayjs from 'dayjs';

export function ClientBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function loadBooking() {
    try {
      setLoading(true);
      const response = await clientApi(`/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load booking');
      }
      
      const data = await response.json();
      setBooking(data);
      
      if (data.businessId) {
        try {
          const msgs = await getBookingMessages(data.businessId, id);
          setMessages(msgs || []);
          await markBookingRead(data.businessId, id, 'client');
        } catch (msgErr) {
          console.error('Failed to load messages:', msgErr);
        }
      }
    } catch (err) {
      console.error('Failed to load booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSendMessage() {
    if (!messageInput.trim() || !booking) return;

    setSendingMessage(true);
    try {
      await sendMessage({
        businessId: booking.businessId,
        clientId: booking.clientId,
        bookingId: id,
        senderRole: 'client',
        message: messageInput.trim()
      });

      setMessageInput('');
      
      const msgs = await getBookingMessages(booking.businessId, id);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function handleGenerateRoute() {
    try {
      const response = await clientApi(`/bookings/${id}/generate-route`, {
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
            <p className="text-xs font-semibold text-slate-500 mb-1">Start Time</p>
            <p className="text-base text-slate-900">{dayjs(booking.start).format('h:mm A')}</p>
          </div>

          {booking.end && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">End Time</p>
              <p className="text-base text-slate-900">{dayjs(booking.end).format('h:mm A')}</p>
            </div>
          )}

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

          <ReadOnlyRouteMap 
            route={booking.route}
            homeLocation={booking.lat && booking.lng ? [booking.lat, booking.lng] : null}
          />

          <div className="mt-4 space-y-2">
            <button
              onClick={handleNavigate}
              className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm flex items-center justify-center gap-2"
              style={{ minHeight: '44px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Start Navigation
            </button>

            <a
              href={`${window.location.origin}/api/bookings/${id}/download-gpx`}
              download
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2 block"
              style={{ minHeight: '44px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download GPX File
            </a>
          </div>
        </MobileCard>
      )}

      <MobileCard>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Message Walker
        </h3>

        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl ${
                  msg.senderRole === 'client' 
                    ? 'bg-teal-50 ml-8' 
                    : 'bg-slate-100 mr-8'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-slate-700">
                    {msg.senderRole === 'client' ? 'You' : booking.staffName || 'Walker'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dayjs(msg.createdAt).format('MMM D, h:mm A')}
                  </p>
                </div>
                <p className="text-sm text-slate-900 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-600 resize-none"
            rows={2}
            disabled={sendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            className="px-4 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {sendingMessage ? (
              <span className="text-xs">Sending...</span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </MobileCard>
    </div>
  );
}
