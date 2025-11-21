import { useEffect, useState } from "react";
import { api } from "../lib/auth";
import dayjs from "dayjs";
import { useParams, Link, useNavigate } from "react-router-dom";
import { RouteDisplay } from "../components/RouteDisplay";
import { buildNavigationURL } from "../lib/navigationUtils";

export function StaffMobileJobDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [bookingRoute, setBookingRoute] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);

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

        {/* Walking Route - PROMINENT PLACEMENT FOR STAFF (VIEW-ONLY) */}
        {job.lat && job.lng && bookingRoute && !isCompleted && !isCancelled && (
          <div className="p-4 border-2 border-teal-700 rounded-lg bg-white space-y-3">
            <p className="font-semibold text-lg text-teal-900">🗺️ Walking Route</p>
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
          </div>
        )}
        
        {/* No route available message */}
        {job.lat && job.lng && !bookingRoute && !isCompleted && !isCancelled && (
          <div className="p-4 border rounded-lg bg-slate-50">
            <p className="text-sm text-slate-600">📍 No walking route available yet. Contact admin to generate a route.</p>
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
