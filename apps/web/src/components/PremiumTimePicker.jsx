import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function generateTimeSlots(startHour = 0, endHour = 24, interval = 15, availableTimes = null) {
  if (availableTimes && availableTimes.length > 0) {
    return availableTimes;
  }
  
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
}

export function PremiumTimePicker({ 
  value, 
  onChange, 
  disabled = false, 
  className = '',
  placeholder = 'Select time',
  availableTimes = null,
  startHour = 0,
  endHour = 24
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const timeSlots = generateTimeSlots(startHour, endHour, 15, availableTimes);
  
  const displayValue = value || placeholder;
  
  const filteredSlots = searchTerm
    ? timeSlots.filter(slot => slot.toLowerCase().includes(searchTerm.toLowerCase()))
    : timeSlots;
  
  useEffect(() => {
    function updatePosition() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
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
        selectedElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
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
      handleSelect(filteredSlots[0]);
    }
  }
  
  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] shadow-2xl overflow-hidden"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        maxHeight: '340px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)'
      }}
      role="listbox"
    >
      <div className="sticky top-0 p-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search time..."
          className="w-full px-4 py-2.5 text-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 bg-white/90 placeholder-slate-400"
          style={{
            fontSize: '15px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          autoFocus
        />
      </div>
      
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '280px' }}>
        {filteredSlots.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500 font-medium">
            No matching times
          </div>
        ) : (
          <div className="p-1.5">
            {filteredSlots.map((slot, index) => {
              const isSelected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSelect(slot)}
                  data-selected={isSelected}
                  className={`w-full px-4 py-3 text-left transition-all duration-150 ease-out rounded-lg mb-1 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg scale-[0.98]' 
                      : 'text-slate-700 hover:bg-slate-100/70 active:bg-slate-200/60'
                  }`}
                  style={{
                    fontSize: '15px',
                    fontWeight: isSelected ? '600' : '500'
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  {slot}
                </button>
              );
            })}
          </div>
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
          className={`w-full px-4 py-3.5 text-left transition-all duration-200 ease-out font-medium group ${
            disabled 
              ? 'bg-slate-100/80 cursor-not-allowed text-slate-400' 
              : 'bg-white hover:bg-slate-50/80 cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-md'
          }`}
          style={{
            borderRadius: '14px',
            fontSize: '15px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            color: value ? '#1e293b' : '#94a3b8'
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{displayValue}</span>
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ease-out flex-shrink-0 ${
                isOpen ? 'rotate-180 text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
      
      {dropdownContent && createPortal(dropdownContent, document.body)}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </>
  );
}
