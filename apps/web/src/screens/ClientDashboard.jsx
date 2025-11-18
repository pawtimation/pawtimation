import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

export function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [business, setBusiness] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [dogs, setDogs] = useState([]);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      const { clientId, businessId } = JSON.parse(raw);

      const [c, b, allJobs, allDogs] = await Promise.all([
        repo.getClient(clientId),
        repo.getBusiness(businessId),
        repo.listJobsByBusiness(businessId),
        repo.listDogsByBusiness(businessId)
      ]);

      if (!c || !b) {
        localStorage.removeItem('pt_client');
        navigate('/client/login');
        return;
      }

      setClient(c);
      setBusiness(b);
      setJobs(allJobs.filter(j => j.clientId === c.id));
      setDogs(allDogs.filter(d => d.clientId === c.id));
    })();
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem('pt_client');
    navigate('/');
  }

  if (!client || !business) {
    return (
      <div className="text-sm text-slate-600">
        Loading your account…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Hi {client.name || client.email}
          </h1>
          <p className="text-xs text-slate-500">
            You&apos;re linked to <strong>{business.name}</strong>.
          </p>
        </div>
        <button
          className="btn btn-ghost text-xs"
          type="button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2 text-sm">Your dogs</h2>
          {dogs.length === 0 ? (
            <p className="text-xs text-slate-600">
              Your walker can add your dogs or this will be available in a later update.
            </p>
          ) : (
            <ul className="divide-y">
              {dogs.map(d => (
                <li key={d.id} className="py-1 text-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-slate-500">
                    {d.breed || 'Dog'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-2 text-sm">Upcoming jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-600">
              No jobs scheduled yet. Use &quot;Request booking&quot; or contact your walker.
            </p>
          ) : (
            <ul className="divide-y">
              {jobs
                .slice()
                .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
                .map(j => (
                  <li key={j.id} className="py-1 text-xs">
                    <div>
                      <div className="font-medium">
                        {j.serviceId || 'Service'} · {j.status}
                      </div>
                      <div className="text-slate-500">
                        {j.start
                          ? new Date(j.start).toLocaleString()
                          : 'No start time'}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2 text-sm">Request a booking</h2>
        <p className="text-xs text-slate-600 mb-2">
          In Patch 2 we&apos;ll add a full self-service booking flow. For now, your
          walker can create jobs for you from their dashboard and they will
          appear here.
        </p>
      </div>
    </div>
  );
}
