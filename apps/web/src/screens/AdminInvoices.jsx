import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';

export function AdminInvoices({ business }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [inv, c] = await Promise.all([
        repo.listInvoicesByBusiness(business.id),
        repo.listClientsByBusiness(business.id)
      ]);
      setInvoices(inv);
      setClients(c);
    })();
  }, [business]);

  const clientById = Object.fromEntries(clients.map(c => [c.id, c]));

  function whatsappLink(invoice) {
    const client = clientById[invoice.clientId];
    const amount = (invoice.amountCents / 100).toFixed(2);
    const text = encodeURIComponent(
      `Hi ${client?.name || ''}, your invoice is ready.\nAmount: £${amount}\nPay here: ${invoice.paymentUrl}`
    );
    return `https://wa.me/?text=${text}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Invoices</h1>

      <div className="card">
        {invoices.length === 0 ? (
          <p className="text-sm text-slate-600">No invoices yet.</p>
        ) : (
          <ul className="divide-y">
            {invoices
              .slice()
              .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
              .map(inv => {
                const client = clientById[inv.clientId];
                const amount = (inv.amountCents / 100).toFixed(2);
                return (
                  <li key={inv.id} className="py-3 text-sm">
                    <div className="font-medium">
                      £{amount} — {client?.name || 'Client'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(inv.createdAt).toLocaleString()} — {inv.status}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <a
                        href={inv.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-primary"
                      >
                        View payment link
                      </a>

                      <a
                        href={whatsappLink(inv)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-ghost"
                      >
                        Send via WhatsApp
                      </a>
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
