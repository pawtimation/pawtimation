import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi, getSession } from '../lib/auth';
import dayjs from 'dayjs';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileEmptyState } from '../components/mobile/MobileEmptyState';
import { MobileCard } from '../components/mobile/MobileCard';
import { MobileStatCard } from '../components/mobile/MobileStatCard';
import { StaffWelcomeModal } from '../components/StaffWelcomeModal';

export function StaffToday() {
  const [jobs, setJobs] = useState([]);
  const [allPendingJobs, setAllPendingJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [staff, setStaff] = useState(null);
  const [nextUpJob, setNextUpJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const session = getSession('STAFF');
      if (!session || !session.userId) return;
      
      setStaffId(session.userId);

      const [staffRes, bookingsRes] = await Promise.all([
        staffApi('/staff/me'),
        staffApi(`/bookings/list?staffId=${session.userId}`)
      ]);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
        
        if (!staffData.hasSeenWelcomeModal) {
          setShowWelcomeModal(true);
        }
      }

      if (bookingsRes.ok) {
        const allJobsData = await bookingsRes.json();
        setAllJobs(allJobsData);
        
        const today = dayjs().format('YYYY-MM-DD');
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        
        const todayJobs = allJobsData.filter(job => {
          const jobDate = dayjs(job.dateTime).format('YYYY-MM-DD');
          return jobDate === today && job.status?.toUpperCase() !== 'CANCELLED';
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        const tomorrowJobs = allJobsData.filter(job => {
          const jobDate = dayjs(job.dateTime).format('YYYY-MM-DD');
          return jobDate === tomorrow && job.status?.toUpperCase() !== 'CANCELLED';
        }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        const pendingJobs = allJobsData.filter(job => job.status?.toUpperCase() === 'PENDING')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        setJobs(todayJobs);
        setAllPendingJobs(pendingJobs);
        
        if (todayJobs.length === 0 && tomorrowJobs.length > 0) {
          setNextUpJob(tomorrowJobs[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
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

  const weekStart = dayjs().startOf('week');
  const weekEnd = dayjs().endOf('week');
  const weeklyJobs = allJobs.filter(job => {
    const jobDate = dayjs(job.dateTime);
    return jobDate.isAfter(weekStart) && jobDate.isBefore(weekEnd) && job.status?.toUpperCase() === 'COMPLETED';
  });

  const weeklyEarnings = weeklyJobs.reduce((sum, job) => {
    return sum + (parseFloat(job.price) || 0);
  }, 0);

  const firstName = staff?.name?.split(' ')[0] || 'there';
  const hour = dayjs().hour();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

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
    <div className="min-h-screen -mx-6 -my-6 px-6 py-6">
      {showWelcomeModal && (
        <StaffWelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          userName={firstName}
        />
      )}
      
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-teal-50 via-teal-50/50 to-white rounded-3xl p-6 shadow-lg border border-teal-100/30" style={{
          boxShadow: '0 4px 24px rgba(15, 118, 110, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
            {greeting}, {firstName}!
          </h1>
          <p className="text-base text-slate-600 font-medium">
            Here's your day at a glance.
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Today's Schedule</h2>
          <p className="text-sm text-slate-700 font-medium">{dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>

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

      <div className="grid grid-cols-2 gap-3">
        <MobileCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 mb-0.5">This Week</p>
              <p className="text-lg font-bold text-slate-900">
                {weeklyJobs.length === 0 ? 'No walks yet' : `${weeklyJobs.length} walk${weeklyJobs.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </MobileCard>

        <MobileCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-600 mb-0.5">Earnings</p>
              <p className="text-lg font-bold text-slate-900">
                {weeklyEarnings === 0 ? 'Ready to earn!' : `£${weeklyEarnings.toFixed(2)}`}
              </p>
            </div>
          </div>
        </MobileCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/staff/messages')}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 active:scale-95 transition-all flex flex-col items-center gap-2.5"
          style={{
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: '96px'
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-700">Messages</span>
        </button>

        <button
          onClick={() => navigate('/staff/calendar')}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 active:scale-95 transition-all flex flex-col items-center gap-2.5"
          style={{
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: '96px'
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-700">Calendar</span>
        </button>

        <button
          onClick={() => navigate('/staff/settings')}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/50 active:scale-95 transition-all flex flex-col items-center gap-2.5"
          style={{
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
            minHeight: '96px'
          }}
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-700">Settings</span>
        </button>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <>
            <MobileEmptyState
              icon={
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              }
              title="No walks today"
              message="Enjoy your day off"
            />

            {nextUpJob && (
              <MobileCard>
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Next Walk</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-base font-bold text-slate-900">
                        Tomorrow at {dayjs(nextUpJob.dateTime).format('h:mm A')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-700">{nextUpJob.dogNames?.join(', ') || 'Dog names not available'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-slate-700">{nextUpJob.serviceName || '30min Solo Walk'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff/calendar')}
                  className="w-full px-4 py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  View tomorrow's schedule →
                </button>
              </MobileCard>
            )}
          </>
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
    </div>
  );
}
