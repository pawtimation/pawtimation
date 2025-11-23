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
      const userStr = localStorage.getItem('pt_user');
      if (!userStr) {
        console.error('No user found');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
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

      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-800">Weekly Schedule</h2>
        
        <div className="space-y-3">
          {DAYS_OF_WEEK.map(day => {
            const dayAvail = availability[day] || { start: '', end: '' };
            const isAvailable = dayAvail.start && dayAvail.end;

            return (
              <div key={day} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={() => toggleDayOff(day)}
                      className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                    />
                    <span className="font-medium text-slate-800">{day}</span>
                  </label>
                  {!isAvailable && (
                    <span className="text-xs text-slate-500">Day off</span>
                  )}
                </div>

                {isAvailable && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Start Time</label>
                      <select
                        value={dayAvail.start}
                        onChange={(e) => updateDay(day, 'start', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">End Time</label>
                      <select
                        value={dayAvail.end}
                        onChange={(e) => updateDay(day, 'end', e.target.value)}
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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

      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-800">Exception Days</h2>
        <p className="text-xs text-slate-600">
          Add specific dates when you're unavailable (holidays, sick days, etc.)
        </p>

        <div className="flex gap-2">
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
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            onClick={addExceptionDay}
            className="btn btn-secondary"
            disabled={!newExceptionDate}
          >
            Add
          </button>
        </div>

        {exceptionDays.length > 0 ? (
          <div className="space-y-2">
            {exceptionDays
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(exception => (
                <div
                  key={exception.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {new Date(exception.date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-slate-600">{exception.reason}</p>
                  </div>
                  <button
                    onClick={() => removeExceptionDay(exception.id)}
                    className="text-rose-600 hover:text-rose-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No exception days added</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={loadAvailability}
          className="btn btn-secondary"
          disabled={saving}
        >
          Reset
        </button>
        <button
          onClick={saveAvailability}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>

      <div className="card bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">ℹ️ How it works</h3>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>• Check the days you're available to work</li>
          <li>• Set your start and end times for each day</li>
          <li>• Leave days unchecked if you're unavailable</li>
          <li>• The booking system will only assign you jobs during your available hours</li>
        </ul>
      </div>
    </div>
  );
}
