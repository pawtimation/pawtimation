import { useState, useEffect } from 'react';
import {
  generateTimeSlots,
  roundToNearest15,
  combineDateAndTime,
  extractDateAndTime,
  formatTimeSlot,
  isWithinBusinessHours,
  getTodayDate,
  getBusinessHoursForDay,
  getDayName
} from '../lib/timeUtils';

export default function DateTimePicker({
  value,
  onChange,
  businessHours = null,
  minDate = null,
  label = 'Date & Time',
  required = false,
  className = ''
}) {
  const { date: initialDate, time: initialTime } = extractDateAndTime(value);
  const [selectedDate, setSelectedDate] = useState(initialDate || '');
  const [selectedTime, setSelectedTime] = useState(initialTime || '09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dayName = selectedDate ? getDayName(selectedDate) : 'Mon';
  const dayBusinessHours = businessHours 
    ? getBusinessHoursForDay(dayName, businessHours)
    : { start: '00:00', end: '24:00' };

  const timeSlots = selectedDate 
    ? generateTimeSlots(0, 24, 15).filter(slot =>
        isWithinBusinessHours(slot, dayBusinessHours)
      )
    : generateTimeSlots(0, 24, 15);

  useEffect(() => {
    if (!selectedDate) {
      if (value !== '') {
        onChange('');
      }
      return;
    }
    const combined = combineDateAndTime(selectedDate, selectedTime);
    if (combined !== value) {
      onChange(combined);
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    const { date: newDate, time: newTime } = extractDateAndTime(value);
    if (newDate !== selectedDate) {
      setSelectedDate(newDate || '');
    }
    if (newTime && newTime !== selectedTime) {
      setSelectedTime(newTime);
    }
  }, [value]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    if (newDate) {
      const newDayName = getDayName(newDate);
      const newDayHours = businessHours
        ? getBusinessHoursForDay(newDayName, businessHours)
        : { start: '00:00', end: '24:00' };
      
      if (!isWithinBusinessHours(selectedTime, newDayHours)) {
        setSelectedTime(newDayHours.start);
      }
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setShowTimePicker(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="flex gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={minDate || undefined}
          required={required}
          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all bg-white text-slate-800 font-medium"
        />
        
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full px-4 py-2.5 text-left border border-slate-300 rounded-lg bg-white shadow-sm hover:shadow-md hover:border-brand-teal focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition-all flex items-center justify-between font-medium text-slate-800"
          >
            <span>{formatTimeSlot(selectedTime)}</span>
            <svg className="w-5 h-5 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showTimePicker && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowTimePicker(false)}
              />
              <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                {timeSlots.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center font-medium">
                    No available times
                  </div>
                ) : (
                  <div className="py-1">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleTimeSelect(slot)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-all ${
                          slot === selectedTime
                            ? 'bg-brand-teal text-white font-semibold shadow-sm'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        {formatTimeSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {businessHours && (
        <p className="text-xs text-slate-600 mt-2 font-medium">
          Business hours: {formatTimeSlot(dayBusinessHours.start)} - {formatTimeSlot(dayBusinessHours.end)}
        </p>
      )}
    </div>
  );
}
