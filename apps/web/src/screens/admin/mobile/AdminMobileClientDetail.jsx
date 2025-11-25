import { useEffect, useState } from "react";
import { adminApi } from '../../../lib/auth';
import { useParams, Link } from "react-router-dom";

export function AdminMobileClientDetail() {
  const { clientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [dogs, setDogs] = useState([]);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    city: "",
    postcode: ""
  });

  async function load() {
    setLoading(true);
    
    try {
      const cRes = await adminApi(`/clients/${clientId}`);
      if (!cRes.ok) {
        if (cRes.status === 404) {
          setError("Client not found");
        } else if (cRes.status === 403) {
          setError("You don't have permission to view this client");
        } else {
          setError("Failed to load client");
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
        postcode: c.postcode || ""
      });

      const dRes = await adminApi(`/dogs/by-client/${clientId}`);
      if (dRes.ok) {
        const dogsData = await dRes.json();
        setDogs(Array.isArray(dogsData) ? dogsData : []);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError("An error occurred while loading the client");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [clientId]);

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function save() {
    try {
      const res = await adminApi(`/clients/${clientId}/update`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Unable to save changes: ${errData.error || "Unknown error"}`);
        return;
      }
      
      setEditing(false);
      load();
    } catch (err) {
      console.error("Save failed", err);
      alert("Unable to save changes. Please try again.");
    }
  }

  // Initial loading (no client data yet)
  if (loading && !client) {
    return <p className="text-sm text-slate-600">Loading client…</p>;
  }

  // Error with no client data (initial load failed)
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
        <Link
          to="/admin/m/clients"
          className="block text-center w-full border border-slate-300 text-slate-700 p-3 rounded"
        >
          Back to Clients
        </Link>
      </div>
    );
  }

  if (!client) {
    return <p className="text-sm text-slate-600">Client not found.</p>;
  }

  return (
    <div className="space-y-6">

      {/* Error banner (shown when reload fails but we have cached client data) */}
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

      {/* Reload indicator (shown when reloading with cached data) */}
      {loading && client && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-teal-800 text-sm">Reloading client data…</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <p className="text-sm text-slate-600">Client Profile</p>
      </div>

      {/* Contact info */}
      <div className="p-4 border rounded-md bg-white space-y-2">

        {/* Email */}
        <div>
          <label className="text-sm text-slate-600">Email</label>
          {editing ? (
            <input
              value={form.email}
              onChange={e => updateField("email", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          ) : (
            <p className="text-sm">{client.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm text-slate-600">Phone</label>
          {editing ? (
            <input
              value={form.phone}
              onChange={e => updateField("phone", e.target.value)}
              className="w-full border p-2 rounded mt-1"
            />
          ) : (
            <a href={`tel:${client.phone}`} className="text-sm underline text-teal-700">
              {client.phone}
            </a>
          )}
        </div>

      </div>


      {/* Address */}
      <div className="p-4 border rounded-md bg-white space-y-2">

        <label className="text-sm font-medium">Address</label>

        {editing ? (
          <>
            <input
              className="border p-2 rounded w-full mt-1"
              value={form.addressLine1}
              onChange={e => updateField("addressLine1", e.target.value)}
              placeholder="Address line 1"
            />
            <input
              className="border p-2 rounded w-full"
              value={form.city}
              onChange={e => updateField("city", e.target.value)}
              placeholder="City"
            />
            <input
              className="border p-2 rounded w-full"
              value={form.postcode}
              onChange={e => updateField("postcode", e.target.value)}
              placeholder="Postcode"
            />
            <p className="text-xs text-slate-500 mt-2">
              GPS coordinates will be automatically added when you save
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">{client.addressLine1}</p>
            <p className="text-sm">{client.city}</p>
            <p className="text-sm">{client.postcode}</p>
            {client.lat && client.lng ? (
              <>
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded">
                  <div className="text-sm">
                    <span className="text-emerald-700 font-medium">✓ GPS Coordinates Available</span>
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    {client.lat.toFixed(4)}, {client.lng.toFixed(4)}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">Walking routes can be generated for this client</p>
                </div>
                
                {/* Location Map */}
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">Location</p>
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <iframe
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${client.lng - 0.01},${client.lat - 0.01},${client.lng + 0.01},${client.lat + 0.01}&layer=mapnik&marker=${client.lat},${client.lng}`}
                      title="Client location map"
                    />
                  </div>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${client.lat}&mlon=${client.lng}#map=16/${client.lat}/${client.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-700 underline mt-1 inline-block"
                  >
                    View on OpenStreetMap
                  </a>
                </div>
              </>
            ) : (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <p className="text-xs text-amber-700">
                  No GPS coordinates - walking routes not available
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Edit the address to trigger automatic geocoding
                </p>
              </div>
            )}
            {client.addressLine1 && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(client.addressLine1 + " " + client.postcode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 underline mt-2 inline-block"
              >
                Open in Maps
              </a>
            )}
          </>
        )}

      </div>


      {/* Dogs */}
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

      {/* Buttons */}
      <div className="space-y-3">

        {!editing && (
          <button
            className="w-full bg-teal-700 text-white p-3 rounded"
            onClick={() => setEditing(true)}
          >
            Edit Client
          </button>
        )}

        {editing && (
          <>
            <button
              className="w-full bg-teal-700 text-white p-3 rounded"
              onClick={save}
            >
              Save Changes
            </button>

            <button
              className="w-full bg-slate-300 text-slate-800 p-3 rounded"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        )}

        <Link
          to={`/admin/messages?client=${client.clientId}`}
          className="block text-center w-full border border-teal-700 text-teal-700 p-3 rounded"
        >
          Message Client
        </Link>

        <Link
          to={`/admin/m/jobs?client=${client.clientId}`}
          className="block text-center w-full border border-slate-400 text-slate-700 p-3 rounded"
        >
          View Job History
        </Link>

      </div>

    </div>
  );
}
