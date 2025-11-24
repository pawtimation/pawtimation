import { useState, useEffect } from 'react';
import { DatePicker } from './DatePicker';
import {
  combineDateAndTime,
  extractDateAndTime,
  getDayName,
  getBusinessHoursForDay,
  generateTimeSlots,
  isWithinBusinessHours
} from '../lib/timeUtils';

export default function DateTimePicker({
  value,
  onChange,
  businessHours = null,
  minDate = null,
  label = 'Date & Time',
  required = false,
  className = '',
  bookingDates = []
}) {
  const { date: initialDate, time: initialTime } = extractDateAndTime(value);
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [selectedTime, setSelectedTime] = useState(initialTime || '');
  const [availableTimes, setAvailableTimes] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized || availableTimes === null) {
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      if (value !== '') {
        onChange('');
      }
      return;
    }
    
    if (availableTimes.length === 0) {
      if (value !== '') {
        onChange('');
      }
      return;
    }
    
    if (!availableTimes.includes(selectedTime)) {
      return;
    }
    
    const combined = combineDateAndTime(selectedDate, selectedTime);
    if (combined !== value) {
      onChange(combined);
    }
  }, [selectedDate, selectedTime, isInitialized, availableTimes]);

  useEffect(() => {
    const { date: newDate, time: newTime } = extractDateAndTime(value);
    if (newDate !== selectedDate) {
      setSelectedDate(newDate || '');
    }
    if (newTime && newTime !== selectedTime) {
      setSelectedTime(newTime);
    }
  }, [value]);

  const dayHoursHash = (() => {
    if (!selectedDate || !businessHours) return null;
    const dayName = getDayName(selectedDate);
    const dayHours = getBusinessHoursForDay(dayName, businessHours);
    if (!dayHours) return 'closed';
    return JSON.stringify(dayHours);
  })();

  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes(null);
      setIsInitialized(true);
      return;
    }
    
    if (!businessHours) {
      const fullDaySlots = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const slot = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          fullDaySlots.push(slot);
        }
      }
      setAvailableTimes(fullDaySlots);
      setIsInitialized(true);
      return;
    }
    
    const dayName = getDayName(selectedDate);
    const dayHours = getBusinessHoursForDay(dayName, businessHours);
    
    if (!dayHours || !dayHours.start || !dayHours.end) {
      setAvailableTimes([]);
      setIsInitialized(true);
      return;
    }
    
    const startHour = parseInt(dayHours.start.split(':')[0], 10);
    const startMinute = parseInt(dayHours.start.split(':')[1] || '0', 10);
    const endHour = parseInt(dayHours.end.split(':')[0], 10);
    const endMinute = parseInt(dayHours.end.split(':')[1] || '0', 10);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    const allowed = [];
    
    if (startMinutes === endMinutes) {
      setAvailableTimes([]);
      setIsInitialized(true);
      return;
    }
    
    if (endMinutes < startMinutes) {
      for (let minutes = startMinutes; minutes < 24 * 60; minutes += 15) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        allowed.push(slot);
      }
      
      for (let minutes = 0; minutes < endMinutes; minutes += 15) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        allowed.push(slot);
      }
    } else {
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        allowed.push(slot);
      }
    }
    
    setAvailableTimes(allowed);
    setIsInitialized(true);
  }, [selectedDate, dayHoursHash]);
  
  useEffect(() => {
    if (availableTimes === null) {
      return;
    }
    
    if (availableTimes.length === 0) {
      if (selectedTime !== '') {
        setSelectedTime('');
      }
      return;
    }
    
    if (selectedTime && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    } else if (!selectedTime && availableTimes.length > 0) {
      setSelectedTime(availableTimes[0]);
    }
  }, [availableTimes, selectedTime]);

  function handleDateChange(newDate) {
    setAvailableTimes(null);
    setIsInitialized(false);
    setSelectedDate(newDate);
  }

  function handleTimeChange(newTime) {
    setSelectedTime(newTime);
  }

  const preventPastDates = minDate !== null;
  const isTimeDisabled = availableTimes !== null && availableTimes.length === 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <DatePicker
        value={selectedDate}
        onChange={handleDateChange}
        preventPastDates={preventPastDates}
        minDate={minDate}
        bookingDates={bookingDates}
        placeholder="Select date"
      />
      
      <select
        value={isTimeDisabled ? '' : selectedTime}
        onChange={(e) => handleTimeChange(e.target.value)}
        disabled={isTimeDisabled || !selectedDate}
        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm hover:border-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{isTimeDisabled ? "No times available" : !selectedDate ? "Select a date first" : "Select time"}</option>
        {Array.isArray(availableTimes) && availableTimes.map(time => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
      
      {isTimeDisabled && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          ⚠️ No available times for this day based on business hours
        </div>
      )}
    </div>
  );
}
