import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { repo } from '../../../../api/src/repo.js';

export function ClientBookings() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState(null);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const clientId = parsed.crmClientId || parsed.clientId;
        const biz = parsed.businessId;

        if (!clientId || !biz) {
          navigate('/client/login');
          return;
        }

        setBusinessId(biz);
        const allJobs = await repo.listJobsByBusiness(biz);
        const clientJobs = allJobs.filter(j => j.clientId === clientId);
        setJobs(clientJobs);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading bookings…</div>;
  }

  function statusLabel(status) {
    switch (status) {
      case 'REQUESTED':
        return 'Requested (awaiting approval)';
      case 'SCHEDULED':
      case 'APPROVED':
        return 'Confirmed';
      case 'COMPLETE':
      case 'COMPLETED':
        return 'Completed';
      case 'DECLINED':
        return 'Declined';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Pending';
    }
  }

  const upcomingJobs = jobs.filter(
    j => new Date(j.start) > new Date() && !['COMPLETE', 'COMPLETED', 'CANCELLED', 'DECLINED'].includes(j.status)
  );
  const pastJobs = jobs.filter(
    j => new Date(j.start) <= new Date() || ['COMPLETE', 'COMPLETED', 'CANCELLED', 'DECLINED'].includes(j.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">My Bookings</h1>
        <Link to="/client/book" className="btn btn-primary btn-sm">
          Request booking
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-3">Upcoming</h2>
          {upcomingJobs.length === 0 ? (
            <div className="card">
              <p className="text-sm text-slate-600">No upcoming bookings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingJobs
                .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
                .map(job => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded p-3"
                  >
                    <p className="font-semibold text-sm">
                      {job.start
                        ? new Date(job.start).toLocaleString()
                        : 'No start time'}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      {job.serviceId || 'Service'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: {statusLabel(job.status)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold mb-3">Past bookings</h2>
          {pastJobs.length === 0 ? (
            <div className="card">
              <p className="text-sm text-slate-600">No past bookings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pastJobs
                .sort((a, b) => (b.start || '').localeCompare(a.start || ''))
                .slice(0, 10)
                .map(job => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded p-3 opacity-75"
                  >
                    <p className="font-semibold text-sm">
                      {job.start
                        ? new Date(job.start).toLocaleString()
                        : 'No start time'}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      {job.serviceId || 'Service'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Status: {statusLabel(job.status)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
