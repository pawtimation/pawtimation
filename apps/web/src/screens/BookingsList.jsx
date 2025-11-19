import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';
import { BookingFormModal } from '../components/BookingFormModal';

export function BookingsList({ business }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    setLoading(true);
    try {
      if (!business) return;
      const items = await repo.listJobsByBusiness?.(business.id);
      setBookings(items || []);
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

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-slate-600">View and manage all bookings.</p>
        </div>
        <button className="btn btn-primary text-sm" onClick={addBooking}>
          Create booking
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-slate-600">Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <div className="card text-sm text-slate-600">No bookings yet.</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Service</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">{b.clientName || 'Unknown'}</td>
                  <td className="px-4 py-2">{b.serviceName || b.serviceId}</td>
                  <td className="px-4 py-2">
                    {b.start ? new Date(b.start).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2">{b.status || 'PENDING'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="text-xs text-teal-700 hover:underline"
                      onClick={() => editBooking(b)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
