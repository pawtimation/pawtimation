import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export function AdminMobileBranding() {
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState({});

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/business/settings");
      setBranding(data.branding || {});
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update(k, v) {
    setBranding(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    try {
      await api.post("/business/settings/update", { branding });
      alert("Saved.");
    } catch (err) {
      alert("Error saving.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">Branding</h1>

      <div className="p-4 border bg-white rounded-md space-y-4">

        <div>
          <label className="text-sm text-slate-600">Primary Colour (hex)</label>
          <input
            value={branding.primaryColor || ""}
            onChange={e => update("primaryColor", e.target.value)}
            className="border p-2 rounded w-full mt-1"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={branding.showPoweredBy || false}
            onChange={e => update("showPoweredBy", e.target.checked)}
          />
          <label className="text-sm text-slate-700">
            Show "Powered by Pawtimation"
          </label>
        </div>

      </div>

      <button
        onClick={save}
        className="w-full bg-teal-700 text-white p-3 rounded"
      >
        Save Branding
      </button>

    </div>
  );
}
