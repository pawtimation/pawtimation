import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";

const days = ["mon","tue","wed","thu","fri","sat","sun"];

export function AdminMobileHours() {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState({});

  async function load() {
    setLoading(true);
    try {
      const res = await api("/business/settings");
      if (res.ok) {
        const data = await res.json();
        setHours(data.hours || {});
      }
    } catch (err) {
      console.error("Load error", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update(day, field, value) {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  }

  async function save() {
    try {
      const res = await api("/business/settings/update", {
        method: "POST",
        body: JSON.stringify({ hours })
      });
      if (res.ok) {
        alert("Hours saved.");
      } else {
        alert("Error saving.");
      }
    } catch (err) {
      alert("Error saving.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="space-y-6">

      <h1 className="text-xl font-semibold">Working Hours</h1>

      <div className="space-y-3">
        {days.map(day => (
          <div key={day} className="p-4 border rounded bg-white space-y-1">

            <p className="font-medium capitalize">{day}</p>

            <label className="text-sm text-slate-600">Open</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={hours[day]?.open || ""}
              onChange={e => update(day, "open", e.target.value)}
            />

            <label className="text-sm text-slate-600">Close</label>
            <input
              type="time"
              className="border p-2 rounded w-full"
              value={hours[day]?.close || ""}
              onChange={e => update(day, "close", e.target.value)}
            />

          </div>
        ))}
      </div>

      <button
        onClick={save}
        className="w-full bg-teal-700 text-white p-3 rounded"
      >
        Save Hours
      </button>
    </div>
  );
}
