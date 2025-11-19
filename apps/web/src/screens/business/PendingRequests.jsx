import { useEffect, useState } from "react";
import { listPendingJobs, approveJob, declineJob } from "../../lib/jobApi";

export function PendingRequests() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await listPendingJobs();
      setJobs(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    try {
      await approveJob(id);
      await load();
    } catch (err) {
      alert('Failed to approve booking: ' + err.message);
    }
  }

  async function handleDecline(id) {
    if (!window.confirm("Decline this booking request?")) return;
    try {
      await declineJob(id);
      await load();
    } catch (err) {
      alert('Failed to decline booking: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Loading requests…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
        Error loading requests: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Pending Booking Requests</h1>

      {jobs.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-slate-600">No pending requests at the moment.</p>
          <p className="text-sm text-slate-500 mt-1">
            New booking requests from clients will appear here for your review.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {job.client?.name || "Client"} — {job.serviceName}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {new Date(job.start).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Pending
                </span>
              </div>

              {job.dogs && job.dogs.length > 0 && (
                <div className="text-sm">
                  <span className="text-slate-600">Dogs: </span>
                  <span className="text-slate-900 font-medium">
                    {job.dogs.map((d) => d.name).join(", ")}
                  </span>
                </div>
              )}

              {job.notes && (
                <div className="text-sm bg-slate-50 rounded p-2 border border-slate-200">
                  <p className="text-slate-700">{job.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(job.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Approve
                </button>

                <button
                  onClick={() => handleDecline(job.id)}
                  className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 hover:border-red-400 rounded-md text-sm font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
