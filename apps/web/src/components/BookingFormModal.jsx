import React, { useEffect, useState } from 'react';
import { api } from '../lib/auth';
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

    try {
      const [clientsRes, servicesRes, staffRes, bookingsRes] = await Promise.all([
        api(`/api/clients/list`),
        api(`/api/services/list`),
        api(`/api/staff/list`),
        api(`/api/bookings/list`)
      ]);

      const c = clientsRes.ok ? await clientsRes.json() : [];
      const s = servicesRes.ok ? await servicesRes.json() : [];
      const st = staffRes.ok ? await staffRes.json() : [];
      const b = bookingsRes.ok ? await bookingsRes.json() : [];

      setClients(Array.isArray(c) ? c : c.clients || []);
      setServices(Array.isArray(s) ? s : s.services || []);
      setStaff(Array.isArray(st) ? st : st.staff || []);
      setAllBookings(Array.isArray(b) ? b : b.bookings || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to load booking data', err);
      setDataLoaded(true);
    }
  }

  async function loadDogsForClient(clientId) {
    try {
      const res = await api(`/api/clients/${clientId}/dogs`);
      if (res.ok) {
        const data = await res.json();
        setDogs(Array.isArray(data) ? data : data.dogs || []);
      }
    } catch (err) {
      console.error('Failed to load dogs', err);
    }
  }

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!businessId) return;

    const service = services.find(s => s.id === form.serviceId);
    const client = clients.find(c => c.id === form.clientId);

    // Basic validation
    if (!form.clientId || !form.serviceId || !form.start) {
      alert("Client, service and start date are required");
      return;
    }

    const startDate = new Date(form.start);
    const endDate = new Date(startDate);
    if (service?.durationMinutes) {
      endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
    }

    // Always normalise status to UPPERCASE for the backend
    const statusUpper = (form.status || "PENDING").toUpperCase();

    try {
      if (editing?.id) {
        //
        // 🔁 UPDATE EXISTING BOOKING
        // Hits POST /bookings/:bookingId/update
        //
        const payload = {
          start: startDate.toISOString(),
          serviceId: form.serviceId,
          staffId: form.staffId || null,
          status: statusUpper,
          // Optional, but supported by patched backend
          priceCents: form.priceCents,
        };

        const res = await api(`/api/bookings/${editing.id}/update`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error || "Failed to update booking";
          alert(msg);
          return;
        }

        const data = await res.json();

        // Keep local list in sync if setter is provided
        if (setAllBookings && data.booking) {
          setAllBookings(prev =>
            (prev || []).map(b => (b.id === data.booking.id ? data.booking : b))
          );
        }
      } else {
        //
        // 🆕 CREATE NEW BOOKING
        // Hits POST /jobs/create
        // Backend will set status (REQUESTED) and priceCents from service
        //
        const payload = {
          businessId,
          clientId: form.clientId,
          dogIds: form.dogIds,
          serviceId: form.serviceId,
          start: startDate.toISOString(),
          notes: form.notes,
        };

        const res = await api("/api/jobs/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error || "Failed to create booking";
          alert(msg);
          return;
        }

        const data = await res.json();

        if (setAllBookings && data.job) {
          setAllBookings(prev => ([...(prev || []), data.job]));
        }
      }

      // Close modal and let parent refresh if needed
      onClose(true);
    } catch (err) {
      console.error("Booking save error", err);
      alert("Could not save booking. Please try again.");
    }
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
            { value: 'COMPLETED', label: 'Completed' },
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
