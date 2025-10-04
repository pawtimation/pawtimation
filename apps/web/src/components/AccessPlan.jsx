import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'

export function AccessPlan({ bookingId }){
  const [plan, setPlan] = useState(null)
  const [method, setMethod] = useState('IN_PERSON')
  const [lockboxCode, setLockboxCode] = useState('')

  async function load(){ const r = await fetch(`${API_BASE}/bookings/${bookingId}/access-plan`); const j = await r.json(); setPlan(j.plan) }
  useEffect(()=>{ if(bookingId) load() }, [bookingId])

  async function save(){
    const r = await fetch(`${API_BASE}/bookings/${bookingId}/access-plan`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ method, lockboxCode })
    }); const j = await r.json(); setPlan(j.plan)
  }
  async function confirm(type){
    const r = await fetch(`${API_BASE}/bookings/${bookingId}/key/confirm`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type })
    }); const j = await r.json(); setPlan(j.plan)
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-white">
      <h3 className="font-semibold">Key handover</h3>
      {!plan && (
        <div className="mt-2 space-y-2">
          <div className="text-sm text-slate-600">Choose how keys are exchanged for this booking.</div>
          <div className="flex items-center gap-2">
            <select className="border rounded px-2 py-1" value={method} onChange={e=>setMethod(e.target.value)}>
              <option value="IN_PERSON">In-person</option>
              <option value="LOCKBOX">Lockbox</option>
            </select>
            {method==='LOCKBOX' && (
              <input className="border rounded px-2 py-1" placeholder="Lockbox code" value={lockboxCode} onChange={e=>setLockboxCode(e.target.value)} />
            )}
            <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={save}>Save plan</button>
          </div>
        </div>
      )}
      {plan && (
        <div className="mt-2">
          <div className="text-sm">Method: <b>{plan.method}</b> • Status: <b>{plan.status}</b></div>
          {plan.method==='LOCKBOX' && <div className="text-xs text-slate-500 mt-1">Code: {plan.lockboxCode||'—'}</div>}
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 bg-sky-700 text-white rounded" onClick={()=>confirm('COLLECT')}>Mark collected</button>
            <button className="px-3 py-1 bg-slate-800 text-white rounded" onClick={()=>confirm('RETURN')}>Mark returned</button>
          </div>
        </div>
      )}
    </div>
  )
}
