import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi } from '../lib/auth';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';

dayjs.extend(calendar);

export function StaffSimpleCalendar() {
  const [jobs, setJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const userStr = localStorage.getItem('pt_user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const response = await staffApi(`/bookings/list?staffId=${user.id}`);
      
      if (response.ok) {
        const allJobs = await response.json();
        setJobs(allJobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  function getWeekDays(baseDate) {
    const startOfWeek = baseDate.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }

  function getJobsForDate(date) {
    const dateStr = date.format('YYYY-MM-DD');
    return jobs.filter(job => {
      const jobDate = dayjs(job.dateTime).format('YYYY-MM-DD');
      return jobDate === dateStr;
    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  }

  function previousWeek() {
    setSelectedDate(prev => prev.subtract(7, 'day'));
  }

  function nextWeek() {
    setSelectedDate(prev => prev.add(7, 'day'));
  }

  function goToToday() {
    setSelectedDate(dayjs());
  }

  const weekDays = getWeekDays(selectedDate);
  const jobsForSelectedDate = getJobsForDate(selectedDate);
  const isToday = selectedDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

  const weekJobsCount = weekDays.reduce((count, day) => {
    return count + getJobsForDate(day).length;
  }, 0);

  const nextUpcomingJob = jobs
    .filter(job => {
      const jobDate = dayjs(job.dateTime);
      return jobDate.isAfter(dayjs()) && job.status?.toUpperCase() !== 'CANCELLED';
    })
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];

  const upcomingWeekDays = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'))
    .map(day => {
      const dayJobs = getJobsForDate(day);
      return {
        day,
        count: dayJobs.length,
        label: day.format('ddd')
      };
    })
    .filter(item => item.count > 0)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/20 via-white to-white pb-4">
      <div className="bg-gradient-to-br from-white to-teal-50/30 border-b border-teal-100/50 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
            {weekJobsCount > 0 && (
              <p className="text-xs text-slate-600 mt-0.5">
                {weekJobsCount} walk{weekJobsCount === 1 ? '' : 's'} this week
              </p>
            )}
          </div>
          {!isToday && (
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-semibold text-slate-800">
            {selectedDate.format('MMMM YYYY')}
          </h2>
          
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const isSelected = day.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
            const isCurrentDay = day.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
            const dayJobs = getJobsForDate(day);
            const hasJobs = dayJobs.length > 0;

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center py-3 rounded-lg transition-colors relative ${
                  isSelected 
                    ? 'bg-teal-600 text-white' 
                    : isCurrentDay
                    ? 'bg-teal-50 text-teal-700'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="text-xs font-medium mb-1">{day.format('ddd')}</span>
                <span className="text-lg font-bold">{day.format('D')}</span>
                {hasJobs && (
                  <div className={`absolute bottom-1 w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-teal-600'
                  }`}></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => navigate('/staff/messages')}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex flex-col items-center gap-1.5"
          >
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Messages</span>
          </button>

          <button
            onClick={() => navigate('/staff')}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex flex-col items-center gap-1.5"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Home</span>
          </button>

          <button
            onClick={() => navigate('/staff/availability')}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all flex flex-col items-center gap-1.5"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-slate-700">Availability</span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {selectedDate.format('dddd, MMMM D')}
          </h3>
          <p className="text-xs text-slate-500">
            {jobsForSelectedDate.length} {jobsForSelectedDate.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : jobsForSelectedDate.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-8 h-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {isToday ? 'No walks today' : 'All clear'}
              </h3>
              <p className="text-sm text-slate-600">
                {isToday 
                  ? "Enjoy the day! Check your upcoming schedule below." 
                  : "You're not scheduled for any walks — see what's coming up next."}
              </p>
            </div>

            {nextUpcomingJob && (
              <div className="bg-white rounded-xl p-4 border-2 border-teal-200 shadow-sm">
                <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-3">Next Job</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="font-bold text-slate-900">
                        {dayjs(nextUpcomingJob.dateTime).calendar(null, {
                          sameDay: '[Today at] h:mm A',
                          nextDay: '[Tomorrow at] h:mm A',
                          nextWeek: 'dddd [at] h:mm A',
                          sameElse: 'MMM D [at] h:mm A'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-700">{nextUpcomingJob.dogNames?.join(', ') || 'Dog names not available'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-slate-700">{nextUpcomingJob.serviceName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm text-slate-700">{nextUpcomingJob.clientName}</p>
                  </div>
                  {nextUpcomingJob.addressLine1 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-slate-700">{nextUpcomingJob.addressLine1}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/staff/bookings/${nextUpcomingJob.id}`)}
                  className="w-full mt-4 px-4 py-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  View Details →
                </button>
              </div>
            )}

            {upcomingWeekDays.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Coming Up</p>
                <div className="space-y-2">
                  {upcomingWeekDays.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(item.day)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-teal-50 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                      <span className="text-sm text-slate-600">
                        {item.count} walk{item.count === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {jobsForSelectedDate.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onClick={() => navigate(`/staff/bookings/${job.id}`)} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, onClick }) {
  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'BOOKED': return 'bg-blue-100 text-blue-800';
      case 'EN ROUTE': return 'bg-purple-100 text-purple-800';
      case 'STARTED': return 'bg-amber-100 text-amber-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-300 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{job.clientName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
              {job.status || 'BOOKED'}
            </span>
          </div>
          <p className="text-sm text-slate-600">{job.dogNames?.join(', ') || 'No dogs assigned'}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{dayjs(job.dateTime).format('h:mm A')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{job.serviceName} ({job.duration} min)</span>
      </div>
    </div>
  );
}
