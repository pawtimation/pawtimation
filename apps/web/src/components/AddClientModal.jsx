import React, { useState } from 'react';
import { adminApi } from '../lib/auth';

export function AddClientModal({ isOpen, onClose, onClientAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    city: '',
    postcode: '',
    accessNotes: '',
    emergencyName: '',
    emergencyPhone: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      addressLine1: '',
      city: '',
      postcode: '',
      accessNotes: '',
      emergencyName: '',
      emergencyPhone: '',
      notes: ''
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await adminApi('/clients/create', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          addressLine1: formData.addressLine1.trim() || null,
          city: formData.city.trim() || null,
          postcode: formData.postcode.trim() || null,
          accessNotes: formData.accessNotes.trim() || null,
          emergencyName: formData.emergencyName.trim() || null,
          emergencyPhone: formData.emergencyPhone.trim() || null,
          notes: formData.notes.trim() || null,
          profileComplete: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create client');
      }

      if (onClientAdded) {
        onClientAdded(data.client);
      }
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Add New Client
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Create a client account manually
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 bg-red-50 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="John Smith"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="john@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="07123 456789"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Address</p>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.addressLine1}
                onChange={handleChange('addressLine1')}
                placeholder="Street address"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.city}
                  onChange={handleChange('city')}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  disabled={saving}
                />
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={handleChange('postcode')}
                  placeholder="Postcode"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  disabled={saving}
                />
              </div>
              <input
                type="text"
                value={formData.accessNotes}
                onChange={handleChange('accessNotes')}
                placeholder="Access notes (e.g. key under mat, gate code)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Emergency Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.emergencyName}
                onChange={handleChange('emergencyName')}
                placeholder="Contact name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={handleChange('emergencyPhone')}
                placeholder="Contact phone"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Any other important information..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
