import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { AccessPlan } from '../components/AccessPlan'

export function BookingFeed({ bookingId, onBack }){
  const [feed, setFeed] = useState(null)
  const [text, setText] = useState('Had a happy walk in the park.')
  const [type, setType] = useState('NOTE')

  useEffect(()=>{ if(!bookingId) return; fetch(`${API_BASE}/bookings/${bookingId}/feed`).then(r=>r.json()).then(setFeed) },[bookingId])
  async function postUpdate(){
    await fetch(`${API_BASE}/bookings/${bookingId}/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, text }) })
    setFeed(await (await fetch(`${API_BASE}/bookings/${bookingId}/feed`)).json())
  }

  if(!feed) return <div className="p-5 bg-white rounded shadow-card">Loading feed…</div>
  const { booking, updates } = feed
  return (
    <div className="mt-6 space-y-4">
      <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      <div className="p-5 bg-white rounded shadow-card">
        <h2 className="text-xl font-semibold">{booking.petName} — Daily Updates</h2>
        <p className="text-slate-600">From {booking.startDate} to {booking.endDate}</p>
      </div>

      <AccessPlan bookingId={bookingId} />

      <div className="p-5 bg-white rounded shadow-card">
        <h3 className="font-semibold mb-2">Post test update (sitter view)</h3>
        <div className="flex gap-2 items-center">
          <select className="border rounded px-2 py-1" value={type} onChange={e=>setType(e.target.value)}>
            <option>NOTE</option><option>MEAL</option><option>WALK</option><option>MEDS</option>
          </select>
          <input className="flex-1 border rounded px-3 py-2" value={text} onChange={e=>setText(e.target.value)} />
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={postUpdate}>Post</button>
        </div>
      </div>

      <div className="p-5 bg-white rounded shadow-card">
        <h3 className="font-semibold mb-3">Feed</h3>
        <div className="space-y-3">{updates.map((u,i)=>(<div key={i} className="border rounded p-3">
          <div className="text-xs text-slate-500">{u.ts} • {u.type}</div>
          <div className="mt-1">{u.text}</div>
          <div className="mt-2 p-2 bg-slate-50 rounded">{u.aiDiary}</div></div>))}</div>
      </div>
    </div>
  )
}
