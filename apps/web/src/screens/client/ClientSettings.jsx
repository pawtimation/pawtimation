import { useEffect, useState } from "react";
import { clientApi, clearSession } from "../../lib/auth";
import { useNavigate } from "react-router-dom";

export function ClientSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    postcode: "",
    vetDetails: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  async function load() {
    setLoading(true);
    
    try {
      const cRes = await clientApi('/me');
      if (!cRes.ok) {
        if (cRes.status === 401 || cRes.status === 403) {
          clearSession('CLIENT');
          navigate('/client/login');
          return;
        } else {
          setError("Failed to load profile");
        }
        setLoading(false);
        return;
      }
      const c = await cRes.json();
      
      setClient(c);
      setError(null);
      setForm({
        name: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        addressLine1: c.addressLine1 || "",
        city: c.city || "",
        postcode: c.postcode || "",
        vetDetails: c.vetDetails || "",
        emergencyContactName: c.emergencyContact?.name || "",
        emergencyContactPhone: c.emergencyContact?.phone || ""
      });

      const dRes = await clientApi('/dogs/list');
      if (dRes.ok) {
        const dogsData = await dRes.json();
        setDogs(Array.isArray(dogsData) ? dogsData : []);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError("An error occurred while loading your profile");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    try {
      const submitData = {
        ...form,
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone
        }
      };
      delete submitData.emergencyContactName;
      delete submitData.emergencyContactPhone;
      
      const res = await clientApi('/me/update', {
        method: "POST",
        body: JSON.stringify(submitData)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Unable to save changes: ${errData.error || "Unknown error"}`);
        setSaving(false);
        return;
      }
      
      alert("Profile updated successfully!");
      load();
    } catch (err) {
      console.error("Save failed", err);
      alert("Unable to save changes. Please try again.");
    }
    setSaving(false);
  }

  function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
      clearSession('CLIENT');
      navigate('/client/login');
    }
  }

  if (loading && !client) {
    return <p className="text-sm text-slate-600">Loading profile…</p>;
  }

  if (error && !client) {
    return (
      <div className="space-y-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={load}
          className="w-full bg-teal-700 text-white p-3 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!client) {
    return <p className="text-sm text-slate-600">Profile not found.</p>;
  }

  return (
    <div className="space-y-6">

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm font-medium">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && client && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-teal-800 text-sm">Reloading profile…</p>
        </div>
      )}

      <div>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <p className="text-sm text-slate-600">My Profile</p>
      </div>

      <div className="p-4 border rounded-md bg-white space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Contact Information</h2>

        <div>
          <label className="text-sm text-slate-600 block mb-1">Email</label>
          <input
            value={form.email}
            onChange={e => updateField("email", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            type="email"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600 block mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={e => updateField("phone", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            type="tel"
          />
        </div>

      </div>


      <div className="p-4 border rounded-md bg-white space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Address</h2>

        <div>
          <label className="text-sm text-slate-600 block mb-1">Address Line 1</label>
          <input
            className="border border-slate-300 p-2 rounded w-full"
            value={form.addressLine1}
            onChange={e => updateField("addressLine1", e.target.value)}
            placeholder="Address line 1"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">City</label>
          <input
            className="border border-slate-300 p-2 rounded w-full"
            value={form.city}
            onChange={e => updateField("city", e.target.value)}
            placeholder="City"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">Postcode</label>
          <input
            className="border border-slate-300 p-2 rounded w-full"
            value={form.postcode}
            onChange={e => updateField("postcode", e.target.value)}
            placeholder="Postcode"
          />
        </div>

        {client.lat && client.lng ? (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <div className="text-sm">
              <span className="text-emerald-700 font-medium">✓ GPS Coordinates Available</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              {client.lat.toFixed(4)}, {client.lng.toFixed(4)}
            </div>
            <p className="text-xs text-emerald-700 mt-1">Walking routes can be generated for this address</p>
          </div>
        ) : (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-xs text-amber-700 font-medium">
              No GPS coordinates yet
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Save your address to trigger automatic geocoding
            </p>
          </div>
        )}

      </div>

      <div className="p-4 border rounded-md bg-white space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Personal Details</h2>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">Full Name</label>
          <input
            value={form.name}
            onChange={e => updateField("name", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            placeholder="Full name"
          />
        </div>
      </div>

      <div className="p-4 border rounded-md bg-white space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Emergency Contact</h2>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">Contact Name</label>
          <input
            value={form.emergencyContactName}
            onChange={e => updateField("emergencyContactName", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            placeholder="Contact name"
          />
        </div>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">Contact Phone</label>
          <input
            value={form.emergencyContactPhone}
            onChange={e => updateField("emergencyContactPhone", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            placeholder="Contact phone"
            type="tel"
          />
        </div>
      </div>

      <div className="p-4 border rounded-md bg-white space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Veterinary Details</h2>
        
        <div>
          <label className="text-sm text-slate-600 block mb-1">Vet Practice Information</label>
          <textarea
            value={form.vetDetails}
            onChange={e => updateField("vetDetails", e.target.value)}
            className="w-full border border-slate-300 p-2 rounded"
            rows={3}
            placeholder="Vet practice name, phone number, and address"
          />
          <p className="text-xs text-slate-500 mt-1">Include practice name, phone, and address for emergencies</p>
        </div>
      </div>

      <div className="p-4 border rounded-md bg-white">
        <p className="font-medium">Dogs</p>

        {dogs.length === 0 && (
          <p className="text-sm text-slate-600">No dogs listed.</p>
        )}

        <ul className="mt-2 space-y-1">
          {dogs.map(d => (
            <li key={d.dogId || d.id} className="text-sm text-slate-700">
              {d.name} — {d.breed}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <button
          className="w-full bg-teal-700 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full border border-slate-400 text-slate-700 p-3 rounded"
        >
          Log Out
        </button>
      </div>

    </div>
  );
}
