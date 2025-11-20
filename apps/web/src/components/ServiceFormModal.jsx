import React, { useState, useEffect } from 'react';
import { api } from '../lib/auth';

export function ServiceFormModal({ open, onClose, editing, businessId }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    priceCents: 0,
    group: false,
    maxDogs: 1,
    allowClientBooking: true,
    approvalRequired: false,
    active: true
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        description: editing.description || '',
        durationMinutes: editing.durationMinutes || 60,
        priceCents: editing.priceCents || 0,
        group: editing.group || false,
        maxDogs: editing.maxDogs || 1,
        allowClientBooking: editing.allowClientBooking !== false,
        approvalRequired: editing.approvalRequired || false,
        active: editing.active !== false
      });
    } else {
      setForm({
        name: '',
        description: '',
        durationMinutes: 60,
        priceCents: 0,
        group: false,
        maxDogs: 1,
        allowClientBooking: true,
        approvalRequired: false,
        active: true
      });
    }
  }, [editing, open]);

  if (!open) return null;

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function save() {
    if (!businessId) return;

    const data = {
      ...form,
      businessId
    };

    try {
      if (editing?.id) {
        // Update existing service
        const res = await api(`/services/${editing.id}/update`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          throw new Error('Failed to update service');
        }
      } else {
        // Create new service
        const res = await api('/services/create', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        if (!res.ok) {
          throw new Error('Failed to create service');
        }
      }

      onClose(true);
    } catch (err) {
      console.error('Failed to save service', err);
      alert('Failed to save service. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          {editing ? 'Edit Service' : 'Add Service'}
        </h2>

        <div className="grid gap-3">
          <Input label="Name" value={form.name} onChange={v => update('name', v)} />
          <Textarea label="Description" value={form.description} onChange={v => update('description', v)} />
          <Input 
            label="Duration (minutes)" 
            type="number"
            value={form.durationMinutes} 
            onChange={v => update('durationMinutes', Number(v))} 
          />
          <div className="text-sm text-slate-700 space-y-1">
            <div className="font-medium">Price (£)</div>
            <input
              type="number"
              step="0.01"
              className="border rounded px-2 py-1 text-sm w-full"
              value={form.priceCents / 100}
              onChange={e => update('priceCents', Math.round(Number(e.target.value) * 100))}
            />
          </div>

          <Checkbox label="Group service" checked={form.group} onChange={v => update('group', v)} />

          {form.group && (
            <Input 
              label="Maximum dogs" 
              type="number"
              value={form.maxDogs} 
              onChange={v => update('maxDogs', Number(v))} 
            />
          )}

          <Checkbox label="Clients can book directly" checked={form.allowClientBooking} onChange={v => update('allowClientBooking', v)} />
          <Checkbox label="Manager approval required" checked={form.approvalRequired} onChange={v => update('approvalRequired', v)} />
          <Checkbox label="Active" checked={form.active} onChange={v => update('active', v)} />
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary text-sm" onClick={() => onClose(false)}>Cancel</button>
          <button className="btn btn-primary text-sm" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm text-slate-700 space-y-1 block">
      <div className="font-medium">{label}</div>
      <input
        type={type}
        className="border rounded px-2 py-1 text-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <label className="text-sm text-slate-700 space-y-1 block">
      <div className="font-medium">{label}</div>
      <textarea
        className="border rounded px-2 py-1 text-sm w-full h-20"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
