import React from 'react';
export function OwnerStart({ onBack, onSignIn, onCreate }) {
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">For Pet Owners</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>
      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <p className="text-slate-700">Add your pet, invite a trusted friend, or book a vetted Pet Companion. Daily photos, tidy AI diary summaries, vet chat (Plus/Premium), and clear UK-style policies.</p>
        <ul className="list-disc pl-5 text-slate-700 text-sm">
          <li>Friends channel (£15/day) or Pros with insurance</li>
          <li>Live arrival/departure tracking</li>
          <li>Transparent agreements & cancellation rules</li>
        </ul>
        <div className="flex gap-3 pt-2">
          <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={onSignIn}>Sign in</button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={onCreate}>Create account</button>
        </div>
      </div>
    </div>
  );
}
