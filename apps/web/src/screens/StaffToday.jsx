import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/auth';
import dayjs from 'dayjs';

export function StaffToday() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTodayJobs();
  }, []);

  async function loadTodayJobs() {
    try {
      const userStr = localStorage.getItem('pt_user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      setStaffId(user.id);

      const response = await api(`/bookings/list?staffId=${user.id}`);
      if (response.ok) {
        const allJobs = await response.json();
        
        const today = dayjs().format('YYYY-MM-DD');
        const todayJobs = allJobs.filter(job => {
          const jobDate = dayjs(job.dateTime).format('YYYY-MM-DD');
          return jobDate === today;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        setJobs(todayJobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateJobStatus(jobId, newStatus) {
    try {
      const response = await api(`/bookings/${jobId}/update`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
      }
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  }

  function openMaps(address) {
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.apple.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  }

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-200 text-slate-600';  // Greyed out - awaiting approval
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';  // Green - confirmed/locked in
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

  async function confirmBooking(jobId) {
    try {
      const response = await api(`/bookings/${jobId}/staff-confirm`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadTodayJobs(); // Reload all jobs to show updated status
        alert('✓ Booking confirmed! The client has been notified.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to confirm booking';
        alert(`Could not confirm booking: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Failed to confirm booking:', err);
      alert('Failed to confirm booking. Please check your connection and try again.');
    }
  }

  async function declineBooking(jobId) {
    if (!confirm('Decline this booking? It will be sent back to the admin for reassignment.')) {
      return;
    }

    try {
      const response = await api(`/bookings/${jobId}/staff-decline`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadTodayJobs(); // Reload to remove from staff's list
        alert('✓ Booking declined. The admin will be notified to reassign it.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to decline booking';
        alert(`Could not decline booking: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Failed to decline booking:', err);
      alert('Failed to decline booking. Please check your connection and try again.');
    }
  }

  async function cancelBooking(jobId) {
    if (!confirm('Are you sure you want to cancel this booking? This will cancel it for the client as well.')) {
      return;
    }

    try {
      const response = await api(`/bookings/${jobId}/staff-cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadTodayJobs(); // Reload to show updated status
        alert('✓ Booking cancelled. The client has been notified.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to cancel booking';
        alert(`Could not cancel booking: ${errorMessage}`);
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please check your connection and try again.');
    }
  }

  function getNextAction(job) {
    const status = job.status?.toUpperCase();
    if (status === 'COMPLETED') return null;
    if (status === 'STARTED') return { label: 'Mark Complete', action: () => updateJobStatus(job.id, 'COMPLETED') };
    return { label: 'Start Job', action: () => updateJobStatus(job.id, 'STARTED') };
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const nextJob = jobs.find(j => j.status?.toUpperCase() !== 'COMPLETED');

  return (
    <div className="pb-4">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">Today</h1>
        <p className="text-sm text-slate-600">{dayjs().format('dddd, MMMM D')}</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs today</h3>
            <p className="text-sm text-slate-500">Enjoy your day off!</p>
          </div>
        ) : (
          <>
            {nextJob && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Next Up</h2>
                <JobCard 
                  job={nextJob} 
                  isNext={true} 
                  onNavigate={openMaps} 
                  onStatusUpdate={updateJobStatus}
                  onConfirm={confirmBooking}
                  onDecline={declineBooking}
                  onCancel={cancelBooking}
                />
              </div>
            )}

            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">All Jobs</h2>
              <div className="space-y-3">
                {jobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onNavigate={openMaps}
                    onStatusUpdate={updateJobStatus}
                    onConfirm={confirmBooking}
                    onDecline={declineBooking}
                    onCancel={cancelBooking}
                    onClick={() => navigate(`/staff/jobs/${job.id}`)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, isNext, onNavigate, onStatusUpdate, onConfirm, onDecline, onCancel, onClick }) {
  const status = job.status?.toUpperCase();
  const isPending = status === 'PENDING';
  const nextAction = getNextAction(job);

  function getNextAction(job) {
    const status = job.status?.toUpperCase();
    if (status === 'COMPLETED') return null;
    if (status === 'PENDING') return null; // PENDING has special buttons
    if (status === 'STARTED') return { label: 'Mark Complete', action: () => onStatusUpdate(job.id, 'COMPLETED') };
    return { label: 'Start Job', action: () => onStatusUpdate(job.id, 'STARTED') };
  }

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-200 text-slate-600';  // Greyed out - awaiting approval
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';  // Green - confirmed/locked in
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

  return (
    <div 
      className={`bg-white rounded-lg border ${isNext ? 'border-teal-300 shadow-md' : 'border-slate-200'} overflow-hidden`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">{job.clientName}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusText(job.status)}
              </span>
            </div>
            <p className="text-sm text-slate-600">{job.dogNames?.join(', ') || 'No dogs assigned'}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{dayjs(job.dateTime).format('h:mm A')}</p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-700">{job.serviceName} ({job.duration} min)</span>
          </div>
          
          {job.address && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(job.address);
              }}
              className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="underline">{job.address}</span>
            </button>
          )}

          {job.notes && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="text-slate-600 italic truncate">{job.notes}</span>
            </div>
          )}
        </div>

        {isPending && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700 mb-2">
              Review this booking:
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm(job.id);
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                ✓ Confirm
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline(job.id);
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                ← Decline
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(job.id);
              }}
              className="w-full px-4 py-2 border border-rose-300 text-rose-700 rounded-lg font-medium hover:bg-rose-50 transition-colors"
            >
              ✕ Cancel Booking
            </button>
          </div>
        )}

        {nextAction && !isPending && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextAction.action();
              }}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              {nextAction.label}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
