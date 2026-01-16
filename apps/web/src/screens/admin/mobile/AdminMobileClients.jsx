import { useEffect, useState } from "react";
import { adminApi } from '../../../lib/auth';
import { Link } from "react-router-dom";
import { InviteClientModal } from '../../../components/InviteClientModal';
import { AddClientModal } from '../../../components/AddClientModal';

export function AdminMobileClients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm"
          >
            Add
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 font-medium text-sm"
          >
            Invite
          </button>
        </div>
      </div>

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

      <InviteClientModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={() => load()}
      />
    </div>
  );
}
