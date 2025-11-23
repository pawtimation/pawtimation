import React, { useEffect, useState } from 'react';
import { staffApi } from '../lib/auth';
import { DatePicker } from '../components/DatePicker';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Generate time slots in 15-minute increments
function generateTimeSlots(startHour = 6, endHour = 22, interval = 15) {
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

export function StaffAvailability() {
  const [availability, setAvailability] = useState({
    Mon: { start: '09:00', end: '17:00' },
    Tue: { start: '09:00', end: '17:00' },
    Wed: { start: '09:00', end: '17:00' },
    Thu: { start: '09:00', end: '17:00' },
    Fri: { start: '09:00', end: '17:00' },
    Sat: { start: '', end: '' },
    Sun: { start: '', end: '' }
  });
  const [exceptionDays, setExceptionDays] = useState([]);
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionReason, setNewExceptionReason] = useState('');
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const timeSlots = generateTimeSlots(6, 22, 15);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    setLoading(true);
    try {
      // Get current staff user info
      const meRes = await staffApi('/me');
      if (!meRes.ok) {
        console.error('Failed to get staff info');
        setLoading(false);
        return;
      }
      
      const user = await meRes.json();
      setStaffId(user.id);

      const response = await staffApi(`/staff/${user.id}/availability`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          // Handle both old and new format
          if (data.exceptionDays) {
            setExceptionDays(data.exceptionDays);
            // Remove exceptionDays from the object to get weekly schedule
            const { exceptionDays, ...weeklySchedule } = data;
            if (Object.keys(weeklySchedule).length > 0) {
              setAvailability(weeklySchedule);
            }
          } else {
            // Old format - just the weekly schedule at top level
            setAvailability(data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveAvailability() {
    if (!staffId) return;

    setSaving(true);
    setMessage(null);

    try {
      // Merge weekly schedule with exception days for backward compatibility
      // Store days at top level, exceptionDays as separate field
      const availabilityData = {
        ...availability,
        exceptionDays
      };
      
      const response = await staffApi(`/staff/${staffId}/availability`, {
        method: 'POST',
        body: JSON.stringify(availabilityData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Availability saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save availability' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  }

  function updateDay(day, field, value) {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  }

  function toggleDayOff(day) {
    const isOff = !availability[day].start && !availability[day].end;
    setAvailability(prev => ({
      ...prev,
      [day]: isOff 
        ? { start: '09:00', end: '17:00' }
        : { start: '', end: '' }
    }));
  }

  function addExceptionDay() {
    if (!newExceptionDate) return;
    
    const newException = {
      date: newExceptionDate,
      reason: newExceptionReason || 'Day off',
      id: Date.now().toString()
    };
    
    setExceptionDays(prev => [...prev, newException]);
    setNewExceptionDate('');
    setNewExceptionReason('');
  }

  function removeExceptionDay(id) {
    setExceptionDays(prev => prev.filter(ex => ex.id !== id));
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading availability...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">My Availability</h1>
        <p className="text-sm text-slate-600">
          Set your weekly working hours. New jobs will only be scheduled during your available times.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Weekly Schedule</h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {DAYS_OF_WEEK.filter(d => availability[d]?.start && availability[d]?.end).length} days active
          </span>
        </div>
        
        <div className="grid gap-3">
          {DAYS_OF_WEEK.map(day => {
            const dayAvail = availability[day] || { start: '', end: '' };
            const isAvailable = dayAvail.start && dayAvail.end;

            return (
              <div 
                key={day} 
                className={`
                  border-2 rounded-xl p-4 transition-all duration-200
                  ${isAvailable 
                    ? 'border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50' 
                    : 'border-slate-200 bg-slate-50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={() => toggleDayOff(day)}
                        className="w-5 h-5 text-teal-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-teal-500 cursor-pointer transition-all"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                        {day}
                      </span>
                      {isAvailable && dayAvail.start && dayAvail.end && (
                        <span className="ml-2 text-xs text-teal-700 font-medium">
                          {dayAvail.start} - {dayAvail.end}
                        </span>
                      )}
                    </div>
                  </label>
                  {!isAvailable && (
                    <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                      Day off
                    </span>
                  )}
                </div>

                {isAvailable && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Start Time
                      </label>
                      <select
                        value={dayAvail.start}
                        onChange={(e) => updateDay(day, 'start', e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm hover:border-teal-300"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        End Time
                      </label>
                      <select
                        value={dayAvail.end}
                        onChange={(e) => updateDay(day, 'end', e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm hover:border-teal-300"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Exception Days</h2>
          <p className="text-sm text-slate-600 mt-1">
            Add specific dates when you're unavailable (holidays, sick days, etc.)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <DatePicker
              value={newExceptionDate}
              onChange={setNewExceptionDate}
              preventPastDates={true}
              placeholder="Select date"
            />
          </div>
          <input
            type="text"
            value={newExceptionReason}
            onChange={(e) => setNewExceptionReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 border-2 border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all hover:border-teal-300"
          />
          <button
            onClick={addExceptionDay}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newExceptionDate}
          >
            Add Day
          </button>
        </div>

        {exceptionDays.length > 0 ? (
          <div className="space-y-2">
            {exceptionDays
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(exception => (
                <div
                  key={exception.id}
                  className="flex items-center justify-between p-4 border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl group hover:border-rose-300 transition-all"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {new Date(exception.date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{exception.reason}</p>
                  </div>
                  <button
                    onClick={() => removeExceptionDay(exception.id)}
                    className="text-rose-600 hover:text-rose-700 font-semibold text-sm bg-white px-4 py-2 rounded-lg border-2 border-rose-200 hover:border-rose-300 transition-all shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-500">No exception days added yet</p>
            <p className="text-xs text-slate-400 mt-1">Use the form above to add days off</p>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4 flex-1">
          <h3 className="text-sm font-bold text-teal-900 mb-2 flex items-center gap-2">
            <span className="text-lg">ℹ️</span> How it works
          </h3>
          <ul className="text-xs text-teal-800 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">✓</span>
              <span>Check the days you're available to work</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">✓</span>
              <span>Set your start and end times for each day</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">✓</span>
              <span>Leave days unchecked if you're unavailable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold">✓</span>
              <span>The booking system will only assign you jobs during your available hours</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={loadAvailability}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold text-sm transition-all border-2 border-slate-200 hover:border-slate-300"
            disabled={saving}
          >
            Reset
          </button>
          <button
            onClick={saveAvailability}
            className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}
