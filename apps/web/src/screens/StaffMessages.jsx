import { useState, useEffect } from "react";
import { staffApi } from '../lib/auth';
import { useNavigate } from "react-router-dom";

export function StaffMessages() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    try {
      const ptUser = localStorage.getItem('pt_user');
      
      if (!ptUser) {
        console.error('Missing staff authentication');
        return;
      }

      const userData = JSON.parse(ptUser);
      const staffId = userData.id;

      const response = await staffApi(`/bookings/list?staffId=${staffId}`);
      if (response.ok) {
        const allBookings = await response.json();
        const activeBookings = allBookings.filter(b => 
          b.status?.toUpperCase() !== 'CANCELLED' && 
          b.clientName
        );
        setBookings(activeBookings);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  function getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-slate-200 text-slate-600';  // Greyed out - awaiting approval
      case 'BOOKED': return 'bg-emerald-100 text-emerald-800';  // Green - confirmed
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
    <div className="pb-4">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-600">Message clients about their bookings</p>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No active bookings</h3>
            <p className="text-sm text-slate-500">You have no clients to message at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/staff/bookings/${booking.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{booking.clientName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{booking.dogNames?.join(', ') || 'No dogs assigned'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(booking.dateTime || booking.start).toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-2">Tap to view details and send messages</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
