import React, { useEffect, useState } from 'react';
import { getWeekDates, groupBookingsByDay } from '../utils/calendar.js';
import { CalendarWeekGrid } from '../components/calendar/CalendarWeekGrid.jsx';
import { BookingFormModal } from '../components/BookingFormModal';
import { api } from '../lib/auth';

export function StaffCalendar({ business, staffUser }) {
  const [reference, setReference] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(reference);

  useEffect(() => {
    load();
  }, [business, staffUser]);

  async function load() {
    if (!business || !staffUser) return;
    setLoading(true);
    try {
      // Use enriched bookings list endpoint with staffId filter
      const response = await api(`/bookings/list?staffId=${staffUser.id}`);
      const myJobs = await response.json();
      
      setBookings(myJobs || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setBookings([]);
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

  function onBookingMoved(updatedBooking) {
    // Update the booking in the local state
    setBookings(prev => prev.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    ));
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
          <h1 className="text-xl font-semibold">My Calendar</h1>
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
        onBookingMoved={onBookingMoved}
      />

      <div className="text-xs text-slate-500">
        Drag bookings to reschedule or click to view details and edit.
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
