import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/auth';

export function AdminClients({ business }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadClients();
  }, [business]);

  async function loadClients() {
    try {
      if (!business) {
        setLoading(false);
        return;
      }

      const res = await api('/clients/list');
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load clients', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(c => {
      if (statusFilter === 'complete' && !c.profileComplete) return false;
      if (statusFilter === 'incomplete' && c.profileComplete) return false;

      if (!q) return true;

      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [clients, query, statusFilter]);

  function openClient(clientId) {
    navigate(`/admin/clients/${clientId}`);
  }

  function inviteNewClient() {
    navigate('/admin/clients/new');
  }

  async function addTestClient() {
    try {
      if (!business) return alert('No business found.');

      const timestamp = Date.now();
      
      // Create the client
      const clientRes = await api('/clients/create', {
        method: 'POST',
        body: JSON.stringify({
          name: 'John Testerton',
          email: `test${timestamp}@example.com`,
          phone: '07123 456789',
          address: '123 Testing Street, Testville',
          profileComplete: true,
          accessNotes: 'Key under mat.',
          emergencyName: 'Sarah Testerton',
          emergencyPhone: '07000 000000',
          vetDetails: 'Test Vet Clinic',
          notes: 'Demo client for UI testing.'
        })
      });

      if (!clientRes.ok) {
        throw new Error('Failed to create client');
      }

      const { client: newClient } = await clientRes.json();

      // Create the dog for this client
      const dogRes = await api('/dogs/create', {
        method: 'POST',
        body: JSON.stringify({
          clientId: newClient.id,
          name: 'Buddy',
          breed: 'Labrador',
          age: '4',
          behaviourNotes: 'Friendly and energetic.',
          medicalNotes: 'None.'
        })
      });

      if (!dogRes.ok) {
        throw new Error('Failed to create dog');
      }

      // Reload the clients list to show the new client
      await loadClients();

      alert('Test client "John Testerton" and dog "Buddy" added successfully!');
    } catch (e) {
      console.error('Failed to add test client', e);
      alert('Failed to add test client.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-600">
            View and manage all clients linked to your business.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={inviteNewClient}
            className="btn btn-primary text-sm"
          >
            Invite new client
          </button>

          <button
            type="button"
            onClick={addTestClient}
            className="btn btn-secondary text-sm"
          >
            Add test client
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <input
            className="border rounded px-3 py-2 text-sm w-full md:w-72"
            placeholder="Search by name, email or address"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 text-xs">
          <FilterChip
            label="All"
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <FilterChip
            label="Profile complete"
            active={statusFilter === 'complete'}
            onClick={() => setStatusFilter('complete')}
          />
          <FilterChip
            label="Profile incomplete"
            active={statusFilter === 'incomplete'}
            onClick={() => setStatusFilter('incomplete')}
          />
        </div>
      </section>

      <section className="card p-0 overflow-hidden">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-600">
            Loading clients…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-600">
            No clients found.
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Address</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(client => (
                <tr
                  key={client.id}
                  className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => openClient(client.id)}
                >
                  <Td>{client.name || 'Unknown'}</Td>
                  <Td>{client.email || '—'}</Td>
                  <Td className="truncate max-w-xs">
                    {client.address || '—'}
                  </Td>
                  <Td>
                    <StatusBadge complete={client.profileComplete} />
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        openClient(client.id);
                      }}
                      className="text-xs text-teal-700 hover:underline"
                    >
                      View
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th
      className={
        'px-4 py-2 text-xs font-medium text-slate-500 ' +
        (align === 'right' ? 'text-right' : 'text-left')
      }
    >
      {children}
    </th>
  );
}

function Td({ children, align, className = '' }) {
  return (
    <td
      className={
        'px-4 py-2 text-sm text-slate-800 ' +
        (align === 'right' ? 'text-right' : 'text-left') +
        ' ' +
        className
      }
    >
      {children}
    </td>
  );
}

function StatusBadge({ complete }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ' +
        (complete
          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
          : 'border-amber-400 text-amber-700 bg-amber-50')
      }
    >
      {complete ? 'Profile complete' : 'Profile incomplete'}
    </span>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full border px-3 py-1 ' +
        (active
          ? 'border-teal-600 bg-teal-50 text-teal-700'
          : 'border-slate-300 bg-white text-slate-600')
      }
    >
      {label}
    </button>
  );
}
