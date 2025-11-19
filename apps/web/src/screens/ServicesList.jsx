import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { ServiceCard } from '../components/ServiceCard';

export function ServicesList({ business }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, [business]);

  async function load() {
    setLoading(true);
    try {
      if (!business) return;
      const list = await repo.listServicesByBusiness?.(business.id);
      setServices(list || []);
    } finally {
      setLoading(false);
    }
  }

  function addService() {
    setEditing(null);
    setModalOpen(true);
  }

  function editService(service) {
    setEditing(service);
    setModalOpen(true);
  }

  async function closeModal(saved) {
    setModalOpen(false);
    setEditing(null);
    if (saved) load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Services</h1>
          <p className="text-sm text-slate-600">Define the services your business offers.</p>
        </div>
        <button className="btn btn-primary text-sm" onClick={addService}>
          Add service
        </button>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Loading services…</p>
      ) : services.length === 0 ? (
        <div className="card text-sm text-slate-600">No services created yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onEdit={editService} />
          ))}
        </div>
      )}

      <ServiceFormModal
        open={modalOpen}
        onClose={closeModal}
        editing={editing}
        businessId={business?.id}
      />
    </div>
  );
}
