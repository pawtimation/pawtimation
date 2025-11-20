export function getStaffConflicts(staff, booking, existingBookings, excludeBookingId = null) {
  return existingBookings.filter(b => {
    // Exclude the booking being edited from conflict checks
    if (excludeBookingId && b.id === excludeBookingId) return false;
    
    if (b.staffId !== staff.id) return false;
    // Only check BLOCKING statuses
    const BLOCKING_STATUSES = ['BOOKED', 'COMPLETED'];
    if (!BLOCKING_STATUSES.includes(b.status)) return false;

    const startA = new Date(b.start);
    const endA = new Date(b.end);
    const startB = new Date(booking.start);
    const endB = new Date(booking.end);

    const overlap =
      (startA <= startB && startB < endA) ||
      (startA < endB && endB <= endA) ||
      (startB <= startA && endA <= endB);

    return overlap;
  });
}

export function staffCanDoService(staff, serviceId) {
  return staff.services?.includes(serviceId);
}

export function isStaffAvailable(staff, bookingStart, bookingEnd) {
  if (!staff.weeklyAvailability) return false;
  
  const startDate = new Date(bookingStart);
  const endDate = new Date(bookingEnd);
  const dayName = startDate.toLocaleString('en-US', { weekday: 'short' });
  
  // Try both capitalized (Mon) and lowercase (mon) for robustness
  let avail = staff.weeklyAvailability[dayName];
  if (!avail) {
    avail = staff.weeklyAvailability[dayName.toLowerCase()];
  }
  
  if (!avail || !avail.start || !avail.end) return false;
  
  const bookingStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const bookingEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  const [startHour, startMin] = avail.start.split(':').map(Number);
  const [endHour, endMin] = avail.end.split(':').map(Number);
  const availStart = startHour * 60 + startMin;
  const availEnd = endHour * 60 + endMin;
  
  // Both start and end must be within availability window
  return bookingStartMinutes >= availStart && bookingEndMinutes <= availEnd;
}

export function rankStaff(staffList, booking, existingBookings, excludeBookingId = null) {
  return staffList
    .map(staff => {
      let score = 0;

      // Service qualification (most important)
      if (staffCanDoService(staff, booking.serviceId)) {
        score += 50;
      } else {
        // Not qualified for this service - skip this staff member
        return null;
      }

      // No conflicts
      const conflicts = getStaffConflicts(staff, booking, existingBookings, excludeBookingId);
      if (conflicts.length === 0) {
        score += 30;
      }

      // Available during booking time
      const available = isStaffAvailable(staff, booking.start, booking.end);
      if (available) {
        score += 20;
      }

      return {
        staff,
        score,
        conflicts,
        available,
        qualified: true
      };
    })
    .filter(Boolean) // Remove null entries (unqualified staff)
    .sort((a, b) => b.score - a.score);
}
