import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../components/mobile/MobileEmptyState';
import { MobileCard } from '../components/mobile/MobileCard';

export function StaffPending() {
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingJobs();
  }, []);

  async function loadPendingJobs() {
    try {
      const userStr = localStorage.getItem('pt_user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);

      const response = await api(`/bookings/list?staffId=${user.id}`);
      if (response.ok) {
        const allJobs = await response.json();
        
        const pending = allJobs
          .filter(job => job.status?.toUpperCase() === 'PENDING')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        setPendingJobs(pending);
      }
    } catch (err) {
      console.error('Failed to load pending jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function confirmBooking(jobId) {
    try {
      const response = await api(`/bookings/${jobId}/staff-confirm`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      if (response.ok) {
        await loadPendingJobs();
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
        method: 'POST',
        body: JSON.stringify({})
      });

      if (response.ok) {
        await loadPendingJobs();
        alert('Booking declined. The admin has been notified.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Could not decline booking: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to decline booking:', err);
      alert('Failed to decline booking. Please try again.');
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/staff')}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <MobilePageHeader 
          title="Pending Bookings" 
          subtitle={`${pendingJobs.length} bookings awaiting your response`}
        />
      </div>

      <div className="space-y-4">
        {pendingJobs.length === 0 ? (
          <MobileEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No pending bookings"
            message="All caught up! You have no bookings awaiting your response."
          />
        ) : (
          pendingJobs.map(job => (
            <MobileCard 
              key={job.id}
              onClick={() => navigate(`/staff/bookings/${job.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
                  Awaiting Approval
                </span>
                <span className="text-base font-bold text-slate-900">
                  {dayjs(job.dateTime).format('MMM D, h:mm A')}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-base font-semibold text-slate-900">{job.clientName}</p>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-700">
                    {job.dogNames?.join(', ') || 'Dog names not available'}
                  </p>
                </div>

                {job.serviceName && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-700">{job.serviceName}</p>
                  </div>
                )}

                {job.addressLine1 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-slate-700">{job.addressLine1}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmBooking(job.id);
                    }}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      declineBooking(job.id);
                    }}
                    className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </MobileCard>
          ))
        )}
      </div>
    </div>
  );
}
