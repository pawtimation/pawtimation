import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/auth';
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
      const response = await api(`/bookings/list?staffId=${user.id}`);
      
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

  return (
    <div className="pb-4">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-sm text-teal-600 font-medium hover:text-teal-700"
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
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No jobs</h3>
            <p className="text-sm text-slate-500">You have no jobs scheduled for this day</p>
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
