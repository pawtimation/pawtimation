import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";
import dayjs from "dayjs";
import { useParams, Link } from "react-router-dom";

export function AdminMobileJobDetail() {
  const { bookingId } = useParams();

  const [loading, setLoading] = useState(true);
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
        console.error("Failed to fetch job");
        return;
      }
      const jobData = await jobRes.json();
      setJob(jobData);
      setForm({
        start: jobData.start,
        serviceId: jobData.serviceId,
        staffId: jobData.staffId,
        status: jobData.status
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

    } catch (e) {
      console.error("Failed to load job", e);
    } finally {
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
        throw new Error('Failed to update job');
      }
      
      setEditing(false);
      load();
    } catch (err) {
      console.error("Save error", err);
      alert("Could not save changes.");
    }
  }

  if (loading || !job) {
    return <p className="text-slate-600 text-sm">Loading job…</p>;
  }

  return (
    <div className="space-y-6">

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
              <option value="REQUESTED">Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          ) : (
            <p className="text-sm font-medium capitalize">{job.status?.toLowerCase() || 'pending'}</p>
          )}
        </div>

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
