import React from 'react';

export function StaffAvailability() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My availability</h1>
      <p className="text-sm text-slate-600">
        This screen will let you manage a weekly schedule (for example Monday to Friday,
        9 to 5) and one-off overrides on a calendar (days off, holidays, special cases).
      </p>
      <p className="text-sm text-slate-600">
        The booking system will use this information to make sure new jobs are only
        scheduled when you are available.
      </p>
    </div>
  );
}
