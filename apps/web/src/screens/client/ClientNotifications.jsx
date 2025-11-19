import { useEffect, useState } from "react";
import {
  loadNotifications,
  markAllRead
} from "../../lib/clientNotifications";

export function ClientNotifications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(loadNotifications());
    markAllRead();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>

      {list.length === 0 && (
        <div className="bg-white border rounded-lg p-8 text-center">
          <p className="text-slate-600">No notifications yet.</p>
          <p className="text-sm text-slate-500 mt-1">
            You'll be notified here when your bookings are approved or declined.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {list.map((n) => (
          <div
            key={n.id}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <p className="text-slate-900">{n.message}</p>
            <p className="text-xs text-slate-500 mt-2">
              {new Date(n.createdAt).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
