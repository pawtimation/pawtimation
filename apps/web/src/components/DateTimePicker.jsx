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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={minDate || undefined}
          required={required}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent flex items-center justify-between"
          >
            <span>{formatTimeSlot(selectedTime)}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showTimePicker && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowTimePicker(false)}
              />
              <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg">
                {timeSlots.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No available times
                  </div>
                ) : (
                  timeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleTimeSelect(slot)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-teal-50 transition-colors ${
                        slot === selectedTime
                          ? 'bg-teal-100 text-teal-900 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {formatTimeSlot(slot)}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {businessHours && (
        <p className="text-xs text-gray-500 mt-1">
          Business hours: {formatTimeSlot(dayBusinessHours.start)} - {formatTimeSlot(dayBusinessHours.end)}
        </p>
      )}
    </div>
  );
}
