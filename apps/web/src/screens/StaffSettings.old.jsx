import React, { useEffect, useState } from 'react';
import { api } from '../lib/auth';

export function StaffSettings() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    newJobAssignments: true,
    jobUpdates: true,
    routeAdded: true,
    dailySummary: false
  });
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await api('/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setStaffId(data.user.id);
          setProfile({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || ''
          });
          if (data.user.notificationPreferences) {
            setNotificationPreferences(data.user.notificationPreferences);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function saveProfile() {
    if (!staffId) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await api(`/staff/${staffId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          notificationPreferences
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update localStorage with new data
        const userStr = localStorage.getItem('pt_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const updatedUser = { ...user, ...profile, notificationPreferences };
          localStorage.setItem('pt_user', JSON.stringify(updatedUser));
        }

        setMessage({ type: 'success', text: 'Profile saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: errorData.error || 'Failed to save profile' });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  }

  function updateNotificationPref(key, value) {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading settings...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-600">
          Manage your profile and notification preferences
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : message.type === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="card space-y-6">
        <h2 className="font-semibold text-slate-800">Profile Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 cursor-not-allowed"
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="07123 456789"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-800">Notification Preferences</h2>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={notificationPreferences.newJobAssignments}
              onChange={(e) => updateNotificationPref('newJobAssignments', e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">New Job Assignments</p>
              <p className="text-xs text-slate-600">Notify me when a new job is assigned to me</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={notificationPreferences.jobUpdates}
              onChange={(e) => updateNotificationPref('jobUpdates', e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Job Updates</p>
              <p className="text-xs text-slate-600">Notify me when my assigned jobs are modified</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={notificationPreferences.routeAdded}
              onChange={(e) => updateNotificationPref('routeAdded', e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Route Added</p>
              <p className="text-xs text-slate-600">Notify me when a walking route is added to my job</p>
            </div>
          </label>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={notificationPreferences.dailySummary}
              onChange={(e) => updateNotificationPref('dailySummary', e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Daily Summary</p>
              <p className="text-xs text-slate-600">Receive a daily summary of upcoming jobs</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="card bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">ℹ️ About Your Account</h3>
        <p className="text-xs text-slate-600">
          Your profile is managed by your business administrator. If you need to change your email
          or other account details, please contact your manager.
        </p>
      </div>
    </div>
  );
}
