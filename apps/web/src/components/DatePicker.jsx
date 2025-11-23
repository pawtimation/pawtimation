import React, { useState, useRef, useEffect } from 'react';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateToISO(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateFromISO(isoString) {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select date',
  preventPastDates = false,
  minDate = null,
  bookingDates = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  
  const selectedDate = value ? parseDateFromISO(value) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const minimumDate = minDate ? parseDateFromISO(minDate) : (preventPastDates ? today : null);
  if (minimumDate) {
    minimumDate.setHours(0, 0, 0, 0);
  }
  
  useEffect(() => {
    if (selectedDate) {
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }
  
  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }
  
  function handleDateSelect(day) {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    
    if (minimumDate && date < minimumDate) {
      return;
    }
    
    onChange(formatDateToISO(date));
    setIsOpen(false);
  }
  
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  
  function handleTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextMonth();
      } else {
        handlePrevMonth();
      }
    }
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }
  
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth);
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  const bookingDateStrings = new Set(bookingDates.map(d => formatDateToISO(new Date(d))));
  
  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : placeholder;
  
  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      style={{
        '--datepicker-radius': '12px',
        '--datepicker-selected': '#2BB673',
        '--datepicker-today-outline': 'rgba(0,0,0,0.2)'
      }}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 text-left border border-slate-300 transition-all ${
          disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white hover:border-slate-400 cursor-pointer'
        }`}
        style={{
          borderRadius: 'var(--datepicker-radius)',
          height: '44px',
          fontSize: '15px',
          color: value ? '#222222' : '#9CA3AF'
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <span>{displayValue}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-white shadow-lg border border-slate-200 p-4"
          style={{
            borderRadius: 'var(--datepicker-radius)',
            minWidth: '320px'
          }}
          role="dialog"
          aria-label="Calendar"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-base font-semibold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }
              
              const cellDate = new Date(viewYear, viewMonth, day);
              cellDate.setHours(0, 0, 0, 0);
              
              const isToday = isSameDay(cellDate, today);
              const isSelected = isSameDay(cellDate, selectedDate);
              const isPast = minimumDate && cellDate < minimumDate;
              const hasBooking = bookingDateStrings.has(formatDateToISO(cellDate));
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !isPast && handleDateSelect(day)}
                  disabled={isPast}
                  className={`relative h-10 text-sm rounded-lg transition-all ${
                    isPast 
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSelected
                      ? 'text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  } ${isToday && !isSelected ? 'ring-2 ring-slate-300' : ''}`}
                  style={{
                    backgroundColor: isSelected ? 'var(--datepicker-selected)' : 'transparent'
                  }}
                  aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                  aria-selected={isSelected}
                >
                  {day}
                  {hasBooking && !isSelected && (
                    <div 
                      className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500"
                      aria-label="Has bookings"
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          {minimumDate && (
            <div className="mt-3 text-xs text-slate-500 text-center">
              Dates before {minimumDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} are disabled
            </div>
          )}
        </div>
      )}
    </div>
  );
}
