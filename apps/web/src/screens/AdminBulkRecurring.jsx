import React, { useEffect, useState } from 'react';
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

export function AdminBulkRecurring({ business }) {
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    clientId: '',
    dogId: '',
    serviceId: '',
    startDate: '',
    time: '10:00',
    weeks: 4,
    daysOfWeek: [1, 3, 5] // default Mon/Wed/Fri
  });
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [createdCount, setCreatedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [c, d, s] = await Promise.all([
        repo.listClientsByBusiness(business.id),
        repo.listDogsByBusiness(business.id),
        repo.listServicesByBusiness(business.id)
      ]);
      setClients(c);
      setDogs(d);
      setServices(s);
    })();
  }, [business]);

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

  function buildSchedulePreview() {
    if (!form.startDate || form.daysOfWeek.length === 0) return '';
    const start = new Date(form.startDate + 'T00:00:00');
    const items = [];
    for (let w = 0; w < Number(form.weeks || 0); w++) {
      for (const day of form.daysOfWeek) {
        const date = new Date(start);
        const offset =
          ((day - start.getDay() + 7) % 7) + w * 7;
        date.setDate(date.getDate() + offset);
        items.push(date.toDateString());
      }
    }
    return `${items.length} jobs over ${form.weeks} weeks`;
  }

  useEffect(() => {
    setSummary(buildSchedulePreview());
  }, [form.startDate, form.weeks, form.daysOfWeek]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setCreatedCount(0);

    if (!business) {
      setError('No business loaded.');
      return;
    }

    if (!form.clientId || !form.dogId || !form.serviceId || !form.startDate) {
      setError('Please choose client, dog, service and start date.');
      return;
    }

    if (form.daysOfWeek.length === 0) {
      setError('Choose at least one day of the week.');
      return;
    }

    setLoading(true);

    try {
      const [hours, minutes] = form.time.split(':').map(Number);
      const startBase = new Date(form.startDate + 'T00:00:00');
      let created = 0;

      for (let w = 0; w < Number(form.weeks || 0); w++) {
        for (const day of form.daysOfWeek) {
          const date = new Date(startBase);
          const offset =
            ((day - startBase.getDay() + 7) % 7) + w * 7;
          date.setDate(date.getDate() + offset);
          date.setHours(hours, minutes, 0, 0);

          const startIso = date.toISOString();

          await repo.createJob({
            businessId: business.id,
            clientId: form.clientId,
            dogIds: [form.dogId],
            serviceId: form.serviceId,
            start: startIso,
            status: 'BOOKED',
            notes: 'Bulk recurring booking'
          });

          created++;
        }
      }

      setCreatedCount(created);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to create jobs. Please try again.');
      console.error(err);
    }
  }

  if (!business) {
    return <p className="text-sm text-slate-600">No business loaded.</p>;
  }

  const clientDogs = dogs.filter(d => d.clientId === form.clientId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bulk recurring bookings</h1>
      <p className="text-xs text-slate-600">
        Create a regular weekly pattern (e.g. Mon/Wed/Fri at 10am) for a client and
        generate multiple scheduled jobs in one go.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-3 max-w-xl">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.clientId}
            onChange={e =>
              setForm(f => ({ ...f, clientId: e.target.value, dogId: '' }))
            }
          >
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name || c.email}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.dogId}
            onChange={e =>
              setForm(f => ({ ...f, dogId: e.target.value }))
            }
          >
            <option value="">Select dog</option>
            {clientDogs.map(d => (
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
            <option value="">Select service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            className="border rounded px-3 py-2 text-sm"
            type="date"
            value={form.startDate}
            onChange={e =>
              setForm(f => ({ ...f, startDate: e.target.value }))
            }
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-slate-600 block">
              Days of week
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

          <div className="space-y-1">
            <label className="text-xs text-slate-600 block">
              Time & weeks
            </label>
            <div className="flex gap-2">
              <input
                className="border rounded px-3 py-2 text-sm"
                type="time"
                step="900"
                value={form.time}
                onChange={e =>
                  setForm(f => ({ ...f, time: e.target.value }))
                }
              />
              <input
                className="border rounded px-3 py-2 text-sm w-20"
                type="number"
                min="1"
                max="52"
                value={form.weeks}
                onChange={e =>
                  setForm(f => ({ ...f, weeks: e.target.value }))
                }
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {summary || 'Select a start date and days to see schedule summary.'}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {createdCount > 0 && (
          <p className="text-sm text-emerald-700">
            Created {createdCount} jobs.
          </p>
        )}

        <button 
          className="btn btn-primary text-sm" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate jobs'}
        </button>
      </form>
    </div>
  );
}
