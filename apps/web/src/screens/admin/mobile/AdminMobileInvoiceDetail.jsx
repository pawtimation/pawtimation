import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";
import { useParams, Link } from "react-router-dom";
import dayjs from "dayjs";

export function AdminMobileInvoiceDetail() {
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoice, setInvoice] = useState(null);

  async function load() {
    setLoading(true);
    
    try {
      const res = await api(`/invoices/${invoiceId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Invoice not found");
        } else if (res.status === 403) {
          setError("You don't have permission to view this invoice");
        } else {
          setError("Failed to load invoice");
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      
      setInvoice(data);
      setError(null);
    } catch (err) {
      console.error("Failed loading invoice", err);
      setError("An error occurred while loading the invoice");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [invoiceId]);

  async function markPaid() {
    try {
      const res = await api(`/invoices/${invoiceId}/pay`, {
        method: "POST",
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Could not mark as paid: ${errData.error || "Unknown error"}`);
        return;
      }
      
      load();
    } catch (err) {
      console.error("Payment error", err);
      alert("Could not mark as paid. Please try again.");
    }
  }

  async function resend() {
    try {
      const res = await api(`/invoices/${invoiceId}/resend`, {
        method: "POST",
        body: JSON.stringify({})
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Could not resend invoice: ${errData.error || "Unknown error"}`);
        return;
      }
      
      alert("Invoice resent successfully.");
    } catch (err) {
      console.error("Resend error", err);
      alert("Could not resend invoice. Please try again.");
    }
  }

  // Initial loading (no invoice data yet)
  if (loading && !invoice) {
    return <p className="text-sm text-slate-600">Loading invoice…</p>;
  }

  // Error with no invoice data (initial load failed)
  if (error && !invoice) {
    return (
      <div className="space-y-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={load}
          className="w-full bg-teal-700 text-white p-3 rounded"
        >
          Retry
        </button>
        <Link
          to="/admin/m/invoices"
          className="block text-center w-full border border-slate-300 text-slate-700 p-3 rounded"
        >
          Back to Invoices
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-sm text-slate-600">Invoice not found.</p>;
  }

  return (
    <div className="space-y-6">

      {/* Error banner (shown when reload fails but we have cached invoice data) */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm font-medium">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reload indicator (shown when reloading with cached data) */}
      {loading && invoice && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-teal-800 text-sm">Reloading invoice data…</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">
          Invoice #{invoice.invoiceNumber}
        </h1>
        <p className="text-sm text-slate-600">
          {invoice.clientName}
        </p>
      </div>

      {/* Client */}
      <div className="p-4 border rounded-md bg-white space-y-2">
        <p className="font-medium">{invoice.clientName}</p>
        {invoice.clientPhone && (
          <a className="text-sm underline text-teal-700 block" href={`tel:${invoice.clientPhone}`}>
            {invoice.clientPhone}
          </a>
        )}
        {invoice.clientEmail && (
          <a className="text-sm underline text-teal-700 block" href={`mailto:${invoice.clientEmail}`}>
            {invoice.clientEmail}
          </a>
        )}
      </div>

      {/* Items */}
      <div className="p-4 border rounded-md bg-white">
        <p className="font-medium mb-2">Items</p>

        <div className="space-y-2">
          {invoice.items && invoice.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <p className="text-sm">{item.description}</p>
              <p className="text-sm">
                £{(item.amount / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <hr className="my-3" />

        <div className="flex justify-between font-medium">
          <p>Total</p>
          <p>£{(invoice.total / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border rounded-md bg-white text-sm text-slate-700">
        <p>Status: 
          <span className="font-medium ml-1 capitalize">{invoice.status}</span>
        </p>
        <p>Due: {dayjs(invoice.dueDate).format("D MMM YYYY")}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">

        {/* Mark Paid */}
        {invoice.status !== "paid" && (
          <button
            onClick={markPaid}
            className="w-full bg-teal-700 text-white p-3 rounded"
          >
            Mark as Paid
          </button>
        )}

        {/* Resend */}
        <button
          onClick={resend}
          className="w-full border border-teal-700 text-teal-700 p-3 rounded"
        >
          Resend Invoice
        </button>

        <Link
          to="/admin/m/invoices"
          className="block text-center w-full border border-slate-300 text-slate-700 p-3 rounded"
        >
          Back to Invoices
        </Link>

      </div>

    </div>
  );
}
