import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

export function ClientBook() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [business, setBusiness] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    dogId: '',
    serviceId: '',
    startLocal: '',
    notes: ''
  });
  const [error, setError] = useState('');

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!client || !business) return;

    if (!form.dogId || !form.serviceId || !form.startLocal) {
      setError('Please choose a dog, a service and a start time.');
      return;
    }

    const startIso = new Date(form.startLocal).toISOString();

    try {
      await repo.createJob({
        businessId: business.id,
        clientId: client.id,
        dogIds: [form.dogId],
        serviceId: form.serviceId,
        start: startIso,
        notes: form.notes,
        status: 'REQUESTED'
      });

      navigate('/client/dashboard');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
  }

  if (!client || !business) {
    return (
      <div className="text-sm text-slate-600">
        Loading booking form…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Request a booking</h1>
      <p className="text-xs text-slate-600">
        You&apos;re booking with <strong>{business.name}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.dogId}
            onChange={e => setForm(f => ({ ...f, dogId: e.target.value }))}
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
            onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
          >
            <option value="">Choose service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="datetime-local"
          value={form.startLocal}
          onChange={e => setForm(f => ({ ...f, startLocal: e.target.value }))}
        />

        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Notes for your walker (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-3">
          <button className="btn btn-primary text-sm" type="submit">
            Send request
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => navigate('/client/dashboard')}
          >
            Cancel
          </button>
        </div>
      </form>

      <p className="text-xs text-slate-500">
        This creates a <strong>request</strong>. Your dog walker will review and
        confirm it before it&apos;s fully booked.
      </p>
    </div>
  );
}
