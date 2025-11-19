export function getWeekDates(reference) {
  const start = new Date(reference);
  // Normalize to midnight local to avoid UTC drift
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 = Sun
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // start Monday
  start.setDate(diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function groupBookingsByDay(bookings) {
  const map = {};
  bookings.forEach(b => {
    const d = new Date(b.start);
    // Use local date to avoid UTC timezone shifts
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    if (!map[key]) map[key] = [];
    map[key].push(b);
  });
  return map;
}

export function getTimeSlots() {
  const slots = [];
  for (let h = 6; h <= 20; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

export function bookingOverlaps(b, startIso, endIso) {
  const s1 = new Date(b.start);
  const e1 = new Date(b.end);
  const s2 = new Date(startIso);
  const e2 = new Date(endIso);
  return (s1 < e2 && s2 < e1);
}
