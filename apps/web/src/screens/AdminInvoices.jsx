import React, { useEffect, useState } from 'react';
import { api } from '../lib/auth';

export function AdminInvoices({ business }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    (async () => {
      if (!business) return;
      
      try {
        const res = await api('/invoices/list');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } catch (err) {
        console.error('Failed to load invoices', err);
      }
    })();
  }, [business]);

  function whatsappLink(invoice) {
    const amount = (invoice.total / 100).toFixed(2);
    const text = encodeURIComponent(
      `Hi ${invoice.clientName || ''}, your invoice is ready.\nAmount: £${amount}\nPay here: https://pay.pawtimation.com/${invoice.invoiceId}`
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
                const amount = (inv.total / 100).toFixed(2);
                return (
                  <li key={inv.invoiceId} className="py-3 text-sm">
                    <div className="font-medium">
                      £{amount} — {inv.clientName || 'Client'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(inv.createdAt).toLocaleString()} — {inv.status}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <a
                        href={`https://pay.pawtimation.com/${inv.invoiceId}`}
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
