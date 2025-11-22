import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function InvoicesTab({ business }) {
  const [invoices, setInvoices] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [generatingPaymentLink, setGeneratingPaymentLink] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [paymentLinkError, setPaymentLinkError] = useState(null);
  const [paymentLinkSuccess, setPaymentLinkSuccess] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const previewUrlRef = React.useRef(null);

  function showActionMessage(message, type = 'success') {
    setActionMessage({ message, type });
    setTimeout(() => setActionMessage(null), type === 'error' ? 8000 : 5000);
  }

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
      const [invoicesRes, itemsRes, summaryRes] = await Promise.all([
        adminApi('/invoices/list'),
        adminApi('/invoice-items/pending'),
        adminApi('/invoices/summary')
      ]);
      
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data);
      }
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setPendingItems(data);
      }
      
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    }
  }

  function whatsappLink(invoice) {
    const amount = (invoice.total / 100).toFixed(2);
    const paymentUrl = invoice.stripePaymentUrl || `https://pay.pawtimation.com/${invoice.invoiceId}`;
    const text = encodeURIComponent(
      `Hi ${invoice.clientName || ''}, your invoice is ready.\nAmount: £${amount}\nPay here: ${paymentUrl}`
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
      showActionMessage('Failed to download PDF. Please try again.', 'error');
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
      
      showActionMessage('Invoice marked as sent to client!');
      loadData();
    } catch (err) {
      console.error('Failed to mark as sent', err);
      showActionMessage('Failed to mark invoice as sent. Please try again.', 'error');
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
      
      showActionMessage('Invoice marked as paid!');
      setMarkingPaid(null);
      loadData();
    } catch (err) {
      console.error('Failed to mark as paid', err);
      showActionMessage('Failed to mark invoice as paid. Please try again.', 'error');
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
      showActionMessage('Failed to preview PDF. Please try again.', 'error');
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

  async function generatePaymentLink(invoiceId) {
    try {
      setGeneratingPaymentLink(invoiceId);
      setPaymentLinkError(null);
      setPaymentLinkSuccess(null);
      
      const res = await adminApi(`/invoices/${invoiceId}/payment-link`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate payment link');
      }
      
      const data = await res.json();
      
      setInvoices(prev => prev.map(inv => 
        inv.invoiceId === invoiceId 
          ? { ...inv, stripePaymentUrl: data.url }
          : inv
      ));
      
      setPaymentLinkSuccess(invoiceId);
      setTimeout(() => setPaymentLinkSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to generate payment link', err);
      setPaymentLinkError({ invoiceId, message: err.message || 'Failed to generate payment link. Make sure Stripe is connected in Settings > Online payments.' });
      setTimeout(() => setPaymentLinkError(null), 8000);
    } finally {
      setGeneratingPaymentLink(null);
    }
  }

  function copyPaymentLink(url, invoiceId, e) {
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(invoiceId);
      setTimeout(() => setCopiedLink(null), 3000);
    }).catch(err => {
      console.error('Failed to copy', err);
      setPaymentLinkError({ invoiceId, message: 'Failed to copy link. Please try again.' });
      setTimeout(() => setPaymentLinkError(null), 5000);
    });
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
      
      showActionMessage('Invoice generated successfully!');
      loadData();
    } catch (err) {
      console.error('Failed to generate invoice', err);
      showActionMessage(err.message || 'Failed to generate invoice. Please try again.', 'error');
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
      {/* Action Message Banner */}
      {actionMessage && (
        <div className={`p-3 rounded-lg border ${
          actionMessage.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-start gap-2">
            {actionMessage.type === 'error' ? (
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm">{actionMessage.message}</p>
          </div>
        </div>
      )}

      {/* Invoice Summary & Analytics */}
      {summary && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Total Invoices</div>
              <div className="text-2xl font-semibold">{summary.totalInvoices}</div>
            </div>
            
            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Paid</div>
              <div className="text-2xl font-semibold text-green-600">
                £{(summary.paidAmountCents / 100).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{summary.paidCount} invoice{summary.paidCount !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Unpaid</div>
              <div className="text-2xl font-semibold text-orange-600">
                £{(summary.unpaidAmountCents / 100).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{summary.unpaidCount} invoice{summary.unpaidCount !== 1 ? 's' : ''}</div>
            </div>
            
            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Overdue</div>
              <div className="text-2xl font-semibold text-red-600">
                £{(summary.overdueAmountCents / 100).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{summary.overdueCount} invoice{summary.overdueCount !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown Pie Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Invoice Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: summary.paidCount, color: '#10b981' },
                      { name: 'Unpaid', value: summary.unpaidCount - summary.overdueCount, color: '#f59e0b' },
                      { name: 'Overdue', value: summary.overdueCount, color: '#ef4444' }
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Paid', value: summary.paidCount, color: '#10b981' },
                      { name: 'Unpaid', value: summary.unpaidCount - summary.overdueCount, color: '#f59e0b' },
                      { name: 'Overdue', value: summary.overdueCount, color: '#ef4444' }
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Amount Breakdown Bar Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Invoice Amounts by Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { name: 'Paid', amount: summary.paidAmountCents / 100 },
                    { name: 'Unpaid', amount: (summary.unpaidAmountCents - summary.overdueAmountCents) / 100 },
                    { name: 'Overdue', amount: summary.overdueAmountCents / 100 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `£${value.toFixed(2)}`} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Due Invoices Alert */}
          {summary.upcomingDueInvoices && summary.upcomingDueInvoices.length > 0 && (
            <div className="card bg-amber-50 border-l-4 border-amber-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">
                    {summary.upcomingDueInvoices.length} invoice{summary.upcomingDueInvoices.length !== 1 ? 's' : ''} due within 7 days
                  </h3>
                  <div className="space-y-1.5">
                    {summary.upcomingDueInvoices.slice(0, 3).map(inv => (
                      <div key={inv.invoiceId} className="text-xs text-amber-800 font-medium">
                        {inv.clientName}: £{(inv.total / 100).toFixed(2)} due {new Date(inv.dueDate).toLocaleDateString()}
                      </div>
                    ))}
                    {summary.upcomingDueInvoices.length > 3 && (
                      <div className="text-xs text-amber-700 font-medium">
                        ...and {summary.upcomingDueInvoices.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                
                // Calculate due status
                let dueStatus = null;
                if (!isPaid && inv.dueDate) {
                  const now = new Date();
                  const dueDate = new Date(inv.dueDate);
                  const daysDiff = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
                  
                  if (inv.isOverdue) {
                    dueStatus = { label: `OVERDUE · ${inv.overdueDays}D`, color: 'bg-red-50 text-red-700 border border-red-200 font-semibold' };
                  } else if (daysDiff === 0) {
                    dueStatus = { label: 'DUE TODAY', color: 'bg-orange-50 text-orange-700 border border-orange-200 font-semibold' };
                  } else if (daysDiff > 0 && daysDiff <= 7) {
                    dueStatus = { label: `DUE IN ${daysDiff}D`, color: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold' };
                  }
                }
                
                return (
                  <li key={inv.invoiceId} className="py-3 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">
                        £{amount} — {inv.clientName || 'Client'}
                      </div>
                      <div className="flex gap-2">
                        {dueStatus && (
                          <span className={`text-[10px] px-2.5 py-1 rounded-md tracking-wide ${dueStatus.color}`}>
                            {dueStatus.label}
                          </span>
                        )}
                        <span className={`text-[10px] px-2.5 py-1 rounded-md tracking-wide font-semibold ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <div>Created: {new Date(inv.createdAt).toLocaleString()}</div>
                      {inv.sentToClient && (
                        <div className="text-emerald-600 font-medium">Sent to client: {new Date(inv.sentToClient).toLocaleDateString()}</div>
                      )}
                      {inv.paidAt && (
                        <div className="text-emerald-600 font-medium">Paid: {new Date(inv.paidAt).toLocaleDateString()} ({inv.paymentMethod || 'cash'})</div>
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

                      {!isPaid && (
                        <button
                          onClick={() => setExpandedInvoice(expandedInvoice === inv.invoiceId ? null : inv.invoiceId)}
                          className="btn btn-xs btn-ghost text-purple-600"
                        >
                          {expandedInvoice === inv.invoiceId ? 'Hide' : 'Show'} Payment Link
                        </button>
                      )}
                    </div>

                    {/* Payment Link Section */}
                    {!isPaid && expandedInvoice === inv.invoiceId && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-100 rounded-lg space-y-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-xs text-purple-800">
                            <p className="font-medium mb-1">Online Payment Link</p>
                            <p>Share this link with your client to accept card payments through Stripe. Standard Stripe processing fees apply (no platform fees).</p>
                          </div>
                        </div>

                        {paymentLinkSuccess === inv.invoiceId && (
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                            Payment link generated successfully!
                          </div>
                        )}

                        {paymentLinkError?.invoiceId === inv.invoiceId && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            {paymentLinkError.message}
                          </div>
                        )}

                        {inv.stripePaymentUrl ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={inv.stripePaymentUrl}
                                readOnly
                                className="input text-xs flex-1 bg-white"
                                onClick={(e) => e.target.select()}
                              />
                              <button
                                onClick={(e) => copyPaymentLink(inv.stripePaymentUrl, inv.invoiceId, e)}
                                disabled={copiedLink === inv.invoiceId}
                                className={`btn btn-xs ${copiedLink === inv.invoiceId ? 'btn-secondary' : 'btn-primary'}`}
                              >
                                {copiedLink === inv.invoiceId ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <a
                              href={inv.stripePaymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1"
                            >
                              Open payment page
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => generatePaymentLink(inv.invoiceId)}
                            disabled={generatingPaymentLink === inv.invoiceId}
                            className="btn btn-xs btn-primary w-full"
                          >
                            {generatingPaymentLink === inv.invoiceId ? 'Generating...' : 'Generate Payment Link'}
                          </button>
                        )}
                      </div>
                    )}
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
