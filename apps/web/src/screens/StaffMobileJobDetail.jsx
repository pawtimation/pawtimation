import { useEffect, useState } from "react";
import { staffApi, getSession } from "../lib/auth";
import dayjs from "dayjs";
import { useParams, useNavigate } from "react-router-dom";
import { RouteDisplay, RouteGenerator } from "../components/RouteDisplay";
import { InteractiveRouteMap } from "../components/LazyMap";
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
  
  // Walk Media state
  const [walkMedia, setWalkMedia] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  async function loadWalkMedia() {
    try {
      const response = await staffApi(`/media/job/${bookingId}`);
      if (response.ok) {
        const media = await response.json();
        setWalkMedia(media || []);
      }
    } catch (err) {
      console.error('Failed to load walk media:', err);
    }
  }

  async function handleMediaUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingMedia(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await staffApi(`/media/upload/job/${bookingId}`, {
        method: 'POST',
        body: formData,
        headers: {}
      });

      if (response.ok) {
        await loadWalkMedia();
        // Reset file input
        event.target.value = '';
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload media');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('An error occurred while uploading');
    } finally {
      setUploadingMedia(false);
    }
  }

  async function load() {
    setLoading(true);
    
    try {
      const jobRes = await staffApi(`/bookings/${bookingId}`);
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

      // Load walk media
      await loadWalkMedia();

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
      const res = await staffApi(`/bookings/${bookingId}/update`, {
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
      const res = await staffApi(`/bookings/${bookingId}/staff-confirm`, {
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
      const res = await staffApi(`/bookings/${bookingId}/staff-decline`, {
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
      const res = await staffApi(`/bookings/${bookingId}/staff-cancel`, {
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
      const session = getSession('STAFF');
      if (!session) {
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
          
          <InteractiveRouteMap
            homeLocation={[job.lat, job.lng]}
            initialWaypoints={bookingRoute?.waypoints || []}
            editable={true}
            role="staff"
            onRouteUpdate={async (newRoute) => {
              try {
                const response = await staffApi(`/bookings/${bookingId}/update`, {
                  method: 'POST',
                  body: JSON.stringify({ route: newRoute })
                });
                if (response.ok) {
                  setBookingRoute(newRoute);
                }
              } catch (err) {
                console.error('Failed to save route:', err);
              }
            }}
          />
          
          {bookingRoute && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  const coords = bookingRoute.geojson?.geometry?.coordinates;
                  const url = buildNavigationURL(job.lat, job.lng, coords);
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm flex items-center justify-center gap-2"
                style={{ minHeight: '44px' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Start Navigation
              </button>
              
              <a
                href={`/api/bookings/${bookingId}/download-gpx`}
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
          )}
        </MobileCard>
      )}

      {/* Walk Media Gallery */}
      <MobileCard>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Walk Photos
        </h3>

        {!isCompleted && !isCancelled && (
          <div className="mb-4">
            <input
              type="file"
              id="media-upload"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleMediaUpload}
              className="hidden"
              disabled={uploadingMedia}
            />
            <label
              htmlFor="media-upload"
              className={`w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm flex items-center justify-center gap-2 ${uploadingMedia ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              style={{ minHeight: '44px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {uploadingMedia ? 'Uploading...' : '📸 Add Photo/Video'}
            </label>
          </div>
        )}

        {walkMedia.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
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
                  <video 
                    src={media.downloadUrl}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(media.downloadUrl, '_blank')}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </video>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{media.uploaderName}</p>
                  <p className="text-white text-xs opacity-80">{dayjs(media.createdAt).format('HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 text-sm">No photos yet</p>
            {!isCompleted && !isCancelled && (
              <p className="text-slate-400 text-xs mt-1">Add photos during the walk</p>
            )}
          </div>
        )}
      </MobileCard>

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
            <p className="text-xs font-semibold text-slate-500 mb-1">Start Time</p>
            <p className="text-base text-slate-900">{dayjs(job.start).format('h:mm A')}</p>
          </div>
          {job.end && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">End Time</p>
              <p className="text-base text-slate-900">{dayjs(job.end).format('h:mm A')}</p>
            </div>
          )}
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
