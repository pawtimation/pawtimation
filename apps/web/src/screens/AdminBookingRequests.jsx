import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';

export function AdminBookingRequests({ business }) {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [staffChoice, setStaffChoice] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!business) return;
      setLoading(true);
      const [jobs, c, s, d, st] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listDogsByBusiness(business.id),
        repo.listStaffByBusiness(business.id)
      ]);
      setRequests(jobs.filter(j => j.status === 'PENDING'));
      setClients(c);
      setServices(s);
      setDogs(d);
      setStaff(st);
      setLoading(false);
    })();
  }, [business]);

  function refresh() {
    if (!business) return;
    (async () => {
      const [jobs, c, s, d, st] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listDogsByBusiness(business.id),
        repo.listStaffByBusiness(business.id)
      ]);
      setRequests(jobs.filter(j => j.status === 'PENDING'));
      setClients(c);
      setServices(s);
      setDogs(d);
      setStaff(st);
    })();
  }

  const clientById = Object.fromEntries(clients.map(c => [c.id, c]));
  const serviceById = Object.fromEntries(services.map(s => [s.id, s]));
  const dogById = Object.fromEntries(dogs.map(d => [d.id, d]));
  const staffById = Object.fromEntries(staff.map(s => [s.id, s]));

  async function handleApprove(job) {
    const chosenStaffId = staffChoice[job.id] || null;
    const svc = serviceById[job.serviceId];

    if (!svc || typeof svc.durationMinutes !== 'number') {
      alert('Service not found or missing duration; cannot approve booking.');
      return;
    }

    if (!job.start) {
      alert('Booking is missing start time; cannot approve.');
      return;
    }

    const startIso = job.start;
    const endMs =
      new Date(startIso).getTime() + svc.durationMinutes * 60 * 1000;
    const endIso = new Date(endMs).toISOString();

    let staffId = chosenStaffId;

    if (!staffId) {
      const avail = await repo.listAvailableStaffForSlot(
        business.id,
        startIso,
        endIso
      );
      const free = avail.find(a => a.isFree);
      if (!free) {
        const proceed = window.confirm(
          'No staff are fully free at this time. Approve anyway without assignment?'
        );
        if (!proceed) return;
      } else {
        staffId = free.staff.id;
      }
    }

    if (staffId) {
      await repo.assignStaffToJob(job.id, staffId);
    }

    await repo.updateJob(job.id, { status: 'BOOKED' });
    refresh();
  }

  async function handleDecline(jobId) {
    await repo.updateJob(jobId, { status: 'CANCELLED' });
    refresh();
  }

  if (!business) {
    return (
      <div className="text-sm text-slate-600">
        No business selected.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Booking requests</h1>
      <p className="text-xs text-slate-600">
        Clients create requests from their portal. Approve to schedule and
        optionally assign a staff member.
      </p>

      <div className="card">
        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-600">No pending requests.</p>
        ) : (
          <ul className="divide-y">
            {requests
              .slice()
              .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
              .map(j => {
                const client = clientById[j.clientId];
                const svc = serviceById[j.serviceId];
                const dog = j.dogIds?.length ? dogById[j.dogIds[0]] : null;

                return (
                  <li key={j.id} className="py-3 text-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {svc?.name || 'Service'} ·{' '}
                          {client?.name || 'Unknown client'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {j.start
                            ? new Date(j.start).toLocaleString()
                            : 'No start time'}
                          {dog ? ` · ${dog.name}` : ''}
                        </div>
                        {j.notes && (
                          <div className="mt-1 text-xs text-slate-500">
                            {j.notes}
                          </div>
                        )}
                      </div>
                      <span className="badge bg-amber-100 text-amber-700">
                        Requested
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={staffChoice[j.id] || ''}
                        onChange={e =>
                          setStaffChoice(m => ({
                            ...m,
                            [j.id]: e.target.value
                          }))
                        }
                      >
                        <option value="">Auto assign staff</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-xs"
                          type="button"
                          onClick={() => handleApprove(j)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          type="button"
                          onClick={() => handleDecline(j.id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
