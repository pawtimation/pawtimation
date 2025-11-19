import React from 'react';
import { Link } from 'react-router-dom';

export function ClientBookings() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">My Bookings</h1>
        <Link to="/client/book" className="btn btn-primary btn-sm">
          Request booking
        </Link>
      </div>
      <div className="card">
        <p className="text-sm text-slate-600">
          Enhanced bookings view coming soon. Use the dashboard to view your current bookings.
        </p>
      </div>
    </div>
  );
}
