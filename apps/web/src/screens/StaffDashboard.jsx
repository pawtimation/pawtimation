import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../lib/auth';
import { useDataRefresh } from '../contexts/DataRefreshContext';
import DashboardCard from '../components/layout/DashboardCard';
import dayjs from 'dayjs';

export function StaffDashboard() {
  const [stats, setStats] = useState({
    upcomingJobs: 0,
    todayJobs: 0,
    thisWeekJobs: 0,
    completedJobs: 0
  });
  const [upcomingJobsList, setUpcomingJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scopedTriggers } = useDataRefresh();

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

  const loadDashboard = async () => {
    try {
      const userStr = localStorage.getItem('pt_user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      
      if (!user || !user.id) {
        console.error('No staff user found');
        return;
      }

      // Load bookings for this staff member
      const response = await staffApi(`/bookings/list?staffId=${user.id}`);
      if (!response.ok) {
        console.error('Failed to load bookings');
        return;
      }
      
      const allJobs = await response.json();
      
      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const upcomingJobs = allJobs.filter(j => 
        (j.status === 'BOOKED' || j.status === 'PENDING') && 
        new Date(j.start) >= now
      );
      
      const todayJobs = allJobs.filter(j => {
        const jobDate = new Date(j.start);
        return jobDate >= todayStart && jobDate < todayEnd &&
               (j.status === 'BOOKED' || j.status === 'PENDING');
      });
      
      const thisWeekJobs = allJobs.filter(j => {
        const jobDate = new Date(j.start);
        return jobDate >= weekStart && jobDate < weekEnd &&
               (j.status === 'BOOKED' || j.status === 'PENDING');
      });
      
      const completedJobs = allJobs.filter(j => j.status === 'COMPLETED');
      
      setStats({
        upcomingJobs: upcomingJobs.length,
        todayJobs: todayJobs.length,
        thisWeekJobs: thisWeekJobs.length,
        completedJobs: completedJobs.length
      });
      
      // Get next 5 upcoming jobs
      const sortedUpcoming = upcomingJobs
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5);
      
      setUpcomingJobsList(sortedUpcoming);
      
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Refresh when bookings change (real-time via socket.io)
  useEffect(() => {
    loadDashboard();
  }, [scopedTriggers.bookings]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">My Dashboard</h1>
        <p className="text-sm text-slate-600">Your job schedule and quick stats</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Today's Jobs</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.todayJobs}</p>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Upcoming Jobs</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.upcomingJobs}</p>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">This Week</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.thisWeekJobs}</p>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="text-3xl font-semibold text-emerald-700">{stats.completedJobs}</p>
          </div>
        </DashboardCard>
      </div>

      {/* Upcoming Jobs List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Next Upcoming Jobs</h2>
          <Link to="/staff/jobs" className="text-sm text-teal-600 hover:text-teal-700">
            View all →
          </Link>
        </div>

        {upcomingJobsList.length === 0 ? (
          <p className="text-sm text-slate-600">No upcoming jobs scheduled</p>
        ) : (
          <div className="space-y-3">
            {upcomingJobsList.map(job => (
              <Link
                key={job.id}
                to={`/staff/bookings/${job.id}`}
                className="block p-3 border border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{job.clientName || 'Client'}</p>
                      {job.route && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          🗺️ Route available
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{job.serviceName || 'Service'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {dayjs(job.start).format('ddd, MMM D [at] h:mm A')}
                      {job.dogNames && ` • ${job.dogNames}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/staff/calendar"
          className="card hover:border-teal-500 transition-all text-center p-6"
        >
          <p className="font-medium text-slate-800">View Calendar</p>
          <p className="text-xs text-slate-600 mt-1">See your weekly schedule</p>
        </Link>

        <Link
          to="/staff/jobs"
          className="card hover:border-teal-500 transition-all text-center p-6"
        >
          <p className="font-medium text-slate-800">All Jobs</p>
          <p className="text-xs text-slate-600 mt-1">View upcoming & completed</p>
        </Link>

        <Link
          to="/staff/availability"
          className="card hover:border-teal-500 transition-all text-center p-6"
        >
          <p className="font-medium text-slate-800">Availability</p>
          <p className="text-xs text-slate-600 mt-1">Manage your schedule</p>
        </Link>
      </div>
    </div>
  );
}
