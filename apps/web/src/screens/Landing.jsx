import React from 'react'
import { Paw } from '../ui/Paw'

export function Landing({ onOwner, onSitter }){
  return (
    <div className="grid md:grid-cols-2 gap-6 mt-2">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3">
          <Paw className="w-8 h-8"/>
          <h2 className="text-2xl font-bold">I'm a Pet Owner</h2>
        </div>
        <p className="text-slate-600 mt-2">
          Add your pet, invite a trusted friend for £15/day, or book a vetted sitter. Daily photos and tidy AI diary updates included.
        </p>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={onOwner}>Get started</button>
        </div>
        <ul className="mt-4 text-sm text-slate-600 list-disc pl-5">
          <li>Friends or Pros</li>
          <li>Transparent agreements & cancellation</li>
          <li>Arrival / Departure tracking</li>
        </ul>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-3">
          <Paw className="w-8 h-8"/>
          <h2 className="text-2xl font-bold">I'm a Sitter</h2>
        </div>
        <p className="text-slate-600 mt-2">
          Create your profile, sign agreements, set your rates and services. We'll show you local owners and friends' invites.
        </p>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-sky-600 text-white" onClick={onSitter}>Open dashboard</button>
        </div>
        <ul className="mt-4 text-sm text-slate-600 list-disc pl-5">
          <li>Simple onboarding checklist</li>
          <li>Agreements visible to owners</li>
          <li>Stripe Connect payouts (stub for now)</li>
        </ul>
      </div>
    </div>
  )
}
