import { useState, useEffect, useRef } from "react";
import { staffApi } from '../lib/auth';
import { getBookingMessages, sendMessage, markBookingRead } from "../lib/messagesApi";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function StaffMessages() {
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function load() {
    try {
      const ptUser = localStorage.getItem('pt_user');
      
      if (!ptUser) {
        console.error('Missing staff authentication');
        return;
      }

      const userData = JSON.parse(ptUser);
      const staffId = userData.id;

      const response = await staffApi(`/bookings/list?staffId=${staffId}`);
      if (response.ok) {
        const allBookings = await response.json();
        const activeBookings = allBookings.filter(b => 
          b.status?.toUpperCase() !== 'CANCELLED' && 
          b.clientName
        );
        setBookings(activeBookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function loadMessages() {
    if (!activeBooking || !activeBooking.businessId) return;

    try {
      const msgs = await getBookingMessages(activeBooking.businessId, activeBooking.id);
      setMessages(msgs || []);
      await markBookingRead(activeBooking.businessId, activeBooking.id, "staff");
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [activeBooking]);

  async function handleSend() {
    if (!input.trim() || !activeBooking) return;

    try {
      await sendMessage({
        businessId: activeBooking.businessId,
        bookingId: activeBooking.id,
        senderRole: "staff",
        message: input.trim()
      });

      setInput("");
      loadMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-600">Loading messages…</p>
      </div>
    );
  }

  function handleSelectBooking(booking) {
    setActiveBooking(booking);
    setShowChat(true);
  }

  function handleBackToList() {
    setShowChat(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
      <div className="h-auto lg:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-0 lg:gap-6 lg:px-4">
        {/* LEFT PANEL - Booking List */}
        <div className={`${showChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-slate-200`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Messages</h2>
            <p className="text-sm text-slate-600">Chat with your clients</p>
          </div>

          {/* Booking List */}
          <div className="flex-1 overflow-y-auto">
            {bookings.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-slate-900 mb-1">No active bookings</h3>
                <p className="text-xs text-slate-500">You have no clients to message</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => handleSelectBooking(booking)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      activeBooking?.id === booking.id ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm text-slate-900">{booking.clientName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-1.5">
                      🐕 {booking.dogNames?.join(', ') || 'No dogs assigned'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dayjs(booking.dateTime || booking.start).format('MMM D, h:mm A')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - Message Thread */}
        <div className={`${!showChat && activeBooking ? 'hidden lg:flex' : showChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white lg:rounded-xl lg:shadow-sm lg:border lg:border-slate-200`}>
          {!activeBooking ? (
          // Empty State
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Select a booking to view messages</h3>
              <p className="text-sm text-slate-600">
                Choose a booking from the list on the left to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToList}
                  className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                  {activeBooking.clientName?.split(' ').map(n => n.charAt(0)).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{activeBooking.clientName}</h3>
                  <p className="text-xs text-slate-600">
                    {activeBooking.dogNames?.join(', ') || 'No dogs assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-500 mt-1">Start the conversation below</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.senderRole === "staff" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          m.senderRole === "staff"
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      </div>
                      <p className={`text-xs text-slate-500 mt-1.5 px-1 ${m.senderRole === "staff" ? "text-right" : "text-left"}`}>
                        {dayjs(m.createdAt).format('MMM D, h:mm A')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {input.trim() ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  ) : (
                    <span className="text-sm">Send</span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
