import { useState, useEffect } from "react";
import { api } from "../../lib/auth";
import { useNavigate } from "react-router-dom";

export function ClientSettings() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const [addressForm, setAddressForm] = useState({
    addressLine1: "",
    city: "",
    postcode: ""
  });

  useEffect(() => {
    loadClient();
  }, []);

  async function loadClient() {
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) {
        navigate('/client/login');
        return;
      }

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId || clientData.id;
      const res = await api(`/clients/${clientId}`);
      
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setProfileForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || ""
        });
        setAddressForm({
          addressLine1: data.addressLine1 || "",
          city: data.city || "",
          postcode: data.postcode || ""
        });
      }
    } catch (err) {
      console.error('Failed to load client:', err);
    }
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) return;

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId || clientData.id;
      const res = await api(`/clients/${clientId}/update`, {
        method: 'POST',
        body: JSON.stringify(profileForm)
      });
      
      if (res.ok) {
        await loadClient();
        setEditingProfile(false);
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
    }
    setSaving(false);
  }

  async function saveAddress() {
    setSaving(true);
    try {
      const ptClient = localStorage.getItem('pt_client');
      if (!ptClient) return;

      const clientData = JSON.parse(ptClient);
      const clientId = clientData.clientId || clientData.id;
      const res = await api(`/clients/${clientId}/update`, {
        method: 'POST',
        body: JSON.stringify(addressForm)
      });
      
      if (res.ok) {
        await loadClient();
        setEditingAddress(false);
      } else {
        alert('Failed to save address. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Failed to save address. Please try again.');
    }
    setSaving(false);
  }

  function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('pt_client');
      localStorage.removeItem('pt_user');
      navigate('/client/login');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Profile</h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="text-teal-600 font-medium text-sm"
              >
                Edit
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-sm text-slate-900">{client.firstName} {client.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-slate-900">{client.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-slate-900">{client.phone || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Address</h2>
            {!editingAddress && (
              <button
                onClick={() => setEditingAddress(true)}
                className="text-teal-600 font-medium text-sm"
              >
                Edit
              </button>
            )}
          </div>

          {editingAddress ? (
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({...addressForm, addressLine1: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={addressForm.postcode}
                  onChange={(e) => setAddressForm({...addressForm, postcode: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingAddress(false)}
                  className="flex-1 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAddress}
                  disabled={saving}
                  className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <div>
                <p className="text-xs text-slate-500">Street Address</p>
                <p className="text-sm text-slate-900">{client.addressLine1 || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">City</p>
                <p className="text-sm text-slate-900">{client.city || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Postcode</p>
                <p className="text-sm text-slate-900">{client.postcode || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Section */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-slate-600">Email and SMS notification preferences coming soon.</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
