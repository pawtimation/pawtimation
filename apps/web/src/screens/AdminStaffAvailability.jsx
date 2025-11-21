import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AdminStaffAvailability({ business }) {
  const [staff, setStaff] = useState([]);
  const [selected, setSelected] = useState(null);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    if (!business) return;
    setLoading(true);
    try {
      const list = await repo.listStaffByBusiness(business.id);
      setStaff(list);
    } finally {
      setLoading(false);
    }
  }

  async function openStaff(member) {
    setSelected(member);
    const avail = await repo.getStaffWeeklyAvailability(member.id);
    setAvailability(avail || {});
  }

  function updateDay(day, field, value) {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [field]: value }
    }));
  }

  async function save() {
    await repo.saveStaffWeeklyAvailability(selected.id, availability);
    alert('Availability updated.');
    setSelected(null);
    load();
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading staff…</p>;
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Staff Availability</h1>
          <p className="text-slate-600 text-sm">Select a staff member to edit weekly availability.</p>
        </div>

        {staff.length === 0 ? (
          <div className="card text-sm text-slate-600">No staff members yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {staff.map(s => (
              <div
                key={s.id}
                className="card cursor-pointer hover:bg-slate-50"
                onClick={() => openStaff(s)}
              >
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-slate-500">{s.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        className="text-xs text-slate-500 hover:underline"
        onClick={() => setSelected(null)}
      >
        ← Back to staff
      </button>

      <div>
        <h1 className="text-xl font-semibold">Weekly Availability</h1>
        <p className="text-sm text-slate-600">{selected.name}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {DAYS.map(day => (
          <div key={day} className="card space-y-2">
            <div className="font-medium text-sm">{day}</div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-600">Start time</label>
              <input
                type="time"
                step="900"
                className="border rounded px-2 py-1 text-sm w-full"
                value={availability[day]?.start || ''}
                onChange={e => updateDay(day, 'start', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-slate-600">End time</label>
              <input
                type="time"
                step="900"
                className="border rounded px-2 py-1 text-sm w-full"
                value={availability[day]?.end || ''}
                onChange={e => updateDay(day, 'end', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary text-sm" onClick={save}>
          Save availability
        </button>
        <button className="btn btn-secondary text-sm" onClick={() => setSelected(null)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
