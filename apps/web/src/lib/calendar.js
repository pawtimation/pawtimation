export function datesInRange(startISO, endISO) {
  const dates = [];
  const start = new Date(startISO + 'T00:00:00');
  const end = new Date(endISO + 'T00:00:00');
  
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function applyRepeat({ startISO, endISO, weekdays }) {
  const allDates = datesInRange(startISO, endISO);
  
  return allDates.filter(dateISO => {
    const date = new Date(dateISO + 'T00:00:00');
    const dayOfWeek = date.getDay();
    return weekdays.includes(dayOfWeek);
  });
}

export function mergeAvailability(currentMap, dates, state) {
  const updated = { ...currentMap };
  
  dates.forEach(dateISO => {
    if (state === 'available') {
      delete updated[dateISO];
    } else if (state === 'unavailable') {
      updated[dateISO] = 'unavailable';
    }
  });
  
  return updated;
}

export function buildICS(availabilityMap, { name = 'Pawtimation Availability' } = {}) {
  const availableDates = [];
  
  for (const dateISO in availabilityMap) {
    if (!availabilityMap[dateISO] || availabilityMap[dateISO] !== 'unavailable') {
      availableDates.push(dateISO);
    }
  }
  
  if (availableDates.length === 0) {
    availableDates.push(new Date().toISOString().split('T')[0]);
  }
  
  const events = availableDates.map(dateISO => {
    const start = new Date(dateISO + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    return [
      'BEGIN:VEVENT',
      `DTSTART:${dateISO.replace(/-/g, '')}`,
      `DTEND:${end.toISOString().split('T')[0].replace(/-/g, '')}`,
      `SUMMARY:${name}`,
      'DESCRIPTION:Available for pet care bookings',
      `DTSTAMP:${formatDate(new Date())}`,
      `UID:${dateISO}@pawtimation.com`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');
  
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pawtimation//Availability Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pawtimation-availability.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrlForAllDay(dateISO, title = 'Available for Pet Care') {
  const start = dateISO.replace(/-/g, '');
  const end = start;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: 'Available for Pawtimation bookings',
    ctz: 'Europe/London'
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
