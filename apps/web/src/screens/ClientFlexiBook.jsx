import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 }
];

function getNextMonday() {
  const d = new Date();
  const day = d.getDay(); // 0-6, Sun-Sat
  const diff = (1 - day + 7) % 7 || 7; // days to next Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function ClientFlexiBook() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [business, setBusiness] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    weekStart: getNextMonday(),
    dogId: '',
    serviceId: '',
    time: '10:00',
    daysOfWeek: [1, 3, 5] // Mon/Wed/Fri
  });
  const [error, setError] = useState('');
  const [createdCount, setCreatedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }
      const { clientId, businessId } = JSON.parse(raw);

      const [c, b, allDogs, allServices] = await Promise.all([
        repo.getClient(clientId),
        repo.getBusiness(businessId),
        repo.listDogsByBusiness(businessId),
        repo.listServicesByBusiness(businessId)
      ]);

      if (!c || !b) {
        localStorage.removeItem('pt_client');
        navigate('/client/login');
        return;
      }

      setClient(c);
      setBusiness(b);
      setDogs(allDogs.filter(d => d.clientId === c.id));
      setServices(allServices);
    })();
  }, [navigate]);

  function toggleDay(dayValue) {
    setForm(f => {
      const exists = f.daysOfWeek.includes(dayValue);
      return {
        ...f,
        daysOfWeek: exists
          ? f.daysOfWeek.filter(v => v !== dayValue)
          : [...f.daysOfWeek, dayValue]
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCreatedCount(0);

    if (!client || !business) return;

    if (!form.weekStart || !form.dogId || !form.serviceId) {
      setError('Choose week start, dog and service.');
      return;
    }

    if (form.daysOfWeek.length === 0) {
      setError('Select at least one day.');
      return;
    }

    setLoading(true);

    try {
      const weekStart = new Date(form.weekStart + 'T00:00:00');
      const [hours, minutes] = form.time.split(':').map(Number);
      let created = 0;

      for (const day of form.daysOfWeek) {
        const date = new Date(weekStart);
        const offset = (day - weekStart.getDay() + 7) % 7;
        date.setDate(date.getDate() + offset);
        date.setHours(hours, minutes, 0, 0);

        const startIso = date.toISOString();

        await repo.createJob({
          businessId: business.id,
          clientId: client.id,
          dogIds: [form.dogId],
          serviceId: form.serviceId,
          start: startIso,
          status: 'REQUESTED',
          notes: 'Flexi weekly booking'
        });

        created++;
      }

      setCreatedCount(created);
      setLoading(false);

      // Show success message for 1.5 seconds before navigating
      setTimeout(() => {
        navigate('/client/dashboard');
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('Failed to create bookings. Please try again.');
      console.error(err);
    }
  }

  if (!client || !business) {
    return (
      <div className="text-sm text-slate-600">
        Loading flexi booking…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Flexi weekly booking</h1>
      <p className="text-xs text-slate-600">
        Quickly request multiple walks for a week. Your walker will approve and confirm
        exact times if needed.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-600 block">
              Week starting
            </label>
            <input
              className="border rounded px-3 py-2 text-sm w-full"
              type="date"
              value={form.weekStart}
              onChange={e =>
                setForm(f => ({ ...f, weekStart: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 block">
              Time of day
            </label>
            <input
              className="border rounded px-3 py-2 text-sm w-full"
              type="time"
              value={form.time}
              onChange={e =>
                setForm(f => ({ ...f, time: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.dogId}
            onChange={e =>
              setForm(f => ({ ...f, dogId: e.target.value }))
            }
          >
            <option value="">Choose dog</option>
            {dogs.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.serviceId}
            onChange={e =>
              setForm(f => ({ ...f, serviceId: e.target.value }))
            }
          >
            <option value="">Choose service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-600 block">
            Days this week
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={
                  'px-2 py-1 text-xs rounded border ' +
                  (form.daysOfWeek.includes(d.value)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-slate-700 border-slate-300')
                }
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {createdCount > 0 && (
          <p className="text-sm text-emerald-700">
            Requested {createdCount} walks for that week.
          </p>
        )}

        <div className="flex gap-3">
          <button 
            className="btn btn-primary text-sm" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Request week'}
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => navigate('/client/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
