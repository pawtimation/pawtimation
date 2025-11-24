import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function generateTimeSlots(is24Hour = false, availableTimes = null) {
  const slots = [];
  
  if (availableTimes && availableTimes.length > 0) {
    return availableTimes.map(timeValue => {
      const [hour, minute] = timeValue.split(':').map(Number);
      const hourDisplay = is24Hour ? hour : (hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour));
      const period = hour >= 12 ? 'PM' : 'AM';
      const minuteStr = String(minute).padStart(2, '0');
      
      const display = is24Hour 
        ? timeValue
        : `${hourDisplay}:${minuteStr} ${period}`;
      
      return { value: timeValue, display };
    });
  }
  
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourDisplay = is24Hour ? hour : (hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour));
      const period = hour >= 12 ? 'PM' : 'AM';
      const minuteStr = String(minute).padStart(2, '0');
      
      const value24 = `${String(hour).padStart(2, '0')}:${minuteStr}`;
      const display = is24Hour 
        ? `${String(hour).padStart(2, '0')}:${minuteStr}`
        : `${hourDisplay}:${minuteStr} ${period}`;
      
      slots.push({ value: value24, display });
    }
  }
  
  return slots;
}

export function TimePicker({ 
  value, 
  onChange, 
  disabled = false, 
  className = '',
  placeholder = 'Select time',
  is24Hour = false,
  availableTimes = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const timeSlots = generateTimeSlots(is24Hour, availableTimes);
  
  const selectedSlot = timeSlots.find(slot => slot.value === value);
  const displayValue = selectedSlot ? selectedSlot.display : placeholder;
  
  const filteredSlots = searchTerm
    ? timeSlots.filter(slot => slot.display.toLowerCase().includes(searchTerm.toLowerCase()))
    : timeSlots;
  
  useEffect(() => {
    function updatePosition() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    }
    
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen && value && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isOpen, value]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  function handleSelect(timeValue) {
    onChange(timeValue);
    setIsOpen(false);
    setSearchTerm('');
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && filteredSlots.length === 1) {
      handleSelect(filteredSlots[0].value);
    }
  }
  
  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] shadow-2xl border-2 border-teal-200 overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        borderRadius: '12px',
        backgroundColor: '#F8F9FA',
        maxHeight: '320px'
      }}
      role="listbox"
    >
      <div className="sticky top-0 p-2 bg-white border-b border-slate-200">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search time..."
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          autoFocus
        />
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '268px' }}>
        {filteredSlots.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            No matching times found
          </div>
        ) : (
          filteredSlots.map((slot) => {
            const isSelected = slot.value === value;
            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => handleSelect(slot.value)}
                data-selected={isSelected}
                className={`w-full px-5 text-left transition-colors active:scale-95 ${
                  isSelected 
                    ? 'text-white font-bold' 
                    : 'text-slate-700 hover:bg-teal-50 font-medium'
                }`}
                style={{
                  minHeight: '52px',
                  backgroundColor: isSelected ? '#2BB673' : 'transparent',
                  fontSize: '16px'
                }}
                role="option"
                aria-selected={isSelected}
              >
                {slot.display}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
  
  return (
    <>
      <div 
        ref={containerRef} 
        className={className}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 text-left border-2 transition-all font-medium ${
            disabled 
              ? 'bg-slate-100 cursor-not-allowed text-slate-500 border-slate-200' 
              : 'bg-white hover:border-teal-400 cursor-pointer border-slate-300 active:scale-95'
          }`}
          style={{
            borderRadius: '12px',
            minHeight: '56px',
            fontSize: '16px',
            color: value ? '#222222' : '#9CA3AF'
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between">
            <span className="text-base">{displayValue}</span>
            <svg 
              className={`w-6 h-6 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
      
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}
