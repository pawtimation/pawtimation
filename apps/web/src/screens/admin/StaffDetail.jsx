import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarWeekGrid } from "../../components/calendar/CalendarWeekGrid";

export function StaffDetail() {
  const { staffId } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [staff, setStaff] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [calendarItems, setCalendarItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

  async function api(path, options = {}) {
    const token = localStorage.getItem('pt_user');
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        const staffResponse = await api(`/api/staff/${staffId}`);
        setStaff(staffResponse);

        const jobsResponse = await api('/api/jobs/list');
        const assigned = jobsResponse.filter(j => j.staffId === staffId);
        setJobs(assigned);

        const calendarResponse = await api(`/api/jobs/calendar?staffId=${staffId}`);
        setCalendarItems(calendarResponse || []);
      } catch (error) {
        console.error('Failed to load staff details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [staffId]);

  if (loading) return <div className="p-4">Loading staff...</div>;
  if (!staff) return <div className="p-4">Staff member not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        className="text-teal-600 text-sm mb-4 hover:underline"
        onClick={() => navigate("/admin/staff")}
      >
        ← Back to Staff
      </button>

      <h1 className="text-2xl font-semibold mb-4">
        {staff.name}
      </h1>

      <div className="flex gap-3 border-b mb-6">
        {["overview", "jobs", "calendar", "availability"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "pb-2 capitalize text-sm " +
              (tab === t
                ? "border-b-2 border-teal-600 font-semibold text-teal-700"
                : "text-slate-500 hover:text-slate-700")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Email:</span> {staff.email || 'Not provided'}</p>
              <p className="text-sm"><span className="font-medium">Phone:</span> {staff.phone || "Not provided"}</p>
              <p className="text-sm"><span className="font-medium">Role:</span> {staff.role || 'STAFF'}</p>
              <p className="text-sm"><span className="font-medium">Status:</span> {staff.active ? 'Active' : 'Inactive'}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-lg font-semibold mb-3">Assigned Services</h2>
            {staff.services && staff.services.length > 0 ? (
              <ul className="space-y-1">
                {staff.services.map(s => (
                  <li key={s} className="text-sm text-slate-700">• {s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No services assigned yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "jobs" && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Jobs assigned to {staff.name}
          </h2>

          {jobs.length === 0 && (
            <p className="text-sm text-slate-500">No jobs assigned yet.</p>
          )}

          <div className="space-y-2">
            {jobs.map(job => (
              <div
                key={job.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => navigate(`/admin/bookings`)}
              >
                <p className="font-medium">{job.serviceName || 'Service'}</p>
                <p className="text-sm text-slate-600">
                  {new Date(job.start).toLocaleString()}
                </p>
                <p className="text-sm text-slate-700">
                  Client: {job.clientName || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    job.status === 'BOOKED' ? 'bg-teal-100 text-teal-800' :
                    job.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    job.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {job.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "calendar" && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Weekly Calendar for {staff.name}
          </h2>

          {calendarItems.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs scheduled this week.</p>
          ) : (
            <CalendarWeekGrid
              items={calendarItems}
              showStaff={false}
              highlightStaffId={staffId}
            />
          )}
        </div>
      )}

      {tab === "availability" && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3">Weekly Availability</h2>
          <p className="text-sm text-slate-500">
            Staff availability management is coming soon. This will allow you to set weekly schedules and override specific dates.
          </p>
        </div>
      )}
    </div>
  );
}
