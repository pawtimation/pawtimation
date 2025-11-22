import { useState, useEffect } from "react";
import { clientApi, clearSession, getSession } from "../../lib/auth";
import { useNavigate } from "react-router-dom";
import { MobilePageHeader } from "../../components/mobile/MobilePageHeader";
import { MobileCard } from "../../components/mobile/MobileCard";

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
      const session = getSession('CLIENT');
      if (!session || !session.userSnapshot) {
        navigate('/client/login');
        return;
      }

      const clientData = session.userSnapshot;
      const clientId = session.crmClientId || clientData.crmClientId || clientData.id;
      const res = await clientApi(`/clients/${clientId}`);
      
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
      const session = getSession('CLIENT');
      if (!session || !session.userSnapshot) return;

      const clientData = session.userSnapshot;
      const clientId = session.crmClientId || clientData.crmClientId || clientData.id;
      const res = await clientApi(`/clients/${clientId}/update`, {
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
      const session = getSession('CLIENT');
      if (!session || !session.userSnapshot) return;

      const clientData = session.userSnapshot;
      const clientId = session.crmClientId || clientData.crmClientId || clientData.id;
      const res = await clientApi(`/clients/${clientId}/update`, {
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
      clearSession('CLIENT');
      navigate('/client/login');
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      <MobilePageHeader 
        title="Settings" 
        subtitle="Manage your account information"
      />

      <div className="space-y-4">
        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Profile</h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingProfile(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Name</p>
                <p className="text-base text-slate-900">{client.firstName} {client.lastName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Email</p>
                <p className="text-base text-slate-900">{client.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Phone</p>
                <p className="text-base text-slate-900">{client.phone || 'Not provided'}</p>
              </div>
            </div>
          )}
        </MobileCard>

        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Address</h2>
            {!editingAddress && (
              <button
                onClick={() => setEditingAddress(true)}
                className="px-4 py-2 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {editingAddress ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Street Address</label>
                <input
                  type="text"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                  placeholder="123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">City</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                  placeholder="London"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Postcode</label>
                <input
                  type="text"
                  value={addressForm.postcode}
                  onChange={(e) => setAddressForm({ ...addressForm, postcode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-teal-600 transition-colors"
                  placeholder="SW1A 1AA"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingAddress(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAddress}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-base text-slate-900">{client.addressLine1 || 'No address provided'}</p>
                  {client.city && <p className="text-sm text-slate-600">{client.city} {client.postcode}</p>}
                </div>
              </div>
            </div>
          )}
        </MobileCard>

        <MobileCard>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </MobileCard>
      </div>
    </div>
  );
}
