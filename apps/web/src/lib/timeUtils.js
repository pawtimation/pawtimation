export function generateTimeSlots(startHour = 0, endHour = 24, intervalMinutes = 15) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  if (endHour === 24 && startHour < 24) {
    slots.push('00:00');
  }
  return slots;
}

export function roundToNearest15(timeString) {
  if (!timeString) return '';
  
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  
  const roundedMinute = Math.round(minute / 15) * 15;
  
  if (roundedMinute === 60) {
    const newHour = (hour + 1) % 24;
    return `${String(newHour).padStart(2, '0')}:00`;
  }
  
  return `${String(hour).padStart(2, '0')}:${String(roundedMinute).padStart(2, '0')}`;
}

export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  
  const roundedTime = roundToNearest15(timeStr);
  return `${dateStr}T${roundedTime}`;
}

export function extractDateAndTime(datetimeStr) {
  if (!datetimeStr) return { date: '', time: '' };
  
  const [date, time] = datetimeStr.split('T');
  return {
    date: date || '',
    time: time ? roundToNearest15(time.slice(0, 5)) : ''
  };
}

export function formatTimeSlot(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${minute} ${period}`;
}

export function isWithinBusinessHours(timeStr, businessHours) {
  if (!businessHours || !businessHours.start || !businessHours.end) {
    return true;
  }
  
  const [hour, minute] = timeStr.split(':').map(Number);
  const timeMinutes = hour * 60 + minute;
  
  const [startHour, startMinute] = businessHours.start.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  
  const [endHour, endMinute] = businessHours.end.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;
  
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

export function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getBusinessHoursForDay(dayName, businessSettings) {
  if (!businessSettings?.workingHours?.schedule?.[dayName]) {
    return { start: '09:00', end: '17:00' };
  }
  const daySchedule = businessSettings.workingHours.schedule[dayName];
  return {
    start: daySchedule.start || '09:00',
    end: daySchedule.end || '17:00'
  };
}

export function getDayName(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
