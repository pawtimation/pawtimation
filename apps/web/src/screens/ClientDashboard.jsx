import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as clientsApi from '../lib/clientsApi';
import * as businessApi from '../lib/businessApi';
import * as jobApi from '../lib/jobApi';
import * as dogsApi from '../lib/dogsApi';

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
        clientsApi.getClient(clientId),
        businessApi.getBusiness(businessId),
        jobApi.listJobsByBusiness(businessId),
        dogsApi.listDogsByBusiness(businessId)
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

  if (!client || !business) {
    return (
      <div className="text-sm text-slate-600">
        Loading your account…
      </div>
    );
  }

  function statusLabel(status) {
    switch (status) {
      case 'PENDING':
        return 'Requested (awaiting approval)';
      case 'BOOKED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status || 'Pending';
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          Hi {client.firstName || client.name || client.email}
        </h1>
        <p className="text-xs text-slate-500">
          Welcome to your client dashboard
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Link className="btn btn-ghost btn-sm" to="/client/invoices">
          View invoices
        </Link>
        <Link className="btn btn-ghost btn-sm" to="/client/flexi">
          Flexi week booking
        </Link>
        <Link className="btn btn-primary btn-sm" to="/client/book">
          Request booking
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold mb-2 text-sm">Your dogs</h2>
          {dogs.length === 0 ? (
            <p className="text-xs text-slate-600">
              Your walker can add your dogs, or this can be enabled for you in a
              later update.
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
          <h2 className="font-semibold mb-2 text-sm">Your bookings</h2>
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-600">
              No bookings yet. Use &quot;Request booking&quot; to ask your walker for
              a new service.
            </p>
          ) : (
            <ul className="divide-y">
              {jobs
                .slice()
                .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
                .map(j => (
                  <li key={j.id} className="py-1 text-xs">
                    <div className="font-medium">
                      {j.serviceId || 'Service'}
                    </div>
                    <div className="text-slate-500">
                      {j.start
                        ? new Date(j.start).toLocaleString()
                        : 'No start time'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {statusLabel(j.status)}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
