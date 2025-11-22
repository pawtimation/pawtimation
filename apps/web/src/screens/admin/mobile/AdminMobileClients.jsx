import { useEffect, useState } from "react";
import { api, adminApi } from '../../../lib/auth';
import { Link } from "react-router-dom";

export function AdminMobileClients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi("/clients/list");
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to load clients");
        setClients([]);
      }
    } catch (err) {
      console.error("Failed loading clients", err);
      setClients([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">

      <h1 className="text-xl font-semibold">Clients</h1>

      {loading && (
        <p className="text-sm text-slate-600">Loading clients…</p>
      )}

      {!loading && clients.length === 0 && (
        <p className="text-sm text-slate-600">No clients yet.</p>
      )}

      <div className="space-y-3">
        {clients.map(client => (
          <Link
            key={client.clientId}
            to={`/admin/m/clients/${client.clientId}`}
          >
            <div className="p-4 border rounded-md bg-white">
              <p className="font-medium">{client.name}</p>
              <p className="text-sm text-slate-600">
                {client.email}
              </p>
              <p className="text-sm text-slate-600">
                {client.phone || "No phone"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
