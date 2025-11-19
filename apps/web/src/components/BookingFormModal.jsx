import React, { useEffect, useState } from 'react';
import { repo } from '../../../api/src/repo.js';
import { rankStaff } from '../lib/staff.js';

export function BookingFormModal({ open, onClose, editing, businessId }) {
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [suggestedStaff, setSuggestedStaff] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [form, setForm] = useState({
    clientId: '',
    dogIds: [],
    serviceId: '',
    start: '',
    status: 'PENDING',
    priceCents: 0,
    notes: '',
    staffId: ''
  });

  useEffect(() => {
    if (open) loadData();
  }, [open, businessId]);

  useEffect(() => {
    if (editing) {
      setForm({
        clientId: editing.clientId || '',
        dogIds: editing.dogIds || [],
        serviceId: editing.serviceId || '',
        start: editing.start?.slice(0, 16) || '',
        status: editing.status || 'PENDING',
        priceCents: editing.priceCents || 0,
        notes: editing.notes || '',
        staffId: editing.staffId || ''
      });
      if (editing.clientId) {
        setSelectedClient(editing.clientId);
        loadDogsForClient(editing.clientId);
      }
    } else {
      setForm({
        clientId: '',
        dogIds: [],
        serviceId: '',
        start: '',
        status: 'PENDING',
        priceCents: 0,
        notes: '',
        staffId: ''
      });
      setSelectedClient('');
      setDogs([]);
    }
  }, [editing, open]);

  // Auto-assign price based on selected service
  useEffect(() => {
    if (form.serviceId && services.length > 0) {
      const svc = services.find(s => s.id === form.serviceId);
      if (svc && svc.priceCents !== undefined) {
        update('priceCents', svc.priceCents);
      }
    }
  }, [form.serviceId, services]);

  // Auto-suggest staff when booking details change
  useEffect(() => {
    if (!form.start || !form.serviceId || !businessId || !dataLoaded) {
      setSuggestedStaff([]);
      return;
    }

    const service = services.find(s => s.id === form.serviceId);
    if (!service) return;

    const startDate = new Date(form.start);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (service.durationMinutes || 30));

    const bookingForRanking = {
      ...form,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };

    // Exclude the current booking being edited from conflict checks
    const ranked = rankStaff(staff, bookingForRanking, allBookings, editing?.id);
    setSuggestedStaff(ranked);

    // Auto-assign best match if no staff selected and data is loaded
    if (!form.staffId && ranked.length > 0 && ranked[0].score > 0) {
      update('staffId', ranked[0].staff.id);
    }
  }, [form.start, form.serviceId, staff, allBookings, services, dataLoaded]);

  async function loadData() {
    if (!businessId) return;
    
    setDataLoaded(false);

    const [c, s, st, b] = await Promise.all([
      repo.listClientsByBusiness?.(businessId),
      repo.listServicesByBusiness?.(businessId),
      repo.listStaffByBusiness?.(businessId),
      repo.listJobsByBusiness?.(businessId)
    ]);

    setClients(c || []);
    setServices(s || []);
    setStaff(st || []);
    setAllBookings(b || []);
    setDataLoaded(true);
  }

  async function loadDogsForClient(clientId) {
    const d = await repo.listDogsByClient?.(clientId);
    setDogs(d || []);
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!businessId) return;

    const service = services.find(s => s.id === form.serviceId);
    const client = clients.find(c => c.id === form.clientId);
    
    const startDate = new Date(form.start);
    const endDate = new Date(startDate);
    if (service?.durationMinutes) {
      endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
    }

    const data = {
      businessId,
      clientId: form.clientId,
      dogIds: form.dogIds,
      serviceId: form.serviceId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      status: form.status,
      priceCents: form.priceCents,
      notes: form.notes,
      staffId: form.staffId || null,
      clientName: client?.name,
      serviceName: service?.name
    };

    if (editing?.id) {
      await repo.updateJob?.(editing.id, data);
    } else {
      await repo.createJob?.(data);
    }

    // Refresh bookings data for next time modal opens
    const freshBookings = await repo.listJobsByBusiness?.(businessId);
    setAllBookings(freshBookings || []);

    onClose(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">
          {editing ? 'Edit Booking' : 'Create Booking'}
        </h2>

        <Select
          label="Client"
          value={form.clientId}
          onChange={v => {
            update('clientId', v);
            setSelectedClient(v);
            loadDogsForClient(v);
          }}
          options={clients.map(c => ({ value: c.id, label: c.name }))}
        />

        {dogs.length > 0 && (
          <CheckboxGroup
            label="Dogs"
            values={form.dogIds}
            onChange={v => update('dogIds', v)}
            options={dogs.map(d => ({ value: d.id, label: d.name }))}
          />
        )}

        <Select
          label="Service"
          value={form.serviceId}
          onChange={v => update('serviceId', v)}
          options={services.map(s => ({ value: s.id, label: s.name }))}
        />

        <Input
          label="Start date & time"
          type="datetime-local"
          value={form.start}
          onChange={v => update('start', v)}
        />

        {suggestedStaff.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm space-y-1 text-slate-700">
              <div className="font-medium">Assign Staff</div>
              <select
                className="border rounded px-2 py-1 text-sm w-full"
                value={form.staffId}
                onChange={e => update('staffId', e.target.value)}
              >
                <option value="">No staff assigned</option>
                {suggestedStaff.map(({ staff, score, conflicts, qualified, available }) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — Match: {score}%
                    {!qualified && ' (Not qualified)'}
                    {qualified && conflicts.length > 0 && ` (${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''})`}
                    {qualified && !available && ' (Outside availability)'}
                  </option>
                ))}
              </select>
            </label>

            {form.staffId && (() => {
              const selectedStaffInfo = suggestedStaff.find(s => s.staff.id === form.staffId);
              if (selectedStaffInfo && selectedStaffInfo.conflicts.length > 0) {
                return (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                    ⚠️ Warning: This staff member has {selectedStaffInfo.conflicts.length} conflicting booking{selectedStaffInfo.conflicts.length > 1 ? 's' : ''} at this time
                  </div>
                );
              }
              if (selectedStaffInfo && !selectedStaffInfo.available) {
                return (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Note: This booking is outside the staff member's usual availability hours
                  </div>
                );
              }
              if (selectedStaffInfo && selectedStaffInfo.score === 100) {
                return (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                    ✓ Perfect match: Qualified, available, and no conflicts
                  </div>
                );
              }
            })()}
          </div>
        )}

        <Select
          label="Status"
          value={form.status}
          onChange={v => update('status', v)}
          options={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'REQUESTED', label: 'Requested' },
            { value: 'SCHEDULED', label: 'Scheduled' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'COMPLETE', label: 'Complete' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'DECLINED', label: 'Declined' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={v => update('notes', v)}
        />

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary text-sm" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button className="btn btn-primary text-sm" onClick={save}>
            Save booking
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <select
        className="border rounded px-2 py-1 text-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="block text-sm space-y-1 text-slate-700">
      <div className="font-medium">{label}</div>
      <textarea
        className="border rounded px-2 py-1 text-sm w-full h-20"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function CheckboxGroup({ label, values, onChange, options }) {
  function toggle(value) {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  return (
    <div className="space-y-1">
      <div className="font-medium text-sm text-slate-700">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
