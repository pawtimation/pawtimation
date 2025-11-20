import React from 'react';
import { getTimeSlots } from '../../utils/calendar.js';

export function CalendarWeekGrid({ weekDates, bookingsMap, onSelectBooking }) {
  const slots = getTimeSlots();

  return (
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
              {slots.map(t => (
                <div key={t} className="h-10 border-b hover:bg-slate-50"></div>
              ))}

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
                  PENDING: 'bg-slate-200 border-slate-400 text-slate-800',
                  REQUESTED: 'bg-amber-200 border-amber-500 text-amber-900',
                  SCHEDULED: 'bg-teal-200 border-teal-500 text-teal-900',
                  APPROVED: 'bg-emerald-200 border-emerald-500 text-emerald-900',
                  COMPLETE: 'bg-blue-200 border-blue-500 text-blue-900',
                  COMPLETED: 'bg-blue-200 border-blue-500 text-blue-900',
                  DECLINED: 'bg-rose-200 border-rose-400 text-rose-900',
                  CANCELLED: 'bg-slate-300 border-slate-500 text-slate-700'
                };

                const colorClass = statusColors[b.status] || 'bg-teal-200 border-teal-500 text-teal-900';

                const earlyIndicator = isEarly ? '↑ ' : '';
                const lateIndicator = isLate ? ' ↓' : '';

                return (
                  <div
                    key={b.id}
                    className={`absolute left-1 right-1 border text-xs p-1 rounded cursor-pointer overflow-hidden ${colorClass}`}
                    style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                    onClick={() => onSelectBooking(b)}
                    title={`${b.serviceName} - ${b.clientName} - ${b.staffName || 'Unassigned'} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  >
                    <div className="font-medium truncate">{earlyIndicator}{b.serviceName}{lateIndicator}</div>
                    <div className="text-[10px] truncate">{b.clientName}</div>
                    {b.staffName && (
                      <div className="text-[9px] font-semibold truncate opacity-80">
                        👤 {b.staffName}
                      </div>
                    )}
                    <div className="text-[10px]">
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
