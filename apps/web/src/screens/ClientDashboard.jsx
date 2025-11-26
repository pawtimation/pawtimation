import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as clientsApi from '../lib/clientsApi';
import * as businessApi from '../lib/businessApi';
import * as jobApi from '../lib/jobApi';
import * as dogsApi from '../lib/dogsApi';
import { clientApi } from '../lib/auth';

export function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [business, setBusiness] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      const { clientId, businessId} = JSON.parse(raw);

      try {
        const [c, b] = await Promise.all([
          clientsApi.getClient(clientId),
          businessApi.getBusiness(businessId)
        ]);

        if (!c || !b) {
          localStorage.removeItem('pt_client');
          navigate('/client/login');
          return;
        }

        setClient(c);
        setBusiness(b);

        try {
          const allJobs = await jobApi.listJobsByBusiness(businessId);
          setJobs(allJobs.filter(j => j.clientId === c.id));
        } catch (err) {
          console.error('Failed to load jobs:', err);
          setJobs([]);
        }

        try {
          const allDogs = await dogsApi.listDogsByBusiness(businessId);
          setDogs(allDogs.filter(d => d.clientId === c.id));
        } catch (err) {
          console.error('Failed to load dogs:', err);
          setDogs([]);
        }

        try {
          const invoicesRes = await clientApi(`/invoices/client/${clientId}`);
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            setInvoices(invoicesData.invoices || []);
          } else {
            setInvoices([]);
          }
        } catch (err) {
          console.error('Failed to load invoices:', err);
          setInvoices([]);
        }
      } catch (err) {
        console.error('Failed to load client/business data:', err);
        localStorage.removeItem('pt_client');
        navigate('/client/login');
      }
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h2 className="font-semibold mb-2 text-sm">Your dogs</h2>
          {dogs.length === 0 ? (
            <p className="text-xs text-slate-600">
              Your pet-care team can add your dogs, or this can be enabled for you in a
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
              No bookings yet. Use &quot;Request booking&quot; to ask your pet-care team for
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

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Your invoices</h2>
            <Link
              to="/client/invoices"
              className="text-xs text-teal-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-xs text-slate-600">
              No invoices yet.
            </p>
          ) : (
            <ul className="divide-y">
              {invoices
                .slice()
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                .slice(0, 5)
                .map(inv => (
                  <li key={inv.id} className="py-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          £{(((inv.totalAmountCents ?? inv.totalCents) || 0) / 100).toFixed(2)}
                        </div>
                        <div className="text-slate-500">
                          {inv.dueDate
                            ? new Date(inv.dueDate).toLocaleDateString()
                            : 'No due date'}
                        </div>
                      </div>
                      <div className={`text-[11px] font-medium ${
                        inv.status === 'PAID' ? 'text-emerald-600' :
                        inv.status === 'OVERDUE' ? 'text-rose-600' :
                        'text-amber-600'
                      }`}>
                        {inv.status || 'Pending'}
                      </div>
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
