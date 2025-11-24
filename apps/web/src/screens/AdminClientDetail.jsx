import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../lib/auth';
import { DogCard } from '../components/DogCard';
import { DogFormModal } from '../components/DogFormModal';

export function AdminClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDog, setEditingDog] = useState(null);
  const [dogModalOpen, setDogModalOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(false);

  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

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

  function startEdit(section) {
    setEditingSection(section);
    if (section === 'contact') {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || ''
      });
    } else if (section === 'address') {
      setFormData({
        addressLine1: client.addressLine1 || '',
        city: client.city || '',
        postcode: client.postcode || '',
        accessNotes: client.accessNotes || ''
      });
    } else if (section === 'emergency') {
      setFormData({
        emergencyName: client.emergencyName || '',
        emergencyPhone: client.emergencyPhone || ''
      });
    } else if (section === 'vet') {
      setFormData({
        vetDetails: client.vetDetails || ''
      });
    } else if (section === 'notes') {
      setFormData({
        notes: client.notes || ''
      });
    } else if (section === 'status') {
      setFormData({
        isActive: client.isActive !== undefined ? client.isActive : true
      });
    }
  }

  function cancelEdit() {
    setEditingSection(null);
    setFormData({});
  }

  async function saveEdit() {
    console.log('[SAVE] Starting save with formData:', formData);
    setSaving(true);
    try {
      console.log('[SAVE] Calling API /clients/' + clientId + '/update');
      const res = await adminApi(`/clients/${clientId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('[SAVE] Response status:', res.status, res.ok);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[SAVE] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update client');
      }

      const result = await res.json();
      console.log('[SAVE] Success:', result);

      setEditingSection(null);
      setFormData({});
      
      await loadClientData();
      alert('Client updated successfully!');
    } catch (e) {
      console.error('[SAVE] Exception:', e);
      alert(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function saveAccountStatus() {
    setStatusSaving(true);
    try {
      const endpoint = formData.isActive 
        ? `/clients/${clientId}/reactivate`
        : `/clients/${clientId}/deactivate`;
      
      const res = await adminApi(endpoint, {
        method: 'POST'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update account status');
      }

      setEditingSection(null);
      setFormData({});
      
      await loadClientData();
    } catch (e) {
      console.error('Failed to save account status', e);
      alert(e.message || 'Failed to update account status');
    } finally {
      setStatusSaving(false);
    }
  }

  function addDog() {
    setEditingDog(null);
    setDogModalOpen(true);
  }

  function editDog(dog) {
    setEditingDog(dog);
    setDogModalOpen(true);
  }

  async function closeDogModal(saved) {
    setDogModalOpen(false);
    setEditingDog(null);
    if (saved) {
      await refresh();
    }
  }

  async function toggleClientStatus() {
    if (processingStatus) return;

    const action = client.isActive ? 'deactivate' : 'reactivate';
    const confirmMessage = client.isActive 
      ? `Are you sure you want to deactivate ${client.name}? They can be reactivated within 30 days.`
      : `Reactivate ${client.name}?`;

    if (!confirm(confirmMessage)) return;

    setProcessingStatus(true);
    try {
      const response = await adminApi(`/clients/${clientId}/${action}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} client`);
      }

      await loadClientData();
      alert(`Client ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing client:`, error);
      alert(error.message || `Failed to ${action} client. Please try again.`);
    } finally {
      setProcessingStatus(false);
    }
  }

  function getProfileMissingFields(client) {
    const missing = [];
    if (!client.name) missing.push('Name');
    if (!client.email) missing.push('Email');
    if (!client.phone) missing.push('Phone');
    if (!client.addressLine1) missing.push('Address line 1');
    if (!client.city) missing.push('City');
    if (!client.postcode) missing.push('Postcode');
    if (!client.emergencyName) missing.push('Emergency contact name');
    if (!client.emergencyPhone) missing.push('Emergency contact phone');
    if (!client.vetDetails) missing.push('Vet details');
    if (!dogs || dogs.length === 0) missing.push('At least one dog');
    return missing;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-sm text-slate-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-600">Client not found.</p>
      </div>
    );
  }

  const missingFields = getProfileMissingFields(client);
  const profileComplete = missingFields.length === 0;

  return (
    <div className="space-y-6">
      {/* HEADER - Summary */}
      <header className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <button
          type="button"
          onClick={() => navigate('/admin/clients')}
          className="text-xs text-slate-500 hover:text-slate-700 mb-3 inline-flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to clients
        </button>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name || 'Client'}</h1>
            <p className="text-sm text-slate-600 mt-1">
              {client.email || 'No email'} · {client.phone || 'No phone'}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <StatusBadge complete={profileComplete} />
            {!profileComplete && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                <p className="font-semibold text-amber-900 mb-1">Missing for complete profile:</p>
                <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                  {missingFields.map(field => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTACT DETAILS & ADDRESS */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
            {editingSection !== 'contact' && (
              <button
                onClick={() => startEdit('contact')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          {editingSection === 'contact' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Name:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Phone:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.phone || '—'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Address & Access</h2>
            {editingSection !== 'address' && (
              <button
                onClick={() => startEdit('address')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          {editingSection === 'address' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="123 Main Street"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Manchester"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Postcode *</label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="M16 0RA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Access Notes</label>
                <textarea
                  value={formData.accessNotes}
                  onChange={(e) => setFormData({ ...formData, accessNotes: e.target.value })}
                  placeholder="e.g., Key under mat, gate code 1234"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Address:</span>
                <span className="ml-2 text-slate-900 font-medium">
                  {client.addressLine1 || client.city || client.postcode 
                    ? [client.addressLine1, client.city, client.postcode].filter(Boolean).join(', ')
                    : '—'}
                </span>
              </div>
              {client.lat && client.lng && (
                <div>
                  <span className="text-slate-500">GPS:</span>
                  <span className="ml-2 text-slate-900 font-medium">{client.lat}, {client.lng}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Access notes:</span>
                <span className="ml-2 text-slate-900">{client.accessNotes || '—'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EMERGENCY & VET */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Emergency Contact</h2>
            {editingSection !== 'emergency' && (
              <button
                onClick={() => startEdit('emergency')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          {editingSection === 'emergency' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  value={formData.emergencyName}
                  onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  placeholder="07000 000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Contact name:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.emergencyName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">Contact phone:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.emergencyPhone || '—'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Vet Details</h2>
            {editingSection !== 'vet' && (
              <button
                onClick={() => startEdit('vet')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          {editingSection === 'vet' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vet Clinic Name & Contact *</label>
                <textarea
                  value={formData.vetDetails}
                  onChange={(e) => setFormData({ ...formData, vetDetails: e.target.value })}
                  placeholder="e.g., City Vet Clinic, 123 High St, 0161 123 4567"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500">Vet clinic:</span>
                <span className="ml-2 text-slate-900 font-medium">{client.vetDetails || '—'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACCOUNT STATUS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Account Status</h2>
          {editingSection !== 'status' && (
            <button
              onClick={() => startEdit('status')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        
        {editingSection === 'status' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Client Account Status</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive === true}
                    onChange={() => setFormData({ ...formData, isActive: true })}
                    className="w-4 h-4 text-teal-600 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={formData.isActive === false}
                    onChange={() => setFormData({ ...formData, isActive: false })}
                    className="w-4 h-4 text-teal-600 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Inactive</span>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Inactive clients cannot log in or access their account
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveAccountStatus}
                disabled={statusSaving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {statusSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={statusSaving}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Status:</span>
              {client.isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
            {!client.isActive && client.deactivatedAt && (
              <p className="text-xs text-slate-500 mt-2">
                Deactivated on {new Date(client.deactivatedAt).toLocaleDateString()}
              </p>
            )}
            {!client.isActive && client.reactivationExpiresAt && (
              <p className="text-xs text-slate-500">
                Reactivation window expires {new Date(client.reactivationExpiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* NOTES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Additional Notes</h2>
          {editingSection !== 'notes' && (
            <button
              onClick={() => startEdit('notes')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        
        {editingSection === 'notes' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">General Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or information about this client..."
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-900">
            {client.notes ? (
              <p className="whitespace-pre-wrap">{client.notes}</p>
            ) : (
              <p className="text-slate-500 italic">No additional notes.</p>
            )}
          </div>
        )}
      </div>

      {/* MAP */}
      {(client.lat && client.lng) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Service Location</h2>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <iframe
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${client.lng - 0.01},${client.lat - 0.01},${client.lng + 0.01},${client.lat + 0.01}&layer=mapnik&marker=${client.lat},${client.lng}`}
                title="Client location map"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {[client.addressLine1, client.city, client.postcode].filter(Boolean).join(', ')}
              </span>
              <a
                href={`https://www.openstreetmap.org/?mlat=${client.lat}&mlon=${client.lng}#map=16/${client.lat}/${client.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                View on map →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DOGS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Dogs</h2>
          <button
            type="button"
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
            onClick={addDog}
          >
            + Add Dog
          </button>
        </div>

        {dogs.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm text-slate-600">No dogs recorded yet.</p>
            <p className="text-xs text-slate-500 mt-1">Add a dog to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dogs.map(dog => (
              <DogCard
                key={dog.id}
                dog={dog}
                onEdit={editDog}
              />
            ))}
          </div>
        )}
      </div>

      {/* RECENT BOOKINGS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Bookings</h2>

        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-600">No bookings yet for this client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Dog(s)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {job.start ? new Date(job.start).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {job.serviceName || job.serviceId || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {job.dogNames || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadgeBooking status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {bookings.length > 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/admin/calendar')}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              View all bookings →
            </button>
          </div>
        )}
      </div>

      {/* RECENT INVOICES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Invoices</h2>

        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-600">No invoices yet for this client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                      {inv.number || inv.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {inv.date ? new Date(inv.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {typeof inv.total === 'number' ? `£${inv.total.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadgeInvoice status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {invoices.length > 5 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/admin/invoices')}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              View all invoices →
            </button>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Account Status</h2>
        <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Status</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                client.isActive !== false 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {client.isActive !== false ? 'Active' : 'Deactivated'}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              {client.isActive !== false 
                ? 'Deactivate this client if they no longer use your services. This will keep their history, but block new bookings.'
                : `This client was deactivated on ${client.deactivatedAt ? new Date(client.deactivatedAt).toLocaleDateString() : 'unknown date'}.`
              }
            </p>
            
            {client.isActive === false && client.reactivationExpiresAt && (
              <p className="text-xs text-amber-600 mb-4 font-medium">
                Can be reactivated until {new Date(client.reactivationExpiresAt).toLocaleDateString()}
              </p>
            )}
            
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                client.isActive !== false
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              } ${processingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={toggleClientStatus}
              disabled={processingStatus}
            >
              {processingStatus 
                ? 'Processing...' 
                : (client.isActive !== false ? 'Deactivate Client' : 'Reactivate Client')
              }
            </button>
        </div>
      </div>

      {/* DOG MODAL */}
      <DogFormModal
        open={dogModalOpen}
        onClose={closeDogModal}
        dog={editingDog}
        clientId={clientId}
      />
    </div>
  );
}

function StatusBadge({ complete }) {
  return (
    <span
      className={
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ' +
        (complete
          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
          : 'border-amber-400 text-amber-700 bg-amber-50')
      }
    >
      {complete ? '✓ Profile complete' : '⚠ Profile incomplete'}
    </span>
  );
}

function StatusBadgeBooking({ status }) {
  const statusStyles = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const style = statusStyles[status?.toUpperCase()] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
      {status || 'Unknown'}
    </span>
  );
}

function StatusBadgeInvoice({ status }) {
  const statusStyles = {
    DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
    SENT: 'bg-blue-50 text-blue-700 border-blue-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const style = statusStyles[status?.toUpperCase()] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
      {status || 'Unknown'}
    </span>
  );
}
