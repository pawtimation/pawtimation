import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, adminApi } from '../lib/auth';
import { DogCard } from '../components/DogCard';
import { DogFormModal } from '../components/DogFormModal';
import { AddressMap } from '../components/AddressMap';

const TABS = ['Profile', 'Dogs', 'Bookings', 'Invoices', 'Actions'];

export function AdminClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState('Profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  async function loadClientData() {
    try {
      const clientRes = await adminApi(`/clients/${clientId}`);
      if (!clientRes.ok) {
        navigate('/admin/clients');
        return;
      }

      const clientData = await clientRes.json();
      
      const [dogsRes, jobsRes, invoicesRes] = await Promise.all([
        adminApi(`/dogs/by-client/${clientId}`),
        adminApi(`/bookings/by-client/${clientId}`),
        adminApi(`/invoices/by-client/${clientId}`)
      ]);

      setClient(clientData);
      setDogs(dogsRes.ok ? await dogsRes.json() : []);
      setBookings(jobsRes.ok ? await jobsRes.json() : []);
      setInvoices(invoicesRes.ok ? await invoicesRes.json() : []);
    } catch (e) {
      console.error('Failed to load client detail', e);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const [dogsRes, jobsRes, invoicesRes] = await Promise.all([
      adminApi(`/dogs/by-client/${clientId}`),
      adminApi(`/bookings/by-client/${clientId}`),
      adminApi(`/invoices/by-client/${clientId}`)
    ]);

    setDogs(dogsRes.ok ? await dogsRes.json() : []);
    setBookings(jobsRes.ok ? await jobsRes.json() : []);
    setInvoices(invoicesRes.ok ? await invoicesRes.json() : []);
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading client…</p>;
  }

  if (!client) {
    return <p className="text-sm text-slate-600">Client not found.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to clients
          </button>
          <h1 className="text-xl font-semibold mt-1">{client.name || 'Client'}</h1>
          <p className="text-sm text-slate-600">
            {client.email || 'No email'} · {client.phone || 'No phone'}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <StatusBadge complete={client.profileComplete} />
        </div>
      </header>

      <div className="border-b flex gap-4 text-sm">
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'pb-2 -mb-px border-b-2 ' +
              (activeTab === tab
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-600 hover:text-slate-800')
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        {activeTab === 'Profile' && <ProfileTab client={client} />}
        {activeTab === 'Dogs' && <DogsTab dogs={dogs} clientId={clientId} refresh={refresh} />}
        {activeTab === 'Bookings' && <BookingsTab bookings={bookings} />}
        {activeTab === 'Invoices' && <InvoicesTab invoices={invoices} />}
        {activeTab === 'Actions' && (
          <ActionsTab client={client} />
        )}
      </section>
    </div>
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

function ProfileTab({ client }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-1 text-sm text-slate-700">
          <h2 className="text-xs font-semibold text-slate-500 uppercase">
            Contact details
          </h2>
          <div><span className="font-medium">Name:</span> {client.name || '—'}</div>
          <div><span className="font-medium">Email:</span> {client.email || '—'}</div>
          <div><span className="font-medium">Phone:</span> {client.phone || '—'}</div>
        </div>
        <div className="card space-y-1 text-sm text-slate-700">
          <h2 className="text-xs font-semibold text-slate-500 uppercase">
            Address & access
          </h2>
          <div>
            <span className="font-medium">Address:</span>{' '}
            {client.addressLine1 || client.city || client.postcode 
              ? [client.addressLine1, client.city, client.postcode].filter(Boolean).join(', ')
              : (client.address || '—')}
          </div>
          {client.lat && client.lng && (
            <div><span className="font-medium">GPS:</span> {client.lat}, {client.lng}</div>
          )}
          <div><span className="font-medium">Access notes:</span> {client.accessNotes || '—'}</div>
        </div>
        <div className="card space-y-1 text-sm text-slate-700">
          <h2 className="text-xs font-semibold text-slate-500 uppercase">
            Emergency
          </h2>
          <div><span className="font-medium">Contact name:</span> {client.emergencyName || '—'}</div>
          <div><span className="font-medium">Contact phone:</span> {client.emergencyPhone || '—'}</div>
          <div><span className="font-medium">Vet details:</span> {client.vetDetails || '—'}</div>
        </div>
        <div className="card space-y-1 text-sm text-slate-700">
          <h2 className="text-xs font-semibold text-slate-500 uppercase">
            Notes
          </h2>
          <div>{client.notes || 'No additional notes.'}</div>
        </div>
      </div>
      
      {(client.lat && client.lng) && (
        <div className="card">
          <h2 className="text-xs font-semibold text-slate-500 uppercase mb-3">Service Location</h2>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded overflow-hidden">
              <iframe
                width="100%"
                height="300"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${client.lng - 0.01},${client.lat - 0.01},${client.lng + 0.01},${client.lat + 0.01}&layer=mapnik&marker=${client.lat},${client.lng}`}
                title="Client location map"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {[client.addressLine1, client.city, client.postcode].filter(Boolean).join(', ') || client.address}
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${client.lat}&mlon=${client.lng}#map=16/${client.lat}/${client.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DogsTab({ dogs, clientId, refresh }) {
  const [editingDog, setEditingDog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function addDog() {
    setEditingDog(null);
    setModalOpen(true);
  }

  function editDog(dog) {
    setEditingDog(dog);
    setModalOpen(true);
  }

  async function closeModal(saved) {
    setModalOpen(false);
    setEditingDog(null);
    if (saved && refresh) {
      await refresh();
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="btn btn-primary text-sm"
        onClick={addDog}
      >
        Add dog
      </button>

      {dogs.length === 0 ? (
        <div className="card text-sm text-slate-600">
          No dogs recorded yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dogs.map(dog => (
            <DogCard
              key={dog.id}
              dog={dog}
              onEdit={editDog}
            />
          ))}
        </div>
      )}

      <DogFormModal
        open={modalOpen}
        onClose={closeModal}
        dog={editingDog}
        clientId={clientId}
      />
    </div>
  );
}

function BookingsTab({ bookings }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="card text-sm text-slate-600">
        No bookings yet for this client.
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Service</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Dog(s)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(job => (
            <tr key={job.id} className="border-b last:border-b-0">
              <td className="px-4 py-2 text-sm text-slate-800">
                {job.start ? new Date(job.start).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {job.serviceName || job.serviceId || '—'}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {job.dogNames || '—'}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {job.status || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoicesTab({ invoices }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="card text-sm text-slate-600">
        No invoices yet for this client.
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Invoice</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Amount</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} className="border-b last:border-b-0">
              <td className="px-4 py-2 text-sm text-slate-800">
                {inv.number || inv.id}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {inv.date ? new Date(inv.date).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {typeof inv.total === 'number' ? `£${inv.total.toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {inv.status || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionsTab({ client }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card space-y-2 text-sm text-slate-700">
        <h2 className="text-xs font-semibold text-slate-500 uppercase">
          Client invite
        </h2>
        <p>
          Share an invite link or QR code so this client can create or access their
          account linked to your business.
        </p>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          disabled
        >
          Invite tools coming soon
        </button>
      </div>
      <div className="card space-y-2 text-sm text-slate-700">
        <h2 className="text-xs font-semibold text-slate-500 uppercase">
          Account status
        </h2>
        <p>
          Deactivate a client if they no longer use your services. This will keep
          their history, but block new bookings.
        </p>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          disabled
        >
          Deactivate client (coming soon)
        </button>
      </div>
    </div>
  );
}
