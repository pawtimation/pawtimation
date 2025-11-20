import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';
import { getWeekDates, groupBookingsByDay } from '../utils/calendar.js';
import { CalendarWeekGrid } from '../components/calendar/CalendarWeekGrid.jsx';
import { BookingFormModal } from '../components/BookingFormModal';

export function BusinessCalendar({ business }) {
  const [reference, setReference] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(reference);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    if (!business) return;
    setLoading(true);
    try {
      const [jobs, services, clients, staff] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
        repo.listStaffByBusiness(business.id)
      ]);
      
      // Enrich jobs with service, client, and staff names
      const enriched = jobs.map(job => {
        const service = services.find(s => s.id === job.serviceId);
        const client = clients.find(c => c.id === job.clientId);
        const staffMember = staff.find(s => s.id === job.staffId);
        return {
          ...job,
          serviceName: service?.name || job.serviceId,
          clientName: client?.name || 'Unknown',
          staffName: staffMember?.name || (job.staffId ? 'Unknown Staff' : 'Unassigned')
        };
      });
      
      setBookings(enriched || []);
    } finally {
      setLoading(false);
    }
  }

  function nextWeek() {
    const d = new Date(reference);
    d.setDate(d.getDate() + 7);
    setReference(d);
  }

  function prevWeek() {
    const d = new Date(reference);
    d.setDate(d.getDate() - 7);
    setReference(d);
  }

  function today() {
    setReference(new Date());
  }

  function onSelectBooking(b) {
    setEditing(b);
    setOpen(true);
  }

  async function closeModal(saved) {
    setOpen(false);
    setEditing(null);
    if (saved) load();
  }

  const bookingsMap = groupBookingsByDay(bookings);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const weekLabel = `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  if (loading) {
    return <p className="text-sm text-slate-600">Loading calendar…</p>;
  }

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Team Calendar</h1>
          <p className="text-sm text-slate-600">{weekLabel}</p>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-secondary text-sm" onClick={prevWeek}>
            ← Previous
          </button>
          <button className="btn btn-secondary text-sm" onClick={today}>
            Today
          </button>
          <button className="btn btn-secondary text-sm" onClick={nextWeek}>
            Next →
          </button>
        </div>
      </header>

      <CalendarWeekGrid
        weekDates={weekDates}
        bookingsMap={bookingsMap}
        onSelectBooking={onSelectBooking}
      />

      <div className="text-xs text-slate-500">
        Click any booking to view details and edit.
      </div>

      <BookingFormModal 
        open={open} 
        onClose={closeModal} 
        editing={editing}
        businessId={business?.id}
      />
    </div>
  );
}
