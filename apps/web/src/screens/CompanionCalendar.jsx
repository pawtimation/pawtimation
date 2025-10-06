import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function CompanionCalendar() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [isBlockingMode, setIsBlockingMode] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSlots();
  }, []);

  async function loadSlots() {
    try {
      const response = await fetch(`${API_BASE}/companion/availability`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  function isDateBlocked(date) {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.includes(dateStr);
  }

  function isDateInRange(date) {
    if (!selectedStartDate) return false;
    if (!selectedEndDate) return date.getTime() === selectedStartDate.getTime();
    
    const start = selectedStartDate.getTime();
    const end = selectedEndDate.getTime();
    const current = date.getTime();
    
    return current >= start && current <= end;
  }

  function handleDateClick(date) {
    if (isBlockingMode) {
      // Blocking mode - select date range to block
      if (!selectedStartDate) {
        setSelectedStartDate(date);
      } else if (!selectedEndDate) {
        if (date >= selectedStartDate) {
          setSelectedEndDate(date);
        } else {
          setSelectedStartDate(date);
        }
      } else {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      }
    }
  }

  async function blockSelectedDates() {
    if (!selectedStartDate) return;

    const endDate = selectedEndDate || selectedStartDate;
    const datesToBlock = [];
    
    for (let d = new Date(selectedStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      datesToBlock.push(d.toISOString().split('T')[0]);
    }

    setBlockedDates([...blockedDates, ...datesToBlock]);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    showToast(`Blocked ${datesToBlock.length} date(s)`, 'success');
  }

  async function addAvailabilityRange() {
    if (!selectedStartDate) {
      showToast('Please select a date range first', 'error');
      return;
    }

    const endDate = selectedEndDate || selectedStartDate;
    const datesToAdd = [];
    
    for (let d = new Date(selectedStartDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      datesToAdd.push(d.toISOString().split('T')[0]);
    }

    let successCount = 0;
    for (const date of datesToAdd) {
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
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      loadSlots();
    } else {
      showToast('Failed to add dates', 'error');
    }
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
      const blocked = isDateBlocked(date);
      const inRange = isDateInRange(date);
      const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
      const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();

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
      } else if (blocked) {
        bgColor = 'bg-rose-100';
        textColor = 'text-rose-800';
        border = 'border-2 border-rose-400';
      }

      if (inRange && !isPast) {
        bgColor = 'bg-teal-200';
        border = 'border-2 border-teal-500';
      }

      if (isStart || isEnd) {
        bgColor = 'bg-teal-500 text-white';
        textColor = 'text-white';
      }

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(date)}
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
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-rose-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-brand-ink">Availability Calendar</h2>
          <p className="text-slate-600 mt-1">Select dates to mark as available or blocked</p>
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

      <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-lg">Actions</h3>
        
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              setIsBlockingMode(false);
              setSelectedStartDate(null);
              setSelectedEndDate(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !isBlockingMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            🟢 Mark Available
          </button>
          <button
            onClick={() => {
              setIsBlockingMode(true);
              setSelectedStartDate(null);
              setSelectedEndDate(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              isBlockingMode ? 'bg-rose-600 text-white' : 'bg-slate-200 hover:bg-slate-300'
            }`}
          >
            🔴 Block Dates
          </button>
        </div>

        {selectedStartDate && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="text-sm font-medium text-teal-800 mb-2">
              Selected: {selectedStartDate.toLocaleDateString('en-GB')}
              {selectedEndDate && ` - ${selectedEndDate.toLocaleDateString('en-GB')}`}
            </div>
            <div className="flex gap-2">
              {!isBlockingMode ? (
                <button
                  onClick={addAvailabilityRange}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  ✓ Add as Available
                </button>
              ) : (
                <button
                  onClick={blockSelectedDates}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  ✗ Block Dates
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                }}
                className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-400 rounded"></div>
            <span>Available ({slots.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-100 border-2 border-rose-400 rounded"></div>
            <span>Blocked ({blockedDates.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-teal-200 border-2 border-teal-500 rounded"></div>
            <span>Selected Range</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
        <strong>💡 How to use:</strong>
        <ul className="mt-2 space-y-1 ml-4 list-disc">
          <li>Choose "Mark Available" or "Block Dates" mode</li>
          <li>Click a date to select start date</li>
          <li>Click another date to select end date (creates a range)</li>
          <li>Click the action button to confirm</li>
          <li>Green dates = Available for bookings</li>
          <li>Red dates = Blocked/Unavailable</li>
        </ul>
      </div>
    </div>
  );
}
