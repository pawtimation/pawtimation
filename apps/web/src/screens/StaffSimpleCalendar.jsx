import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffApi } from '../lib/auth';
import dayjs from 'dayjs';

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
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No walks scheduled</h3>
            <p className="text-sm text-slate-600">
              {isToday 
                ? "You're free today! 🐾" 
                : "Nothing scheduled for this day"}
            </p>
            
            {weekJobsCount > 0 && !isToday && (
              <p className="text-xs text-teal-600 mt-3 font-medium">
                Tap other days to see your walks
              </p>
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
