import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientApi } from '../../lib/auth';
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
  const [walkMedia, setWalkMedia] = useState([]);

  useEffect(() => {
    loadBooking();
  }, [id]);

  async function loadWalkMedia() {
    try {
      const response = await clientApi(`/media/job/${id}`);
      if (response.ok) {
        const media = await response.json();
        setWalkMedia(media || []);
      }
    } catch (err) {
      console.error('Failed to load walk media:', err);
    }
  }

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

      await loadWalkMedia();
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

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BOOKED':
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
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
      case 'CONFIRMED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  }

  function canCancelBooking() {
    if (!booking) return false;
    const status = booking.status?.toUpperCase();
    return status === 'PENDING' || status === 'BOOKED' || status === 'CONFIRMED';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800 font-semibold">Failed to load booking</p>
            <button
              onClick={() => navigate('/client/bookings')}
              className="mt-3 text-sm text-red-700 underline"
            >
              Back to bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={() => navigate('/client/bookings')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Booking</h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {dayjs(booking.start).format('ddd D MMM • HH:mm')}
            </p>
          </div>
        </div>

        {/* CARD A: BOOKING DETAILS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Booking Details</h2>
          
          <div className="space-y-4">
            {/* Status Badge */}
            <div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </span>
            </div>

            {/* Start Time */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Start Time</p>
              <p className="text-base text-slate-900">{dayjs(booking.start).format('h:mm A')}</p>
            </div>

            {/* End Time */}
            {booking.end && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">End Time</p>
                <p className="text-base text-slate-900">{dayjs(booking.end).format('h:mm A')}</p>
              </div>
            )}

            {/* Service */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Service</p>
              <p className="text-base text-slate-900">{booking.serviceName || 'Walk'}</p>
            </div>

            {/* Dogs */}
            {booking.dogNames && booking.dogNames.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Dog(s)</p>
                <p className="text-base text-slate-900">{booking.dogNames.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* CARD B: LOCATION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
          
          {booking.addressLine1 || booking.address ? (
            <div className="space-y-3">
              <p className="text-base text-slate-900">
                {booking.addressLine1 || booking.address}
                {booking.city && `, ${booking.city}`}
                {booking.postcode && ` ${booking.postcode}`}
              </p>
              {booking.lat && booking.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${booking.lat},${booking.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Open in Maps
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No location specified</p>
          )}
        </div>

        {/* CARD C: NOTES */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Notes</h2>
          
          {booking.notes ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {booking.notes}
            </p>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-500">No notes for this walk.</p>
            </div>
          )}
        </div>

        {/* CARD D: WALK PHOTOS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Walk Photos</h2>
          
          {walkMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {walkMedia.map((media) => (
                <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  {media.mediaType === 'IMAGE' ? (
                    <img 
                      src={media.downloadUrl} 
                      alt="Walk photo"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(media.downloadUrl, '_blank')}
                    />
                  ) : (
                    <div 
                      className="relative w-full h-full cursor-pointer"
                      onClick={() => window.open(media.downloadUrl, '_blank')}
                    >
                      <video 
                        src={media.downloadUrl}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-white text-xs opacity-90">{dayjs(media.createdAt).format('HH:mm')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-lg">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-600 font-medium">Your walker will add photos here.</p>
              <p className="text-xs text-slate-500 mt-1">Photos will appear after your walk</p>
            </div>
          )}
        </div>

        {/* CARD E: MESSAGE YOUR WALKER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Walker Header */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              {booking.staffName ? booking.staffName.charAt(0).toUpperCase() : 'W'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Message Your Walker</h2>
              <p className="text-sm text-slate-600">{booking.staffName || 'Your Walker'}</p>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-slate-600">No messages yet</p>
                <p className="text-xs text-slate-500 mt-1">Send a message to your walker</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`p-3 rounded-lg ${
                        msg.senderRole === 'client' 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <p className={`text-xs text-slate-500 mt-1 px-1 ${msg.senderRole === 'client' ? 'text-right' : 'text-left'}`}>
                      {dayjs(msg.createdAt).format('h:mm A')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="flex gap-2">
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border border-slate-300 bg-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendingMessage}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {sendingMessage ? (
                <span className="text-sm">...</span>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* REQUEST CANCELLATION BUTTON (Optional) */}
        {canCancelBooking() && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Need to cancel?</h3>
                <p className="text-sm text-slate-600">
                  Request a cancellation and we'll get back to you as soon as possible.
                </p>
              </div>
              <button
                onClick={() => alert('Cancellation request functionality coming soon')}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Request Cancellation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
