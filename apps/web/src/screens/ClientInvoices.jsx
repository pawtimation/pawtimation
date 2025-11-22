import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientApi } from '../lib/auth';
import { MobilePageHeader } from '../components/mobile/MobilePageHeader';
import { MobileCard } from '../components/mobile/MobileCard';
import dayjs from 'dayjs';

export function ClientInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      const { clientId } = JSON.parse(raw);
      setClientId(clientId);

      const response = await clientApi(`/invoices/client/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    const s = status?.toUpperCase();
    if (s === 'PAID') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'UNPAID') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  function getStatusText(status) {
    const s = status?.toUpperCase();
    if (s === 'PAID') return 'Paid';
    if (s === 'UNPAID') return 'Unpaid';
    return status || 'Draft';
  }

  async function handlePreviewPDF(invoiceId) {
    try {
      const res = await clientApi(`/invoices/${invoiceId}/client-pdf`);
      if (!res.ok) {
        throw new Error('Failed to load PDF');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Failed to preview PDF:', err);
      alert('Failed to preview PDF. Please try again.');
    }
  }

  async function handleDownloadPDF(invoiceId, invoiceNumber) {
    try {
      const res = await clientApi(`/invoices/${invoiceId}/client-pdf`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MobilePageHeader title="Invoices" onBack={() => navigate('/client/dashboard')} />
        <div className="p-4 text-center text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <MobilePageHeader title="Invoices" onBack={() => navigate('/client/dashboard')} />

      <div className="p-4 space-y-3">
        {invoices.length === 0 ? (
          <MobileCard>
            <p className="text-center text-slate-600 text-sm">No invoices yet.</p>
          </MobileCard>
        ) : (
          invoices.map(invoice => {
            const amount = (invoice.amountCents / 100).toFixed(2);
            return (
              <MobileCard key={invoice.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold text-slate-900">£{amount}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Invoice #{invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        {dayjs(invoice.createdAt).format('D MMM YYYY, h:mm A')}
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>

                  {invoice.items && invoice.items.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Items</p>
                      {invoice.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-700">
                          {item.description}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => handlePreviewPDF(invoice.id)}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
                    >
                      Preview PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors text-sm"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </MobileCard>
            );
          })
        )}
      </div>
    </div>
  );
}
