import { useEffect, useState } from "react";
import { api } from "../lib/auth";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { RouteDisplay, RouteGenerator } from "../components/RouteDisplay";
import { buildNavigationURL } from "../lib/navigationUtils";
import { getBookingMessages, sendMessage, markBookingRead } from "../lib/messagesApi";
import { MobileCard } from "../components/mobile/MobileCard";

export function StaffMobileJobDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [bookingRoute, setBookingRoute] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  async function load() {
    setLoading(true);
    
    try {
      const jobRes = await api(`/bookings/${bookingId}`);
      if (!jobRes.ok) {
        if (jobRes.status === 404) {
          setError("Job not found");
        } else if (jobRes.status === 403) {
          setError("You don't have permission to view this job");
        } else {
          setError("Failed to load job");
        }
        setLoading(false);
        return;
      }
      const jobData = await jobRes.json();
      
      setJob(jobData);
      setError(null);
      
      if (jobData.route) {
        setBookingRoute(jobData.route);
      } else {
        setBookingRoute(null);
      }

      if (jobData.businessId) {
        try {
          const msgs = await getBookingMessages(jobData.businessId, bookingId);
          setMessages(msgs || []);
          await markBookingRead(jobData.businessId, bookingId, "staff");
        } catch (msgErr) {
          console.error("Failed to load messages:", msgErr);
        }
      }

      setLoading(false);
    } catch (e) {
      console.error("Failed to load job", e);
      setError("An error occurred while loading the job");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [bookingId]);

  async function markComplete() {
    if (!confirm("Mark this job as completed?")) return;
    
    setMarkingComplete(true);
    try {
      const res = await api(`/bookings/${bookingId}/update`, {
        method: 'POST',
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to mark as complete';
        alert(`Could not mark as complete: ${errorMessage}`);
        setMarkingComplete(false);
        return;
      }
      
      await load();
      setMarkingComplete(false);
    } catch (err) {
      console.error("Mark complete error", err);
      alert("Could not mark as complete. Please try again.");
      setMarkingComplete(false);
    }
  }

  async function confirmBooking() {
    try {
      const res = await api(`/bookings/${bookingId}/staff-confirm`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to confirm: ${errorData.error || 'Unknown error'}`);
        return;
      }

      await load();
    } catch (err) {
      console.error('Failed to confirm booking:', err);
      alert('Failed to confirm booking. Please try again.');
    }
  }

  async function declineBooking() {
    if (!confirm('Decline this booking? It will be sent back to the admin for reassignment.')) return;

    try {
      const res = await api(`/bookings/${bookingId}/staff-decline`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to decline: ${errorData.error || 'Unknown error'}`);
        return;
      }

      navigate('/staff');
    } catch (err) {
      console.error('Failed to decline booking:', err);
      alert('Failed to decline booking. Please try again.');
    }
  }

  async function cancelBooking() {
    if (!confirm('Cancel this booking? This will cancel it for the client as well.')) return;

    try {
      const res = await api(`/bookings/${bookingId}/staff-cancel`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to cancel: ${errorData.error || 'Unknown error'}`);
        return;
      }

      await load();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim() || !job) return;

    setSendingMessage(true);
    try {
      const ptUser = localStorage.getItem('pt_user');
      if (!ptUser) {
        alert('Authentication error');
        return;
      }

      await sendMessage({
        businessId: job.businessId,
        clientId: job.clientId,
        bookingId: bookingId,
        senderRole: "staff",
        message: messageInput.trim()
      });

      setMessageInput("");
      
      const msgs = await getBookingMessages(job.businessId, bookingId);
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

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 pt-6">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 pt-6">
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
            <p className="text-rose-800 font-semibold">{error}</p>
          </div>
          <button
            onClick={load}
            className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/staff/jobs')}
            className="w-full px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 pt-6">
        <p className="text-slate-600">Job not found</p>
      </div>
    );
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

  const isCompleted = job.status?.toUpperCase() === 'COMPLETED' || job.status?.toUpperCase() === 'COMPLETE';
  const isCancelled = job.status?.toUpperCase() === 'CANCELLED';
  const isPending = job.status?.toUpperCase() === 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-6 pb-24 space-y-6">
      <div>
        <button
          onClick={() => navigate('/staff/jobs')}
          className="flex items-center gap-2 text-teal-600 font-semibold mb-4 hover:text-teal-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{job.clientName}</h1>
        <p className="text-base text-slate-600 mt-1">
          {dayjs(job.start).format("ddd D MMM • HH:mm")}
        </p>
        <div className="mt-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
            {getStatusText(job.status)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl">
          <p className="text-rose-800 font-semibold mb-2">{error}</p>
          <button
            onClick={load}
            className="text-sm text-rose-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && job && (
        <div className="p-3 bg-teal-50 border-2 border-teal-200 rounded-xl">
          <p className="text-teal-800 text-sm font-medium">Reloading job data…</p>
        </div>
      )}

      {!isCompleted && !isCancelled && (
        <MobileCard>
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Walking Route
          </h3>
          
          {bookingRoute ? (
            <div className="space-y-3">
              <RouteDisplay 
                route={bookingRoute}
                onNavigate={() => {
                  const coords = bookingRoute.geojson?.geometry?.coordinates;
                  const url = buildNavigationURL(job.lat, job.lng, coords);
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                showNavigation={true}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const appleUrl = `maps://?daddr=${job.lat},${job.lng}&dirflg=w`;
                    window.open(appleUrl, '_blank');
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
                    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}&travelmode=walking`;
                    window.open(googleUrl, '_blank');
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
                href={`/api/bookings/${bookingId}/download-gpx`}
                download
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download GPX File
              </a>
              
              <button
                onClick={async () => {
                  if (confirm('Generate a new route? This will replace the current one.')) {
                    try {
                      const response = await api(`/bookings/${bookingId}/generate-route`, {
                        method: 'POST'
                      });
                      if (response.ok) {
                        const data = await response.json();
                        setBookingRoute(data.route);
                        alert('New route generated successfully!');
                      } else {
                        alert('Failed to generate route');
                      }
                    } catch (err) {
                      console.error('Route generation error:', err);
                      alert('Failed to generate route');
                    }
                  }
                }}
                className="w-full px-4 py-2 border-2 border-teal-600 text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition-colors text-sm"
              >
                Regenerate Route
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">No walking route generated yet. Click below to generate a suggested route based on the service duration.</p>
              <RouteGenerator 
                bookingId={bookingId}
                onRouteGenerated={(newRoute) => {
                  setBookingRoute(newRoute);
                  alert('Route generated successfully!');
                }}
              />
            </div>
          )}
        </MobileCard>
      )}

      <MobileCard>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Client Details</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-base font-semibold text-slate-900">{job.clientName}</p>
          </div>
          {job.addressLine1 && (
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-slate-700">{job.addressLine1}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.addressLine1)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 underline mt-1 inline-block"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </MobileCard>

      <MobileCard>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Job Details</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Service</p>
            <p className="text-base text-slate-900">{job.serviceName || 'N/A'}</p>
          </div>
          {job.dogNames && job.dogNames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Dogs</p>
              <p className="text-base text-slate-900">{job.dogNames.join(', ')}</p>
            </div>
          )}
          {job.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>
      </MobileCard>

      <MobileCard>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Messages with Client</h3>
        
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl ${
                  msg.senderRole === "staff" 
                    ? "bg-teal-50 ml-8" 
                    : "bg-slate-100 mr-8"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-slate-700">
                    {msg.senderRole === "staff" ? "You" : job.clientName || "Client"}
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

      {isPending && (
        <div className="space-y-3">
          <MobileCard>
            <p className="text-sm font-semibold text-slate-700 mb-3">Review this booking:</p>
            <div className="space-y-2">
              <button
                onClick={confirmBooking}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
              >
                ✓ Confirm Booking
              </button>
              <button
                onClick={declineBooking}
                className="w-full px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                ← Decline (Send Back to Admin)
              </button>
              <button
                onClick={cancelBooking}
                className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
              >
                ✕ Cancel Booking
              </button>
            </div>
          </MobileCard>
        </div>
      )}

      {!isCompleted && !isCancelled && !isPending && (
        <button
          onClick={markComplete}
          disabled={markingComplete}
          className="w-full px-4 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {markingComplete ? 'Marking Complete…' : '✓ Mark Job Complete'}
        </button>
      )}

      {isCompleted && (
        <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-xl text-center">
          <p className="text-teal-800 font-semibold">✓ This job has been completed</p>
        </div>
      )}
    </div>
  );
}
