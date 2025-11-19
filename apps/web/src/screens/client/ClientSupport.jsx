import React from 'react';

export function ClientSupport() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Support & Help</h1>
      <div className="card space-y-3">
        <div>
          <h2 className="text-sm font-semibold mb-2">Need help?</h2>
          <p className="text-sm text-slate-600">
            Contact your dog walker directly for any questions about bookings, services, or your account.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold mb-2">Common questions</h2>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• How do I request a booking? Use the &quot;Request booking&quot; button on your dashboard.</li>
            <li>• How do I view my invoices? Navigate to the Invoices section in the menu.</li>
            <li>• How do I update my profile? Contact your walker to update your contact details.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
