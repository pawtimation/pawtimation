import { useEffect, useState } from "react";
import { adminApi } from '../../../lib/auth';
import { Link } from "react-router-dom";

export function AdminMobileClients() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

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

  function generateRandomEmail() {
    const randomId = Math.random().toString(36).substring(2, 9);
    return `test.client.${randomId}@pawtimation.test`;
  }

  async function handleAddClient(e) {
    e.preventDefault();
    try {
      const res = await adminApi('/clients/create', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone
        }
      });

      if (res.ok) {
        setShowAddModal(false);
        setForm({ name: '', email: '', phone: '' });
        load();
      } else {
        alert('Failed to create client');
      }
    } catch (err) {
      console.error('Failed to create client:', err);
      alert('Failed to create client');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add Client
        </button>
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

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Client name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, email: generateRandomEmail() }))}
                    className="text-xs text-teal-600 hover:text-teal-700 underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                <p className="text-xs text-slate-500 mt-1">Optional - use random for testing</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                  onClick={() => {
                    setShowAddModal(false);
                    setForm({ name: '', email: '', phone: '' });
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
