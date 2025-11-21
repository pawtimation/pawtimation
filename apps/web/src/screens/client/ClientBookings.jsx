import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobsForClient, cancelJobRequest } from '../../lib/jobApi';
import { addNotification } from '../../lib/clientNotifications';
import { getBookingMessages } from '../../lib/messagesApi';

function statusClass(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    case 'booked':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'completed':
      return 'text-blue-700 bg-blue-100 border-blue-200';
    case 'cancelled':
      return 'text-slate-600 bg-slate-100 border-slate-200';
    default:
      return 'text-slate-700 bg-slate-100 border-slate-200';
  }
}

export function ClientBookings() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  async function load() {
    const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
    if (!raw) {
      navigate('/client/login');
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const cId = parsed.crmClientId || parsed.clientId;

      if (!cId) {
        localStorage.removeItem('pt_client');
        localStorage.removeItem('pt_user');
        navigate('/client/login');
        return;
      }

      setClientId(cId);
      const list = await listJobsForClient(cId);
      
      // Check for status changes and create notifications
      const previousStatuses = JSON.parse(
        localStorage.getItem('pt_booking_statuses') || '{}'
      );
      
      list.forEach((job) => {
        const prevStatus = previousStatuses[job.id];
        const currentStatus = job.status?.toUpperCase();
        
        // Detect status transitions from PENDING
        if (prevStatus === 'PENDING') {
          if (currentStatus === 'BOOKED') {
            addNotification(`Your booking for "${job.serviceName}" has been approved!`);
          } else if (currentStatus === 'CANCELLED') {
            addNotification(`Your booking for "${job.serviceName}" was declined.`);
          }
        }
      });
      
      // Save current statuses for next comparison
      const newStatuses = {};
      list.forEach((job) => {
        newStatuses[job.id] = job.status?.toUpperCase();
      });
      localStorage.setItem('pt_booking_statuses', JSON.stringify(newStatuses));
      
      setJobs(list);
      
      // Load unread message counts for each booking
      const businessId = parsed.businessId;
      if (businessId && list.length > 0) {
        const counts = {};
        await Promise.all(
          list.map(async (job) => {
            try {
              const messages = await getBookingMessages(businessId, job.id);
              const unread = messages.filter(m => m.readStates && !m.readStates.client).length;
              counts[job.id] = unread;
            } catch (err) {
              console.error(`Failed to load messages for booking ${job.id}:`, err);
              counts[job.id] = 0;
            }
          })
        );
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      localStorage.removeItem('pt_client');
      localStorage.removeItem('pt_user');
      navigate('/client/login');
      return;
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id) {
    try {
      await cancelJobRequest(id);
      await load();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading bookings…</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">My Bookings</h1>
        <div className="flex gap-2">
          <a
            href="/api/bookings/calendar/ical"
            download
            className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded text-sm hover:bg-slate-200 flex items-center gap-1.5"
            title="Export to Google Calendar, Apple Calendar, or Outlook"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Export Calendar
          </a>
          <Link
            to="/client/book"
            className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
          >
            Request booking
          </Link>
        </div>
      </div>

      {jobs.length === 0 && (
        <p className="text-sm text-slate-600">You have no bookings yet.</p>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const start = job.start ? new Date(job.start) : null;
          const isValidDate = start && !Number.isNaN(start.getTime());
          const statusDisplay = job.status?.toLowerCase() || 'pending';

          return (
            <div
              key={job.id}
              className="bg-white border rounded p-4 space-y-1 text-sm"
            >
              <p className="font-semibold">{job.serviceName || 'Service'}</p>
              <p className="text-slate-600">
                {isValidDate
                  ? `${start.toLocaleString()} for ${job.durationMinutes || 60} minutes`
                  : 'Pending confirmation - no start time yet'}
              </p>
              <p className="text-slate-600">Dogs: {job.dogIds?.length || 0}</p>

              <span
                className={
                  'inline-block text-xs px-2 py-0.5 rounded border ' +
                  statusClass(job.status)
                }
              >
                {statusDisplay}
              </span>

              <div className="pt-2 flex gap-2 flex-wrap">
                {(statusDisplay === 'pending' || statusDisplay === 'requested') && (
                  <>
                    <Link
                      to={`/client/book/edit?id=${job.id}`}
                      className="text-teal-700 text-xs underline hover:text-teal-800"
                    >
                      Edit
                    </Link>

                    <button
                      className="text-red-700 text-xs underline hover:text-red-800"
                      onClick={() => handleCancel(job.id)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {(statusDisplay === 'completed' || statusDisplay === 'complete') && (
                  <Link
                    to={`/client/book?repeat=${job.id}`}
                    className="text-teal-700 text-xs underline hover:text-teal-800"
                  >
                    Book again
                  </Link>
                )}

                <Link
                  to={`/client/booking/messages?id=${job.id}`}
                  className="text-teal-700 text-xs underline hover:text-teal-800"
                >
                  View messages
                  {unreadCounts[job.id] > 0 && (
                    <span className="ml-1 text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded">
                      {unreadCounts[job.id]}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
