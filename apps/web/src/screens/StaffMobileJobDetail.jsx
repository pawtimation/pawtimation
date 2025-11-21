import { useEffect, useState } from "react";
import { api } from "../lib/auth";
import dayjs from "dayjs";
import { useParams, Link, useNavigate } from "react-router-dom";
import { RouteDisplay, RouteGenerator } from "../components/RouteDisplay";
import { buildNavigationURL } from "../lib/navigationUtils";
import { getBookingMessages, sendMessage, markBookingRead } from "../lib/messagesApi";

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
      
      // Load route if it exists
      if (jobData.route) {
        setBookingRoute(jobData.route);
      } else {
        setBookingRoute(null);
      }

      // Load messages for this booking
      if (jobData.businessId) {
        try {
          const msgs = await getBookingMessages(jobData.businessId, bookingId);
          setMessages(msgs || []);
          // Mark as read
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
      
      // Reload to show updated status
      await load();
      setMarkingComplete(false);
    } catch (err) {
      console.error("Mark complete error", err);
      alert("Could not mark as complete. Please try again.");
      setMarkingComplete(false);
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

      const userData = JSON.parse(ptUser);

      await sendMessage({
        businessId: job.businessId,
        clientId: job.clientId,
        bookingId: bookingId,
        senderRole: "staff",
        message: messageInput.trim()
      });

      setMessageInput("");
      
      // Reload messages
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

  // Initial loading (no job data yet)
  if (loading && !job) {
    return (
      <div className="p-4">
        <p className="text-slate-600 text-sm">Loading job…</p>
      </div>
    );
  }

  // Error with no job data (initial load failed)
  if (error && !job) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={load}
          className="w-full bg-teal-700 text-white p-3 rounded"
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/staff/jobs')}
          className="w-full border border-slate-300 text-slate-700 p-3 rounded"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4">
        <p className="text-slate-600 text-sm">Job not found</p>
      </div>
    );
  }

  const isCompleted = job.status?.toUpperCase() === 'COMPLETED' || job.status?.toUpperCase() === 'COMPLETE';
  const isCancelled = job.status?.toUpperCase() === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-teal-700 text-white p-4">
        <button
          onClick={() => navigate('/staff/jobs')}
          className="text-white text-sm mb-2"
        >
          ← Back to Jobs
        </button>
        <h1 className="text-xl font-semibold">{job.clientName}</h1>
        <p className="text-sm text-teal-100">
          {dayjs(job.start).format("ddd D MMM • HH:mm")}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Error banner (shown when reload fails but we have cached job data) */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm font-medium">{error}</p>
            <button
              onClick={load}
              className="mt-2 text-sm text-red-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Reload indicator (shown when reloading with cached data) */}
        {loading && job && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
            <p className="text-teal-800 text-sm">Reloading job data…</p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isCompleted ? 'bg-emerald-100 text-emerald-800' :
            isCancelled ? 'bg-slate-200 text-slate-700' :
            'bg-teal-100 text-teal-800'
          }`}>
            {job.status?.toLowerCase() || 'pending'}
          </span>
        </div>

        {/* Walking Route - STAFF CAN GENERATE & NAVIGATE */}
        {job.lat && job.lng && !isCompleted && !isCancelled && (
          <div className="p-4 border-2 border-teal-700 rounded-lg bg-white space-y-4">
            <h3 className="font-semibold text-lg text-teal-900 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Walking Route
            </h3>
            
            {bookingRoute ? (
              <>
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
                
                {/* Navigation & Download Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const appleUrl = `maps://?daddr=${job.lat},${job.lng}&dirflg=w`;
                      window.open(appleUrl, '_blank');
                    }}
                    className="px-4 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"
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
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    Google Maps
                  </button>
                </div>
                
                {/* Regenerate Button */}
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
                  className="w-full px-4 py-2 border-2 border-teal-600 text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors text-sm"
                >
                  Regenerate Route
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">No walking route generated yet. Click below to generate a suggested route based on the service duration.</p>
                <RouteGenerator 
                  bookingId={bookingId}
                  onRouteGenerated={(newRoute) => {
                    setBookingRoute(newRoute);
                    alert('Route generated successfully!');
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Client Address */}
        <div className="p-4 border rounded-md bg-white">
          <p className="font-medium text-sm text-slate-600 mb-1">Client Address</p>
          <p className="font-medium">{job.clientName}</p>
          <p className="text-sm text-slate-600">{job.addressLine1 || 'No address'}</p>
          {job.addressLine1 && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(job.addressLine1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-700 underline mt-1 inline-block"
            >
              Open Address in Maps
            </a>
          )}
        </div>

        {/* Dogs */}
        {job.dogs && job.dogs.length > 0 && (
          <div className="p-4 border rounded-md bg-white">
            <p className="font-medium text-sm text-slate-600 mb-2">Dogs</p>
            {job.dogs.map(d => (
              <div key={d.dogId || d.id} className="flex items-center gap-2 py-1">
                <span className="text-2xl">🐕</span>
                <p className="text-sm font-medium">{d.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Service Details */}
        <div className="p-4 border rounded-md bg-white space-y-3">
          <div>
            <p className="text-sm text-slate-600">Service</p>
            <p className="font-medium">{job.serviceName || 'Unknown Service'}</p>
          </div>
          
          <div>
            <p className="text-sm text-slate-600">Start Time</p>
            <p className="font-medium">{dayjs(job.start).format("ddd D MMM YYYY • HH:mm")}</p>
          </div>

          {job.end && (
            <div>
              <p className="text-sm text-slate-600">End Time</p>
              <p className="font-medium">{dayjs(job.end).format("HH:mm")}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="p-4 border rounded-md bg-white">
            <p className="font-medium text-sm text-slate-600 mb-1">Notes</p>
            <p className="text-sm text-slate-700">{job.notes}</p>
          </div>
        )}

        {/* Messages Section */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-semibold text-slate-900">Messages with Client</h3>
          </div>
          
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto" style={{scrollBehavior: 'smooth'}}>
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
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

          <div className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                rows={2}
                disabled={sendingMessage}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendingMessage}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
          </div>
        </div>

        {/* Action Buttons */}
        {!isCompleted && !isCancelled && (
          <div className="space-y-3">
            <button
              onClick={markComplete}
              disabled={markingComplete}
              className="w-full bg-emerald-600 text-white p-4 rounded-lg font-semibold disabled:opacity-50"
            >
              {markingComplete ? 'Marking Complete…' : '✓ Mark Job Complete'}
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <p className="text-emerald-800 font-medium">✓ This job has been completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
