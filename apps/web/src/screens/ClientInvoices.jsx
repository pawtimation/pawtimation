import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

export function ClientInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      const { clientId } = JSON.parse(raw);

      const [inv, c] = await Promise.all([
        repo.listInvoicesByClient(clientId),
        repo.getClient(clientId)
      ]);

      if (!c) {
        localStorage.removeItem('pt_client');
        navigate('/client/login');
        return;
      }

      setInvoices(inv);
      setClient(c);
    })();
  }, [navigate]);

  if (!client) {
    return <div className="text-sm text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Your invoices</h1>

      <div className="card">
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-600">No invoices yet.</p>
        ) : (
          <ul className="divide-y">
            {invoices
              .slice()
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
              .map(inv => {
                const amount = (inv.amountCents / 100).toFixed(2);
                return (
                  <li key={inv.id} className="py-3 text-sm">
                    <div className="font-medium">£{amount}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(inv.createdAt).toLocaleString()} — {inv.status}
                    </div>
                    {inv.status === 'UNPAID' && (
                      <a
                        href={inv.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-primary mt-2"
                      >
                        Pay now
                      </a>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      <Link className="btn btn-ghost btn-sm" to="/client/dashboard">
        Back
      </Link>
    </div>
  );
}
