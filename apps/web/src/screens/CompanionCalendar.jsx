import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function CompanionCalendar() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [toast, setToast] = useState(null);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    service: 'all'
  });

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

  async function saveSlot() {
    if (!newSlot.date) {
      showToast('Please select a date', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/companion/availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSlot)
      });

      if (response.ok) {
        showToast('Slot added successfully!', 'success');
        setShowAddSlot(false);
        setNewSlot({ date: '', startTime: '09:00', endTime: '17:00', service: 'all' });
        loadSlots();
      } else {
        showToast('Failed to add slot', 'error');
      }
    } catch (err) {
      showToast('Error saving slot', 'error');
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getNextWeekendDates() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = date.getDay();
      if (day === 0 || day === 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates.slice(0, 4);
  }

  function quickAddWeekendSlots() {
    const weekendDates = getNextWeekendDates();
    weekendDates.forEach(date => {
      setNewSlot({ date, startTime: '09:00', endTime: '17:00', service: 'all' });
    });
    showToast(`Added ${weekendDates.length} weekend slots`, 'success');
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="text-slate-500">Loading calendar...</div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <p className="text-slate-600 mt-1">Manage when you're available for bookings</p>
        </div>
        <button onClick={() => navigate('/companion/checklist')} className="text-slate-600 hover:text-slate-800">
          ← Checklist
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowAddSlot(true)}
          className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-teal-700"
        >
          + Add Slot
        </button>
        <button
          onClick={quickAddWeekendSlots}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Quick Add: Next 2 Weekends
        </button>
      </div>

      {showAddSlot && (
        <div className="bg-white border-2 border-brand-teal rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Add Availability Slot</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={newSlot.date}
                onChange={e => setNewSlot({...newSlot, date: e.target.value})}
                className="border rounded px-3 py-2 w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Type</label>
              <select
                value={newSlot.service}
                onChange={e => setNewSlot({...newSlot, service: e.target.value})}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="all">All Services</option>
                <option value="walk">Walk Only</option>
                <option value="sitting">Sitting Only</option>
                <option value="daycare">Daycare Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveSlot}
              className="px-4 py-2 bg-brand-teal text-white rounded hover:bg-teal-700"
            >
              Save Slot
            </button>
            <button
              onClick={() => setShowAddSlot(false)}
              className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Your Availability ({slots.length} slots)</h3>
        {slots.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No availability slots yet</p>
            <p className="text-sm mt-2">Add your first slot to start receiving booking requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <div className="font-medium">{new Date(slot.date).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="text-sm text-slate-600">{slot.startTime} - {slot.endTime} • {slot.service === 'all' ? 'All Services' : slot.service}</div>
                </div>
                <button className="text-rose-600 hover:text-rose-700 text-sm">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
