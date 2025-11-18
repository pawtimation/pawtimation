import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

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
        const userStr = localStorage.getItem('pt_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        if (!user || !user.businessId) return;

        const [jobsRes, servicesRes, clientsRes, dogsRes] = await Promise.all([
          fetch(`${API_BASE}/api/jobs?businessId=${user.businessId}`),
          fetch(`${API_BASE}/api/services?businessId=${user.businessId}`),
          fetch(`${API_BASE}/api/clients?businessId=${user.businessId}`),
          fetch(`${API_BASE}/api/dogs?businessId=${user.businessId}`)
        ]);

        const allJobs = await jobsRes.json();
        const allServices = await servicesRes.json();
        const allClients = await clientsRes.json();
        const allDogs = await dogsRes.json();

        const myJobs = allJobs.filter(j => j.staffId === user.id);
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
              <div key={job.id} className="py-2 text-sm">
                <div className="font-medium">
                  {svc?.name || 'Service'} · {dog?.name || 'Dog'}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
