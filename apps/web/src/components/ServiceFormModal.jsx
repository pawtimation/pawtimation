import React, { useState, useEffect } from 'react';
import { adminApi } from '../lib/auth';

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
  
  const [priceInput, setPriceInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setPriceInput(editing.priceCents ? (editing.priceCents / 100).toFixed(2) : '');
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
      setPriceInput('');
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
        const res = await adminApi(`/services/${editing.id}/update`, {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update service');
        }
      } else {
        // Create new service
        const res = await adminApi('/services/create', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create service');
        }
      }

      onClose(true);
    } catch (err) {
      console.error('Failed to save service', err);
      alert('Failed to save service. Please try again.');
    }
  }

  async function deleteService() {
    if (!editing?.id) return;
    
    setDeleting(true);
    try {
      const res = await adminApi(`/services/${editing.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete service');
        return;
      }
      
      setShowDeleteConfirm(false);
      onClose(true);
    } catch (err) {
      console.error('Failed to delete service', err);
      alert('Could not delete service. Please try again.');
    } finally {
      setDeleting(false);
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
              min="0"
              className="border rounded px-2 py-1 text-sm w-full"
              value={priceInput}
              onChange={e => {
                setPriceInput(e.target.value);
                const cents = e.target.value === '' ? 0 : Math.round(Number(e.target.value) * 100);
                update('priceCents', cents);
              }}
              placeholder="0.00"
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

        <div className="flex justify-between gap-2">
          {editing?.id && (
            <button 
              className="btn text-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              Delete
            </button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <button className="btn btn-secondary text-sm" onClick={() => onClose(false)}>Cancel</button>
            <button className="btn btn-primary text-sm" onClick={save}>Save</button>
          </div>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Service?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete this service? This will also permanently delete all bookings associated with this service. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-secondary text-sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn text-sm bg-red-600 text-white hover:bg-red-700"
                onClick={deleteService}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}
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
