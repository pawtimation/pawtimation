import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";

export function AdminMobileDashboard() {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState({
    upcomingJobs: 0,
    pendingRequests: 0,
    activeClients: 0,
    revenueWeek: 0
  });

  useEffect(() => {
    async function load() {
      try {
        const bRes = await api("/business/me");
        const b = await bRes.json();
        setBusiness(b);

        // Pull stats from existing endpoints
        const upcomingRes = await api("/stats/bookings/upcoming-count");
        const upcoming = await upcomingRes.json();
        
        const pendingRes = await api("/stats/bookings/pending-count");
        const pending = await pendingRes.json();
        
        const clientsRes = await api("/stats/clients/count");
        const clients = await clientsRes.json();
        
        const revenueRes = await api("/stats/invoices/revenue-week");
        const revenue = await revenueRes.json();

        setStats({
          upcomingJobs: upcoming.count || 0,
          pendingRequests: pending.count || 0,
          activeClients: clients.count || 0,
          revenueWeek: revenue.amount || 0
        });
      } catch (e) {
        console.error("Dashboard load error", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="text-slate-600 text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Business Name */}
      <div>
        <h1 className="text-xl font-semibold">
          {business?.businessName || "Your Business"}
        </h1>
        <p className="text-sm text-slate-600">
          Mobile administration overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">

        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-slate-500">Upcoming Jobs</p>
          <p className="text-2xl font-semibold">{stats.upcomingJobs}</p>
        </div>

        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-slate-500">Pending Approvals</p>
          <p className={`text-2xl font-semibold ${
            stats.pendingRequests > 0 ? "text-red-700" : ""
          }`}>
            {stats.pendingRequests}
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-slate-500">Active Clients</p>
          <p className="text-2xl font-semibold">{stats.activeClients}</p>
        </div>

        <div className="p-4 rounded-lg border bg-white">
          <p className="text-xs text-slate-500">Revenue (This Week)</p>
          <p className="text-2xl font-semibold">
            £{(stats.revenueWeek / 100).toFixed(2)}
          </p>
        </div>

      </div>

      {/* Upcoming Jobs Preview */}
      <UpcomingJobsPreview />

    </div>
  );
}

function UpcomingJobsPreview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api("/stats/bookings/upcoming?limit=5");
        if (!res.ok) {
          console.error("Failed to fetch upcoming jobs");
          setJobs([]);
          return;
        }
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Next Jobs</h2>
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold mb-2">Next Jobs</h2>

      {jobs.length === 0 && (
        <p className="text-sm text-slate-600">No upcoming jobs.</p>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.bookingId || job.id}
            className="p-3 border rounded-lg bg-white"
          >
            <p className="text-sm font-medium">
              {job.clientName}
            </p>
            <p className="text-sm text-slate-500">
              {job.serviceName} • {job.startTimeFormatted}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
