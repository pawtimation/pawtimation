import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export function AdminMobilePolicies() {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState({});

  async function load() {
    setLoading(true);
    try {
      const data = await api.get("/business/settings");
      setPolicies(data.policies || {});
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update(k, v) {
    setPolicies(prev => ({ ...prev, [k]: v }));
  }

  async function save() {
    try {
      await api.post("/business/settings/update", { policies });
      alert("Saved.");
    } catch (err) {
      alert("Error saving.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">Policies</h1>

      <div className="p-4 border bg-white rounded-md space-y-4">

        <div>
          <label className="text-sm text-slate-600">Cancellation Window (hours)</label>
          <input
            type="number"
            value={policies.cancellationWindow || ""}
            onChange={e => update("cancellationWindow", e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">Payment Terms (days)</label>
          <input
            type="number"
            value={policies.paymentTerms || ""}
            onChange={e => update("paymentTerms", e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>

      </div>

      <button
        onClick={save}
        className="w-full bg-teal-700 text-white p-3 rounded"
      >
        Save Policies
      </button>
    </div>
  );
}
