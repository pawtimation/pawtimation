import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';

export function AdminStaffServices({ business }) {
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [allowed, setAllowed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    if (!business) return;
    setLoading(true);
    try {
      const [s, svc] = await Promise.all([
        repo.listStaffByBusiness(business.id),
        repo.listServicesByBusiness(business.id)
      ]);
      setStaff(s || []);
      setServices(svc || []);
    } finally {
      setLoading(false);
    }
  }

  function open(member) {
    setSelected(member);
    setAllowed(member.services || []);
  }

  function toggle(serviceId) {
    if (allowed.includes(serviceId)) {
      setAllowed(allowed.filter(x => x !== serviceId));
    } else {
      setAllowed([...allowed, serviceId]);
    }
  }

  async function save() {
    await repo.saveStaffServices(selected.id, allowed);
    
    // Refresh staff list to get updated data
    await load();
    
    alert('Updated staff service permissions.');
    setSelected(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading staff…</p>;
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Staff Services</h1>
          <p className="text-slate-600 text-sm">Assign which services each staff member can perform.</p>
        </div>

        {staff.length === 0 ? (
          <div className="card text-sm text-slate-600">No staff members yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {staff.map(s => (
              <div
                key={s.id}
                className="card cursor-pointer hover:bg-slate-50"
                onClick={() => open(s)}
              >
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-slate-500">{s.email}</div>
                {s.services && s.services.length > 0 && (
                  <div className="text-xs text-teal-600 mt-1">
                    {s.services.length} service{s.services.length !== 1 ? 's' : ''} assigned
                  </div>
                )}
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
        <h1 className="text-xl font-semibold">Service Permissions</h1>
        <p className="text-sm text-slate-600">{selected.name}</p>
      </div>

      {services.length === 0 ? (
        <div className="card text-sm text-slate-600">No services configured yet.</div>
      ) : (
        <div className="card space-y-3">
          {services.map(s => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowed.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.durationMinutes} mins · £{(s.priceCents / 100).toFixed(2)}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button className="btn btn-primary text-sm" onClick={save}>
          Save services
        </button>
        <button className="btn btn-secondary text-sm" onClick={() => setSelected(null)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
