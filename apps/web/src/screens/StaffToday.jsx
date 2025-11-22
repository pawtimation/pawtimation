import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, staffApi } from '../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../components/mobile/MobileEmptyState';
import { MobileCard } from '../components/mobile/MobileCard';
import { MobileStatCard } from '../components/mobile/MobileStatCard';

export function StaffToday() {
  const [jobs, setJobs] = useState([]);
  const [allPendingJobs, setAllPendingJobs] = useState([]);
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

      const response = await staffApi(`/bookings/list?staffId=${user.id}`);
      if (response.ok) {
        const allJobs = await response.json();
        
        const today = dayjs().format('YYYY-MM-DD');
        const todayJobs = allJobs.filter(job => {
          const jobDate = dayjs(job.dateTime).format('YYYY-MM-DD');
          return jobDate === today;
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        const pendingJobs = allJobs.filter(job => job.status?.toUpperCase() === 'PENDING')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        setJobs(todayJobs);
        setAllPendingJobs(pendingJobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
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
      case 'PENDING': return 'bg-slate-200 text-slate-600';
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';
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

  const pendingCount = allPendingJobs.length;
  const completedCount = jobs.filter(j => j.status?.toUpperCase() === 'COMPLETED').length;
  const totalCount = jobs.length;

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
      <MobilePageHeader 
        title="Today's Schedule" 
        subtitle={dayjs().format('dddd, MMMM D, YYYY')}
      />

      <div className="grid grid-cols-3 gap-3">
        <MobileStatCard
          label="Total"
          value={totalCount}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <button
          onClick={() => navigate('/staff/pending')}
          className="w-full"
        >
          <MobileStatCard
            label="Pending"
            value={pendingCount}
            valueColor="text-slate-600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </button>
        <MobileStatCard
          label="Done"
          value={completedCount}
          valueColor="text-teal-600"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <MobileEmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="No walks today"
            message="Enjoy your day off! Check the calendar for upcoming assignments."
          />
        ) : (
          jobs.map(job => (
            <MobileCard 
              key={job.id}
              onClick={() => navigate(`/staff/bookings/${job.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                  {getStatusText(job.status)}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {dayjs(job.dateTime).format('h:mm A')}
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

              {job.addressLine1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openMaps(job.addressLine1);
                  }}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Open in Maps
                </button>
              )}
            </MobileCard>
          ))
        )}
      </div>
    </div>
  );
}
