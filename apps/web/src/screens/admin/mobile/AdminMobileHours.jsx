import { useEffect, useState } from "react";
import { adminApi } from '../../../lib/auth';
import { TimePicker } from '../../../components/TimePicker';

const days = ["mon","tue","wed","thu","fri","sat","sun"];

export function AdminMobileHours() {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState({});

  async function load() {
    setLoading(true);
    try {
      const res = await adminApi("/business/settings");
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
      const res = await adminApi("/business/settings/update", {
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
          <div key={day} className="p-4 border rounded bg-white space-y-3">

            <p className="font-medium capitalize">{day}</p>

            <TimePicker
              value={hours[day]?.open || ""}
              onChange={v => update(day, "open", v)}
              placeholder="Opening time"
              className="w-full"
            />

            <TimePicker
              value={hours[day]?.close || ""}
              onChange={v => update(day, "close", v)}
              placeholder="Closing time"
              className="w-full"
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
