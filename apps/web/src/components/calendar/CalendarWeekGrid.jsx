import React, { useState } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { getTimeSlots } from '../../utils/calendar.js';
import { adminApi } from '../../lib/auth';

function DraggableBooking({ booking, top, height, colorClass, earlyIndicator, lateIndicator, onSelect }) {
  const start = new Date(booking.start);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking.id,
    data: { booking }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`absolute left-1 right-1 border text-xs p-1 rounded cursor-move overflow-hidden ${colorClass} ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
      onClick={(e) => {
        // Prevent drag from triggering click
        if (!isDragging) {
          onSelect(booking);
        }
      }}
      title={`${booking.serviceName} - ${booking.clientName} - ${booking.staffName || 'Unassigned'} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${booking.route ? ' - Route available' : ''} - Drag to reschedule`}
    >
      <div className="font-medium truncate">{earlyIndicator}{booking.serviceName}{lateIndicator} {booking.route && '🗺️'}</div>
      <div className="text-[10px] truncate">{booking.clientName}</div>
      {booking.staffName && (
        <div className="text-[9px] font-semibold truncate opacity-80">
          👤 {booking.staffName}
        </div>
      )}
      <div className="text-[10px]">
        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

function DroppableTimeSlot({ date, timeSlot, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${date}-${timeSlot}`,
    data: { date, timeSlot }
  });

  return (
    <div
      ref={setNodeRef}
      className={`h-10 border-b hover:bg-slate-50 ${isOver ? 'bg-teal-100' : ''}`}
    >
      {children}
    </div>
  );
}

export function CalendarWeekGrid({ weekDates, bookingsMap, onSelectBooking, onBookingMoved }) {
  const slots = getTimeSlots();
  const [activeBooking, setActiveBooking] = useState(null);

  const handleDragStart = (event) => {
    setActiveBooking(event.active.data.current?.booking);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveBooking(null);

    if (!over) return;

    const booking = active.data.current?.booking;
    const dropData = over.data.current;

    if (!booking || !dropData) return;

    // Parse the drop zone date and time slot
    const [dateStr, timeSlot] = over.id.split('-');
    const [year, month, day] = dateStr.split('/').map(Number);
    const [hours, minutes] = timeSlot.split(':').map(Number);

    // Create new start time
    const newStart = new Date(year, month - 1, day, hours, minutes);
    const newStartISO = newStart.toISOString();

    // Don't update if dropped in same location
    const oldStart = new Date(booking.start);
    if (
      oldStart.getFullYear() === newStart.getFullYear() &&
      oldStart.getMonth() === newStart.getMonth() &&
      oldStart.getDate() === newStart.getDate() &&
      oldStart.getHours() === newStart.getHours() &&
      oldStart.getMinutes() === newStart.getMinutes()
    ) {
      return;
    }

    // Calculate new end time based on service duration
    const oldEnd = new Date(booking.end);
    const durationMs = oldEnd - oldStart;
    const newEnd = new Date(newStart.getTime() + durationMs);

    // Optimistically update the UI immediately
    const optimisticBooking = {
      ...booking,
      start: newStartISO,
      end: newEnd.toISOString()
    };

    if (onBookingMoved) {
      onBookingMoved(optimisticBooking);
    }

    try {
      // Call the backend to update the booking time
      const response = await adminApi(`/bookings/${booking.id}/move`, {
        method: 'POST',
        body: JSON.stringify({ start: newStartISO })
      });

      if (response.ok) {
        const data = await response.json();
        // Update with server response (in case server made adjustments)
        if (onBookingMoved) {
          onBookingMoved(data.booking);
        }
      } else {
        console.error('Failed to move booking');
        alert('Failed to reschedule booking. Reverting changes.');
        // Revert to original booking
        if (onBookingMoved) {
          onBookingMoved(booking);
        }
      }
    } catch (error) {
      console.error('Error moving booking:', error);
      alert('Error rescheduling booking. Reverting changes.');
      // Revert to original booking
      if (onBookingMoved) {
        onBookingMoved(booking);
      }
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="border rounded overflow-hidden bg-white">
        <div className="grid grid-cols-8 bg-slate-50 border-b text-xs text-slate-600">
          <div className="p-2"></div>
          {weekDates.map(d => (
            <div key={d.toISOString()} className="p-2 text-center font-medium">
              {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 text-xs relative">
          <div className="col-span-1 border-r bg-slate-50">
            {slots.map(t => (
              <div key={t} className="h-10 border-b px-2 py-1 text-slate-400">{t}</div>
            ))}
          </div>

          {weekDates.map(day => {
            // Use local date string for key
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            const key = `${year}-${month}-${dayNum}`;
            const dayBookings = bookingsMap[key] || [];

            return (
              <div key={key} className="border-r relative">
                {slots.map(t => {
                  const dropId = `${year}/${month}/${dayNum}-${t}`;
                  return (
                    <DroppableTimeSlot key={t} date={`${year}/${month}/${dayNum}`} timeSlot={t} />
                  );
                })}

                {dayBookings.map(b => {
                  const start = new Date(b.start);
                  const end = new Date(b.end);
                  const startMinutes = start.getHours() * 60 + start.getMinutes();
                  const endMinutes = end.getHours() * 60 + end.getMinutes();
                  const dayStart = 6 * 60;
                  const dayEnd = 20.5 * 60;

                  // Calculate visible portion within grid
                  const isEarly = startMinutes < dayStart;
                  const isLate = endMinutes > dayEnd;
                  
                  const visibleStart = Math.max(startMinutes, dayStart);
                  const visibleEnd = Math.min(endMinutes, dayEnd);
                  
                  // For bookings entirely outside the visible range, show a small indicator at the edge
                  let top, height;
                  if (visibleStart >= visibleEnd) {
                    // Booking is entirely outside visible hours
                    if (endMinutes <= dayStart) {
                      // Ends before grid starts - show at top
                      top = 0;
                      height = 20;
                    } else {
                      // Starts after grid ends - show at bottom
                      const totalSlots = slots.length;
                      const slotHeight = 40; // Each time slot is 40px tall
                      top = (totalSlots * slotHeight) - 22; // Position near bottom edge
                      height = 20;
                    }
                  } else {
                    // Normal visible booking
                    top = (visibleStart - dayStart) * (40 / 30);
                    height = Math.max((visibleEnd - visibleStart) * (40 / 30), 20);
                  }

                  const statusColors = {
                    PENDING: 'bg-amber-200 border-amber-500 text-amber-900',
                    BOOKED: 'bg-emerald-200 border-emerald-500 text-emerald-900',
                    COMPLETED: 'bg-blue-200 border-blue-500 text-blue-900',
                    CANCELLED: 'bg-slate-300 border-slate-500 text-slate-700'
                  };

                  const colorClass = statusColors[b.status] || 'bg-emerald-200 border-emerald-500 text-emerald-900';

                  const earlyIndicator = isEarly ? '↑ ' : '';
                  const lateIndicator = isLate ? ' ↓' : '';

                  return (
                    <DraggableBooking
                      key={b.id}
                      booking={b}
                      top={top}
                      height={height}
                      colorClass={colorClass}
                      earlyIndicator={earlyIndicator}
                      lateIndicator={lateIndicator}
                      onSelect={onSelectBooking}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeBooking ? (
          <div className="bg-teal-500 text-white p-2 rounded shadow-lg text-xs">
            <div className="font-medium">{activeBooking.serviceName}</div>
            <div>{activeBooking.clientName}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
