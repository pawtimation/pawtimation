import { useEffect, useState } from "react";
import { adminApi } from '../../../lib/auth';
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useDataRefresh } from "../../../contexts/DataRefreshContext";

export function AdminMobileJobs() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, pending, completed
  const { scopedTriggers } = useDataRefresh();

  async function loadJobs() {
    setLoading(true);
    try {
      const res = await adminApi('/bookings/list');
      if (!res.ok) {
        console.error('Failed to fetch jobs');
        setJobs([]);
        setFilteredJobs([]);
        return;
      }
      const data = await res.json();
      const jobsList = Array.isArray(data) ? data : data.bookings || [];
      setJobs(jobsList);
      applyFilter(jobsList, filter);
    } catch (err) {
      console.error('Jobs load error:', err);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(jobsList, selectedFilter) {
    const now = dayjs();
    const today = now.startOf('day');
    const tomorrow = today.add(1, 'day');
    
    let filtered = jobsList;
    
    switch (selectedFilter) {
      case 'today':
        filtered = jobsList.filter(job => {
          const jobDate = dayjs(job.start);
          return jobDate.isAfter(today) && jobDate.isBefore(tomorrow);
        });
        break;
      case 'upcoming':
        filtered = jobsList.filter(job => {
          const jobDate = dayjs(job.start);
          return jobDate.isAfter(now) && (job.status === 'BOOKED' || job.status === 'PENDING');
        });
        break;
      case 'pending':
        filtered = jobsList.filter(job => 
          job.status === 'PENDING'
        );
        break;
      case 'completed':
        filtered = jobsList.filter(job => 
          job.status === 'COMPLETED' || job.status === 'CANCELLED'
        );
        break;
      default:
        filtered = jobsList;
    }
    
    // Sort by date (newest first for completed, soonest first for others)
    filtered.sort((a, b) => {
      if (selectedFilter === 'completed') {
        return new Date(b.start) - new Date(a.start);
      }
      return new Date(a.start) - new Date(b.start);
    });
    
    setFilteredJobs(filtered);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  // Refresh on booking changes
  useEffect(() => {
    loadJobs();
  }, [scopedTriggers.bookings]);

  useEffect(() => {
    applyFilter(jobs, filter);
  }, [filter, jobs]);

  function getStatusBadge(status) {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'BOOKED': 'bg-emerald-100 text-emerald-800',
      'COMPLETED': 'bg-slate-100 text-slate-600',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'PENDING': 'Pending',
      'BOOKED': 'Booked',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
        {labels[status] || status}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Jobs</h1>
        <p className="text-sm text-slate-600">
          {filteredJobs.length} {filter === 'all' ? 'total' : filter} job{filteredJobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterPill 
          label="All" 
          active={filter === 'all'} 
          onClick={() => setFilter('all')}
          count={jobs.length}
        />
        <FilterPill 
          label="Today" 
          active={filter === 'today'} 
          onClick={() => setFilter('today')}
        />
        <FilterPill 
          label="Upcoming" 
          active={filter === 'upcoming'} 
          onClick={() => setFilter('upcoming')}
        />
        <FilterPill 
          label="Pending" 
          active={filter === 'pending'} 
          onClick={() => setFilter('pending')}
        />
        <FilterPill 
          label="Completed" 
          active={filter === 'completed'} 
          onClick={() => setFilter('completed')}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <p className="text-sm text-slate-600">Loading jobs...</p>
      )}

      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-600 text-sm">
            {filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
          </p>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.map(job => (
          <Link
            key={job.id}
            to={`/admin/m/jobs/${job.id}`}
            className="block"
          >
            <div className="p-4 border rounded-lg bg-white active:bg-slate-50">
              
              {/* Top Row: Client + Status */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-sm truncate">
                    {job.clientName || 'Unknown Client'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {job.serviceName || job.serviceId}
                  </p>
                </div>
                {getStatusBadge(job.status)}
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>📅</span>
                <span>{dayjs(job.start).format('ddd, MMM D')}</span>
                <span>•</span>
                <span>{dayjs(job.start).format('h:mm A')}</span>
              </div>

              {/* Address (if available) */}
              {job.addressLine1 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>📍</span>
                  <span className="truncate">{job.addressLine1}</span>
                </div>
              )}

              {/* Staff (if assigned) */}
              {job.staffName && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>👤</span>
                  <span>{job.staffName}</span>
                </div>
              )}

            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}

function FilterPill({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active 
          ? 'bg-teal-600 text-white' 
          : 'bg-slate-100 text-slate-700 active:bg-slate-200'
      }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  );
}
