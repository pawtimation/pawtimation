import { useEffect, useState } from "react";
import { api, adminApi } from '../../../lib/auth';
import { Link } from "react-router-dom";
import dayjs from "dayjs";

export function AdminMobileInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi("/invoices/list");
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } else {
        setError("Failed to load invoices");
        setInvoices([]);
      }
    } catch (err) {
      console.error("Invoice load error", err);
      setError("An error occurred while loading invoices");
      setInvoices([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function formatStatus(s) {
    if (s === "paid") return "Paid";
    if (s === "sent") return "Sent";
    if (s === "overdue") return "Overdue";
    return "Draft";
  }

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-semibold">Invoices</h1>

      {loading && (
        <p className="text-sm text-slate-600">Loading invoices…</p>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <p className="text-sm text-slate-600">No invoices yet.</p>
      )}

      <div className="space-y-3">
        {invoices.map(inv => (
          <Link
            key={inv.invoiceId}
            to={`/admin/m/invoices/${inv.invoiceId}`}
          >
            <div className="p-4 border rounded-md bg-white">
              <div className="flex justify-between">
                <p className="font-medium">{inv.clientName}</p>
                <p className="text-sm">
                  £{(inv.total / 100).toFixed(2)}
                </p>
              </div>

              <p className="text-sm text-slate-600">
                Due {dayjs(inv.dueDate).format("D MMM")}
              </p>

              <p
                className={`text-xs mt-1 ${
                  inv.status === "paid"
                    ? "text-green-700"
                    : inv.status === "overdue"
                    ? "text-red-700"
                    : "text-slate-600"
                }`}
              >
                {formatStatus(inv.status)}
              </p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
