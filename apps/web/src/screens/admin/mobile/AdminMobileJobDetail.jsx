import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";
import dayjs from "dayjs";
import { useParams, Link } from "react-router-dom";

export function AdminMobileJobDetail() {
  const { bookingId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

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
      
      // Only update job and clear errors on successful fetch (preserves old data on reload errors)
      setJob(jobData);
      setError(null); // Clear errors only after successful fetch
      setForm({
        start: jobData.start,
        serviceId: jobData.serviceId,
        staffId: jobData.staffId,
        status: jobData.status,
        priceCents: jobData.priceCents || 0
      });

      const servicesRes = await api("/services/list");
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(Array.isArray(servicesData) ? servicesData : []);
      }

      const staffRes = await api("/staff/list");
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
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

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    try {
      const res = await api(`/bookings/${bookingId}/update`, {
        method: 'POST',
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to update job';
        alert(`Could not save changes: ${errorMessage}`);
        return;
      }
      
      // Only reload and exit edit mode on success
      setEditing(false);
      load();
    } catch (err) {
      console.error("Save error", err);
      alert("Could not save changes. Please try again.");
    }
  }

  // Initial loading (no job data yet)
  if (loading && !job) {
    return <p className="text-slate-600 text-sm">Loading job…</p>;
  }

  // Error with no job data (initial load failed)
  if (error && !job) {
    return (
      <div className="space-y-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={load}
          className="w-full bg-teal-700 text-white p-3 rounded"
        >
          Retry
        </button>
        <Link
          to="/admin/m/jobs"
          className="block text-center w-full border border-slate-300 text-slate-700 p-3 rounded"
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return <p className="text-slate-600 text-sm">Job not found</p>;
  }

  return (
    <div className="space-y-6">

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

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Job Details</h1>
        <p className="text-sm text-slate-600">
          {job.clientName}
        </p>
      </div>

      {/* Client Info */}
      <div className="p-4 border rounded-md bg-white">
        <p className="font-medium">{job.clientName}</p>
        <p className="text-sm text-slate-600">{job.addressLine1 || 'No address'}</p>
        {job.addressLine1 && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(job.addressLine1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-teal-700 underline"
          >
            Open in Maps
          </a>
        )}
      </div>

      {/* Dogs */}
      {job.dogs && job.dogs.length > 0 && (
        <div className="p-4 border rounded-md bg-white">
          <p className="font-medium mb-1">Dogs</p>
          {job.dogs.map(d => (
            <p key={d.dogId || d.id} className="text-sm text-slate-600">
              {d.name}
            </p>
          ))}
        </div>
      )}

      {/* Job Settings */}
      <div className="p-4 border rounded-md bg-white space-y-4">

        {/* Start time */}
        <div>
          <label className="text-sm text-slate-600">Start Time</label>
          {editing ? (
            <input
              type="datetime-local"
              value={dayjs(form.start).format("YYYY-MM-DDTHH:mm")}
              onChange={e => updateField("start", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          ) : (
            <p className="text-sm font-medium">
              {dayjs(job.start).format("ddd D MMM • HH:mm")}
            </p>
          )}
        </div>

        {/* Service */}
        <div>
          <label className="text-sm text-slate-600">Service</label>
          {editing ? (
            <select
              value={form.serviceId}
              onChange={e => updateField("serviceId", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            >
              {services.map(s => (
                <option key={s.serviceId || s.id} value={s.serviceId || s.id}>
                  {s.name} — £{((s.price || 0) / 100).toFixed(2)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium">
              {job.serviceName || 'Unknown Service'}
            </p>
          )}
        </div>

        {/* Staff */}
        <div>
          <label className="text-sm text-slate-600">Assigned Staff</label>
          {editing ? (
            <select
              value={form.staffId || ''}
              onChange={e => updateField("staffId", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="">Unassigned</option>
              {staff.map(st => (
                <option key={st.staffId || st.id} value={st.staffId || st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium">
              {job.staffName || "Unassigned"}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="text-sm text-slate-600">Status</label>
          {editing ? (
            <select
              value={form.status}
              onChange={e => updateField("status", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="PENDING">Pending</option>
              <option value="BOOKED">Booked</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          ) : (
            <p className="text-sm font-medium capitalize">{job.status?.toLowerCase() || 'pending'}</p>
          )}
        </div>

        {/* Price Display (read-only unless completing) */}
        {!editing && (
          <div>
            <label className="text-sm text-slate-600">Price</label>
            <p className="text-sm font-medium">£{((job.priceCents || 0) / 100).toFixed(2)}</p>
          </div>
        )}

        {/* Price Override (only when completing job) */}
        {editing && (form.status === "COMPLETED" || form.status === "COMPLETE") && (
          <div>
            <label className="text-sm text-slate-600">Final Price (£)</label>
            <input
              type="number"
              step="0.01"
              value={(form.priceCents || 0) / 100}
              onChange={e => updateField("priceCents", Math.round(Number(e.target.value) * 100))}
              className="w-full border p-2 rounded mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Override the service price if needed before completing
            </p>
          </div>
        )}

      </div>

      {/* Notes */}
      <div className="p-4 border rounded-md bg-white">
        <p className="font-medium">Notes</p>
        <p className="text-sm text-slate-600">{job.notes || "None"}</p>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-teal-700 text-white p-3 rounded"
          >
            Edit Job
          </button>
        )}

        {editing && (
          <>
            <button
              onClick={save}
              className="w-full bg-teal-700 text-white p-3 rounded"
            >
              Save Changes
            </button>
            <button
              onClick={() => setEditing(false)}
              className="w-full bg-slate-300 text-slate-800 p-3 rounded"
            >
              Cancel
            </button>
          </>
        )}

        {job.clientId && (
          <Link
            to={`/admin/messages?client=${job.clientId}`}
            className="block text-center w-full border border-teal-700 text-teal-700 p-3 rounded"
          >
            Message Client
          </Link>
        )}

      </div>
    </div>
  );
}
