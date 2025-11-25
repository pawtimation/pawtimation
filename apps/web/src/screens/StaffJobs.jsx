import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSession, staffApi } from '../lib/auth';

const STATUS_GROUPS = ['upcoming', 'completed', 'cancelled'];

export function StaffJobs() {
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = getSession('STAFF');
        if (!session || !session.businessId) return;

        const [jobsRes, servicesRes, clientsRes, dogsRes] = await Promise.all([
          staffApi(`/bookings/list?staffId=${session.userId}`),
          staffApi(`/services?businessId=${session.businessId}`),
          staffApi(`/clients?businessId=${session.businessId}`),
          staffApi(`/dogs?businessId=${session.businessId}`)
        ]);

        const myJobs = await jobsRes.json();
        const allServices = await servicesRes.json();
        const allClients = await clientsRes.json();
        const allDogs = await dogsRes.json();

        setJobs(myJobs);
        setServices(allServices);
        setClients(allClients);
        setDogs(allDogs);
      } catch (err) {
        console.error('Failed to load staff jobs:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const serviceById = useMemo(
    () => Object.fromEntries(services.map(s => [s.id, s])),
    [services]
  );
  const clientById = useMemo(
    () => Object.fromEntries(clients.map(c => [c.id, c])),
    [clients]
  );
  const dogById = useMemo(
    () => Object.fromEntries(dogs.map(d => [d.id, d])),
    [dogs]
  );

  function groupForStatus(status) {
    if (!status) return 'upcoming';
    const s = status.toUpperCase();
    if (s === 'CANCELLED' || s === 'DECLINED') return 'cancelled';
    if (s === 'COMPLETED' || s === 'COMPLETE') return 'completed';
    return 'upcoming';
  }

  const filtered = useMemo(() => {
    return jobs
      .filter(j => groupForStatus(j.status) === tab)
      .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }, [jobs, tab]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">My jobs</h1>
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My jobs</h1>
        <div className="inline-flex rounded border border-slate-200 text-xs">
          {STATUS_GROUPS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={
                'px-3 py-1 border-r last:border-r-0 ' +
                (tab === key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700')
              }
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-600">
          No jobs in this category yet.
        </p>
      ) : (
        <div className="card divide-y">
          {filtered.map(job => {
            const svc = serviceById[job.serviceId];
            const client = clientById[job.clientId];
            const dog = job.dogIds?.length ? dogById[job.dogIds[0]] : null;

            return (
              <Link 
                key={job.id} 
                to={`/staff/bookings/${job.id}`}
                className="block py-3 px-2 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {svc?.name || 'Service'} · {dog?.name || 'Dog'}
                      {job.route && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                          Route
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {client?.name || 'Client'} ·{' '}
                      {job.start
                        ? new Date(job.start).toLocaleString()
                        : 'No start time'}
                    </div>
                    {job.notes && (
                      <div className="mt-1 text-xs text-slate-500">
                        {job.notes}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
