import React, { useEffect, useState } from 'react';
import { api, adminApi } from '../../lib/auth';

export function InvoicesTab({ business }) {
  const [invoices, setInvoices] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const previewUrlRef = React.useRef(null);

  useEffect(() => {
    loadData();
  }, [business]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  async function loadData() {
    if (!business) return;
    
    try {
      const [invoicesRes, itemsRes] = await Promise.all([
        adminApi('/invoices/list'),
        adminApi('/invoice-items/pending')
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
      const res = await adminApi(`/invoices/${invoiceId}/pdf`);
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

  async function markAsSent(invoiceId) {
    try {
      const res = await adminApi(`/invoices/${invoiceId}/mark-sent`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        throw new Error('Failed to mark invoice as sent');
      }
      
      alert('Invoice marked as sent to client!');
      loadData();
    } catch (err) {
      console.error('Failed to mark as sent', err);
      alert('Failed to mark invoice as sent. Please try again.');
    }
  }

  async function markAsPaid(invoiceId, method) {
    try {
      const res = await adminApi(`/invoices/${invoiceId}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: method })
      });
      
      if (!res.ok) {
        throw new Error('Failed to mark invoice as paid');
      }
      
      alert('Invoice marked as paid!');
      setMarkingPaid(null);
      loadData();
    } catch (err) {
      console.error('Failed to mark as paid', err);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  }

  async function previewPDF(invoiceId) {
    try {
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      
      const res = await adminApi(`/invoices/${invoiceId}/pdf`);
      if (!res.ok) {
        throw new Error('Failed to load PDF');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewInvoice(url);
    } catch (err) {
      console.error('Failed to preview PDF', err);
      alert('Failed to preview PDF. Please try again.');
    }
  }

  function closePreview() {
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewInvoice(null);
  }

  function openMarkPaidModal(invoiceId) {
    setMarkingPaid(invoiceId);
    setPaymentMethod('cash');
  }

  function closeMarkPaidModal() {
    setMarkingPaid(null);
    setPaymentMethod('cash');
  }

  async function generateInvoice(clientId, itemIds) {
    try {
      const res = await adminApi('/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ clientId, itemIds })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate invoice');
      }
      
      alert('Invoice generated successfully!');
      loadData();
    } catch (err) {
      console.error('Failed to generate invoice', err);
      alert(err.message || 'Failed to generate invoice. Please try again.');
    }
  }

  function generateSelectedInvoice() {
    if (!selectedClient) return;
    
    const itemIds = selectedClient.items.map(item => item.id);
    generateInvoice(selectedClient.clientId, itemIds);
    setSelectedClient(null);
  }

  return (
    <div className="space-y-6">
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
                      onClick={() => setSelectedClient(client)}
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
                const isPaid = inv.status === 'paid';
                return (
                  <li key={inv.invoiceId} className="py-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">
                        £{amount} — {inv.clientName || 'Client'}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Created: {new Date(inv.createdAt).toLocaleString()}</div>
                      {inv.sentToClient && (
                        <div className="text-green-600">✓ Sent to client: {new Date(inv.sentToClient).toLocaleDateString()}</div>
                      )}
                      {inv.paidAt && (
                        <div className="text-green-600">✓ Paid: {new Date(inv.paidAt).toLocaleDateString()} ({inv.paymentMethod || 'cash'})</div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => previewPDF(inv.invoiceId)}
                        className="btn btn-xs btn-secondary"
                      >
                        Preview PDF
                      </button>
                      
                      <button
                        onClick={() => downloadPDF(inv.invoiceId, inv.invoiceId.replace('inv_', '').toUpperCase())}
                        className="btn btn-xs btn-primary"
                      >
                        Download PDF
                      </button>

                      {!inv.sentToClient && (
                        <button
                          onClick={() => markAsSent(inv.invoiceId)}
                          className="btn btn-xs btn-ghost text-blue-600"
                        >
                          Mark as Sent
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          onClick={() => openMarkPaidModal(inv.invoiceId)}
                          className="btn btn-xs btn-ghost text-green-600"
                        >
                          Mark as Paid
                        </button>
                      )}

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

      {/* Generate Invoice Confirmation Modal */}
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

      {/* PDF Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button
                onClick={closePreview}
                className="btn btn-ghost btn-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewInvoice}
                className="w-full h-full border-0"
                title="Invoice Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {markingPaid && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Mark Invoice as Paid</h3>
            <p className="text-sm text-slate-600 mb-4">
              Confirm payment received and select payment method:
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeMarkPaidModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => markAsPaid(markingPaid, paymentMethod)}
                className="btn btn-primary"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
