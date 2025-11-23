import React, { useEffect, useState } from 'react';
import { adminApi } from '../lib/auth';
import { BookingFormModal } from '../components/BookingFormModal';

const ITEMS_PER_PAGE = 20;

function getStatusColor(status) {
  const statusUpper = (status || 'PENDING').toUpperCase();
  switch (statusUpper) {
    case 'BOOKED':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
}

export function BookingsList({ business }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    setLoading(true);
    try {
      if (!business) return;
      const res = await adminApi('/bookings/list');
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function addBooking() {
    setEditing(null);
    setModalOpen(true);
  }

  function editBooking(booking) {
    setEditing(booking);
    setModalOpen(true);
  }

  async function closeModal(saved) {
    setModalOpen(false);
    setEditing(null);
    if (saved) load();
  }

  const totalPages = Math.ceil(bookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-slate-600">View and manage all bookings.</p>
        </div>
        <button className="btn btn-primary text-sm" onClick={addBooking}>
          + Create booking
        </button>
      </header>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Loading bookings…</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-sm text-slate-600">
          No bookings yet.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Client</th>
                    <th className="px-6 py-3 text-left font-medium">Service</th>
                    <th className="px-6 py-3 text-left font-medium">Date & Time</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBookings.map(b => (
                    <tr 
                      key={b.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => editBooking(b)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{b.clientName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {b.serviceName || b.serviceId}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {b.start ? new Date(b.start).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(b.status)}`}>
                          {(b.status || 'PENDING').charAt(0) + (b.status || 'PENDING').slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="text-xs text-teal-700 hover:text-teal-900 font-medium hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            editBooking(b);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4">
              <div className="text-sm text-slate-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, bookings.length)} of {bookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BookingFormModal 
        open={modalOpen} 
        onClose={closeModal} 
        editing={editing}
        businessId={business?.id}
      />
    </div>
  );
}
