import { useEffect, useState } from "react";
import { api } from "../../../lib/auth";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

export function AdminMobileCalendar() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadJobs(date) {
    setLoading(true);
    try {
      const res = await api(
        `/bookings/by-date?date=${date.format("YYYY-MM-DD")}`
      );
      if (!res.ok) {
        console.error("Failed to fetch jobs");
        setJobs([]);
        return;
      }
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Calendar load error:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(selectedDate);
  }, [selectedDate]);

  function changeDay(offset) {
    setSelectedDate(prev => prev.add(offset, "day"));
  }

  return (
    <div className="space-y-4">

      {/* Top date navigation */}
      <div className="flex items-center justify-between">
        <button
          className="text-slate-700 px-2"
          onClick={() => changeDay(-1)}
        >
          ←
        </button>

        <div className="text-lg font-semibold">
          {selectedDate.format("dddd, D MMM")}
        </div>

        <button
          className="text-slate-700 px-2"
          onClick={() => changeDay(1)}
        >
          →
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <p className="text-sm text-slate-600">Loading jobs…</p>
      )}

      {/* Job list */}
      <div className="space-y-3">
        {!loading && jobs.length === 0 && (
          <p className="text-sm text-slate-600">No jobs for this day.</p>
        )}

        {jobs.map(job => (
          <Link
            key={job.bookingId}
            to={`/admin/m/jobs/${job.bookingId}`}
          >
            <div className="p-4 border rounded-md bg-white">
              <p className="font-medium text-sm">{job.clientName}</p>
              <p className="text-sm text-slate-600">
                {job.serviceName} • {job.startTimeFormatted}
              </p>
              <p className="text-xs text-slate-500">
                {job.addressLine1}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
