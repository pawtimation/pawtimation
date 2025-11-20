import { useEffect, useState } from "react";
import { api, auth } from "../../../lib/auth";

export function AdminMobileBusinessDetails() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});

  async function load() {
    setLoading(true);
    try {
      const res = await api("/business/settings");
      if (res.ok) {
        const data = await res.json();
        setForm(data.profile || {});
      }
    } catch (err) {
      console.error("Load error", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    try {
      const res = await api("/business/settings/update", {
        method: "POST",
        body: JSON.stringify({ profile: form })
      });
      if (res.ok) {
        if (form.businessName && auth.user) {
          auth.user = {
            ...auth.user,
            businessName: form.businessName
          };
        }
        alert("Saved.");
        window.location.reload();
      } else {
        alert("Save failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Save failed.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">Business Details</h1>

      <div className="p-4 border bg-white rounded-md space-y-3">

        <div>
          <label className="text-sm text-slate-600">Business Name</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.businessName || ""}
            onChange={e => updateField("businessName", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Contact Email</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.contactEmail || ""}
            onChange={e => updateField("contactEmail", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Phone</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.contactPhone || ""}
            onChange={e => updateField("contactPhone", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Address Line 1</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.addressLine1 || ""}
            onChange={e => updateField("addressLine1", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">City</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.city || ""}
            onChange={e => updateField("city", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Postcode</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={form.postcode || ""}
            onChange={e => updateField("postcode", e.target.value)}
          />
        </div>

      </div>

      <button
        onClick={save}
        className="w-full bg-teal-700 text-white p-3 rounded"
      >
        Save Changes
      </button>

    </div>
  );
}
