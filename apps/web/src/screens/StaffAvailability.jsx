import React, { useEffect, useState } from 'react';
import { staffApi } from '../lib/auth';
import { WeeklyAvailabilitySection } from '../components/WeeklyAvailabilitySection';

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

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    setLoading(true);
    try {
      // Get current staff user info from dedicated staff endpoint
      const meRes = await staffApi('/staff/me');
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
    const dayData = availability[day] || { start: '', end: '' };
    const isOff = !dayData.start && !dayData.end;
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

      <WeeklyAvailabilitySection
        availability={availability}
        exceptionDays={exceptionDays}
        newExceptionDate={newExceptionDate}
        newExceptionReason={newExceptionReason}
        onUpdateDay={updateDay}
        onToggleDayOff={toggleDayOff}
        onSetNewExceptionDate={setNewExceptionDate}
        onSetNewExceptionReason={setNewExceptionReason}
        onAddExceptionDay={addExceptionDay}
        onRemoveExceptionDay={removeExceptionDay}
        onSave={saveAvailability}
        saving={saving}
      />
    </div>
  );
}
