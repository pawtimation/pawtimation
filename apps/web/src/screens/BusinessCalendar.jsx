import React, { useEffect, useState } from 'react';
import { getWeekDates, groupBookingsByDay } from '../utils/calendar.js';
import { CalendarWeekGrid } from '../components/calendar/CalendarWeekGrid.jsx';
import { BookingFormModal } from '../components/BookingFormModal';
import { adminApi } from '../lib/auth';
import { getStaffColor } from '../lib/staffColors';

export function BusinessCalendar({ business }) {
  const [reference, setReference] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(new Set());

  const weekDates = getWeekDates(reference);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    if (!business) return;
    setLoading(true);
    try {
      const [jobsRes, servicesRes, clientsRes, staffRes] = await Promise.all([
        adminApi('/bookings/list'),
        adminApi('/services/list'),
        adminApi('/clients/list'),
        adminApi('/staff/list')
      ]);
      
      const [jobs, services, clients, staff] = await Promise.all([
        jobsRes.json(),
        servicesRes.json(),
        clientsRes.json(),
        staffRes.json()
      ]);
      
      // Enrich jobs with service, client, and staff names
      const enriched = (Array.isArray(jobs) ? jobs : []).map(job => {
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
      
      setBookings(enriched);
      setStaff(staff || []);
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

  function toggleStaff(staffId) {
    setSelectedStaff(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  }

  function toggleAll() {
    if (selectedStaff.size === staff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staff.map(s => s.id)));
    }
  }

  // Filter bookings by selected staff
  const filteredBookings = selectedStaff.size === 0 
    ? bookings 
    : bookings.filter(b => selectedStaff.has(b.staffId));

  const bookingsMap = groupBookingsByDay(filteredBookings);

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

      {/* Staff Filter Bar */}
      {staff.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Filter by Staff</h3>
            <button
              onClick={toggleAll}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              {selectedStaff.size === staff.length ? 'Clear All' : 'Select All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {staff.map(s => {
              const isSelected = selectedStaff.has(s.id);
              const staffColor = getStaffColor(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-current shadow-sm'
                      : 'border-gray-300 opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${staffColor}30` : 'transparent',
                    borderColor: isSelected ? staffColor : undefined
                  }}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggleStaff(s.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: staffColor }}
                  />
                  <span className="text-sm font-medium text-gray-700">{s.name}</span>
                </label>
              );
            })}
          </div>
          {selectedStaff.size > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} from {selectedStaff.size} staff member{selectedStaff.size !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

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
