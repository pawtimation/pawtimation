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
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        setBusinessId(biz);
        const allJobs = await repo.listJobsByBusiness(biz);
        const clientJobs = allJobs.filter(j => j.clientId === clientId);
        setJobs(clientJobs);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        localStorage.removeItem('pt_client');
        localStorage.removeItem('pt_user');
        navigate('/client/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading bookings…</div>;
  }

  function safeFormatDate(dateString) {
    if (!dateString) return 'No start time';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'No start time';
    return date.toLocaleString();
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

  const upcomingJobs = jobs.filter(j => {
    // Include jobs with no start time (pending requests) or future jobs
    const isCompleted = ['COMPLETE', 'COMPLETED', 'CANCELLED', 'DECLINED'].includes(j.status);
    if (isCompleted) return false;
    
    // Pending jobs without start time or invalid start time go to upcoming
    if (!j.start) return true;
    const startDate = new Date(j.start);
    if (Number.isNaN(startDate.getTime())) return true;
    
    return startDate > new Date();
  });
  
  const pastJobs = jobs.filter(j => {
    // Only completed jobs or jobs with past start times
    const isCompleted = ['COMPLETE', 'COMPLETED', 'CANCELLED', 'DECLINED'].includes(j.status);
    if (isCompleted) return true;
    
    // Jobs without start time or invalid start time don't go to past
    if (!j.start) return false;
    const startDate = new Date(j.start);
    if (Number.isNaN(startDate.getTime())) return false;
    
    return startDate <= new Date();
  });

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
                      {safeFormatDate(job.start)}
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
                      {safeFormatDate(job.start)}
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
