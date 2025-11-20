import React, { useEffect, useState } from 'react';
import { api } from '../lib/auth';

export function AdminInvoices({ business }) {
  const [invoices, setInvoices] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadData();
  }, [business]);

  async function loadData() {
    if (!business) return;
    
    try {
      const [invoicesRes, itemsRes] = await Promise.all([
        api('/invoices/list'),
        api('/invoice-items/pending')
      ]);
      
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data);
      }
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setPendingItems(data);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    }
  }

  function whatsappLink(invoice) {
    const amount = (invoice.total / 100).toFixed(2);
    const text = encodeURIComponent(
      `Hi ${invoice.clientName || ''}, your invoice is ready.\nAmount: £${amount}\nPay here: https://pay.pawtimation.com/${invoice.invoiceId}`
    );
    return `https://wa.me/?text=${text}`;
  }

  async function downloadPDF(invoiceId, invoiceNumber) {
    try {
      const res = await api(`/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Failed to download PDF. Please try again.');
    }
  }

  async function generateInvoice(clientId, itemIds) {
    try {
      const res = await api('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ clientId, itemIds })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate invoice');
      }
      
      alert('Invoice generated successfully!');
      loadData(); // Reload data to refresh pending items and invoices
    } catch (err) {
      console.error('Failed to generate invoice', err);
      alert(err.message || 'Failed to generate invoice. Please try again.');
    }
  }

  function selectClient(client) {
    setSelectedClient(client);
  }

  function generateSelectedInvoice() {
    if (!selectedClient) return;
    
    const itemIds = selectedClient.items.map(item => item.id);
    generateInvoice(selectedClient.clientId, itemIds);
    setSelectedClient(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Invoices</h1>

      {/* Pending Invoice Items */}
      {pendingItems.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Pending Invoice Items</h2>
          <p className="text-sm text-slate-600 mb-4">
            These completed jobs are ready to be invoiced. Click "Generate Invoice" to create an invoice for a client.
          </p>
          
          <div className="space-y-4">
            {pendingItems.map(client => {
              const total = client.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
              const totalAmount = (total / 100).toFixed(2);
              
              return (
                <div key={client.clientId} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-sm text-slate-600">{client.items.length} item{client.items.length > 1 ? 's' : ''}</div>
                    </div>
                    <button
                      onClick={() => selectClient(client)}
                      className="btn btn-sm btn-primary"
                    >
                      Generate Invoice (£{totalAmount})
                    </button>
                  </div>
                  
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th className="pb-1">Description</th>
                        <th className="pb-1 text-right">Qty</th>
                        <th className="pb-1 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.items.map(item => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-1">{item.description}</td>
                          <td className="py-1 text-right">{item.quantity}</td>
                          <td className="py-1 text-right">£{((item.priceCents * item.quantity) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Invoices */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Generated Invoices</h2>
        
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
                      <button
                        onClick={() => downloadPDF(inv.invoiceId, inv.invoiceId.replace('inv_', '').toUpperCase())}
                        className="btn btn-xs btn-primary"
                      >
                        Download PDF
                      </button>

                      <a
                        href={`https://pay.pawtimation.com/${inv.invoiceId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-xs btn-secondary"
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

      {/* Confirmation Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Generate Invoice</h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate invoice for <strong>{selectedClient.clientName}</strong> with {selectedClient.items.length} item{selectedClient.items.length > 1 ? 's' : ''}?
            </p>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={generateSelectedInvoice}
                className="btn btn-primary"
              >
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
