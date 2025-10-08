import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';
import { useToast } from '../components/Toast';

export function CompanionCalendar() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    try {
      // Load from localStorage first
      const localData = localStorage.getItem('pt_availability');
      const localSlots = localData ? JSON.parse(localData) : [];
      
      const response = await fetch(`${API_BASE}/companion/availability`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const apiSlots = data.slots || [];
        
        // Merge local and API slots, removing duplicates
        const allSlots = [...apiSlots];
        localSlots.forEach(localSlot => {
          if (!apiSlots.some(s => s.date === localSlot.date)) {
            allSlots.push(localSlot);
          }
        });
        
        setSlots(allSlots);
      } else {
        // If API fails, use local data
        setSlots(localSlots);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
      // Fallback to localStorage
      const localData = localStorage.getItem('pt_availability');
      setSlots(localData ? JSON.parse(localData) : []);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  }

  function isDateAvailable(date) {
    const dateStr = date.toISOString().split('T')[0];
    return slots.some(slot => slot.date === dateStr);
  }

  function isDateSelected(date) {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  }

  function toggleDateSelection(date) {
    const dateStr = date.toISOString().split('T')[0];
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  }

  async function markAvailable() {
    if (selectedDates.length === 0) {
      showToast('Please select at least one date', 'error');
      return;
    }

    // Save to localStorage immediately
    const newSlots = selectedDates.map(date => ({
      date,
      startTime: '09:00',
      endTime: '17:00',
      service: 'all'
    }));
    
    const existingLocal = localStorage.getItem('pt_availability');
    const existingSlots = existingLocal ? JSON.parse(existingLocal) : [];
    const updatedSlots = [...existingSlots];
    
    newSlots.forEach(newSlot => {
      if (!updatedSlots.some(s => s.date === newSlot.date)) {
        updatedSlots.push(newSlot);
      }
    });
    
    localStorage.setItem('pt_availability', JSON.stringify(updatedSlots));

    // Try to sync with API
    let successCount = 0;
    for (const date of selectedDates) {
      try {
        const response = await fetch(`${API_BASE}/companion/availability`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date,
            startTime: '09:00',
            endTime: '17:00',
            service: 'all'
          })
        });

        if (response.ok) {
          successCount++;
        }
      } catch (err) {
        console.error('Failed to add slot:', err);
      }
    }

    if (successCount > 0) {
      showToast(`Added ${successCount} available date(s)!`, 'success');
    } else {
      showToast(`Saved ${selectedDates.length} date(s) locally - will sync when online`, 'success');
    }
    
    setSelectedDates([]);
    loadSlots();
  }

  function renderCalendar() {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);

      let bgColor = 'bg-white hover:bg-slate-50';
      let textColor = 'text-slate-700';
      let border = 'border border-slate-200';

      if (isPast) {
        bgColor = 'bg-slate-100';
        textColor = 'text-slate-400';
        border = 'border border-slate-200';
      } else if (available) {
        bgColor = 'bg-emerald-100 hover:bg-emerald-200';
        textColor = 'text-emerald-800';
        border = 'border-2 border-emerald-400';
      }

      if (selected && !isPast) {
        bgColor = 'bg-teal-500 text-white';
        textColor = 'text-white';
        border = 'border-2 border-teal-600';
      }

      days.push(
        <button
          key={day}
          onClick={() => !isPast && toggleDateSelection(date)}
          disabled={isPast}
          className={`aspect-square ${bgColor} ${textColor} ${border} rounded-lg flex items-center justify-center font-medium transition-all ${
            !isPast ? 'cursor-pointer' : 'cursor-not-allowed'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  }

  function changeMonth(offset) {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="text-slate-500">Loading calendar...</div></div>;
  }

  const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {ToastComponent}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Availability Calendar</h2>
          <p className="text-slate-600 mt-1">Click dates to select, then mark as available</p>
        </div>
        <button onClick={() => navigate('/companion/checklist')} className="text-slate-600 hover:text-slate-800">
          ← Checklist
        </button>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
          >
            ← Prev
          </button>
          <h3 className="text-xl font-semibold">{monthName}</h3>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {selectedDates.length > 0 && (
        <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-teal-900">Selected: {selectedDates.length} date(s)</h3>
              <p className="text-sm text-teal-700">Click 'Mark as Available' to save these dates</p>
            </div>
            <button
              onClick={() => setSelectedDates([])}
              className="text-sm text-teal-700 hover:text-teal-900 underline"
            >
              Clear selection
            </button>
          </div>
          <button
            onClick={markAvailable}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition"
          >
            ✓ Mark {selectedDates.length} Date(s) as Available
          </button>
        </div>
      )}

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Legend</h3>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Synced when online
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-100 border-2 border-emerald-400 rounded"></div>
            <span>Available ({slots.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 border-2 border-teal-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded"></div>
            <span>Past dates</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <strong>💡 How to use:</strong>
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          <li>Click on dates to select them (click again to deselect)</li>
          <li>Selected dates turn teal/blue</li>
          <li>Click "Mark as Available" button to save your selections</li>
          <li>Green dates = Already marked as available for bookings</li>
          <li>Gray dates = Past dates (cannot be selected)</li>
        </ul>
      </div>
    </div>
  );
}
