import React from 'react';
export function CompanionStart({ onBack, onSignIn, onCreate }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">For Pet Companions</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-slate-700">Earn by offering day care, walks or boarding. Start as a Trainee or upgrade to Pro by uploading documents (licence, insurance, ID). Stripe payouts supported.</p>
        <ul className="list-disc pl-5 text-slate-700 text-sm">
          <li>Own profile with bio, photos & services</li>
          <li>Verification: Trainee → Pro (documents & checks)</li>
          <li>Bookings, messages and calendar (coming)</li>
        </ul>
        <div className="flex gap-3 pt-2">
          <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={onSignIn}>Sign in</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={onCreate}>Create account</button>
        </div>
      </div>
    </div>
  );
}
