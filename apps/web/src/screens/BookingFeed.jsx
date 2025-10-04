import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { AccessPlan } from '../components/AccessPlan'
import { CheckInCard } from '../components/CheckInCard'
import { NotificationCenter } from '../components/NotificationCenter'
import { ArrowLeft } from '../components/Icons'

export function BookingFeed({ bookingId, onBack, onReportIncident }){
  const [feed, setFeed] = useState(null)
  const [text, setText] = useState('Had a happy walk in the park.')
  const [type, setType] = useState('NOTE')
  const [pawGiven, setPawGiven] = useState(false)

  useEffect(()=>{ if(!bookingId) return; fetch(`${API_BASE}/bookings/${bookingId}/feed`).then(r=>r.json()).then(setFeed) },[bookingId])
  async function postUpdate(){
    await fetch(`${API_BASE}/bookings/${bookingId}/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, text }) })
    setFeed(await (await fetch(`${API_BASE}/bookings/${bookingId}/feed`)).json())
  }

  async function givePaw(){
    if(!feed?.booking?.ownerEmail || !feed?.booking?.sitterId) return
    
    const r = await fetch(`${API_BASE}/preferences/paw`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerEmail: feed.booking.ownerEmail,
        sitterId: feed.booking.sitterId
      })
    })
    
    if(r.ok){
      setPawGiven(true)
      setTimeout(() => setPawGiven(false), 3000)
    }
  }

  if(!feed) return <div className="p-5 bg-white rounded shadow-card">Loading feed…</div>
  const { booking, updates } = feed
  return (
    <div className="mt-6 space-y-4">
      <button className="flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded transition-colors" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      <div className="p-5 bg-white rounded shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{booking.petName} — Daily Updates</h2>
            <p className="text-slate-600">From {booking.startDate} to {booking.endDate}</p>
            {booking.sitterName && <p className="text-sm text-slate-500 mt-1">Companion: {booking.sitterName}</p>}
          </div>
          {booking.sitterId && booking.ownerEmail && onReportIncident && (
            <button 
              onClick={() => onReportIncident({
                bookingId: booking.id,
                sitterId: booking.sitterId,
                sitterName: booking.sitterName,
                ownerEmail: booking.ownerEmail
              })}
              className="px-3 py-2 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition"
            >
              🚨 Report Violation
            </button>
          )}
        </div>
      </div>

      <AccessPlan bookingId={bookingId} />

      <CheckInCard bookingId={bookingId} />

      <NotificationCenter bookingId={bookingId} />

      <div className="p-5 bg-white rounded shadow-card">
        <h3 className="font-semibold mb-2">Post test update (companion view)</h3>
        <div className="flex gap-2 items-center">
          <select className="border rounded px-2 py-1" value={type} onChange={e=>setType(e.target.value)}>
            <option>NOTE</option><option>MEAL</option><option>WALK</option><option>MEDS</option>
          </select>
          <input className="flex-1 border rounded px-3 py-2" value={text} onChange={e=>setText(e.target.value)} />
          <button className="px-3 py-2 bg-brand-green text-white rounded font-medium" onClick={postUpdate}>Post</button>
        </div>
      </div>

      <div className="p-5 bg-white rounded shadow-card">
        <h3 className="font-semibold mb-3">Feed</h3>
        <div className="space-y-3">{updates.map((u,i)=>(<div key={i} className="border rounded p-3">
          <div className="text-xs text-slate-500">{u.ts} • {u.type}</div>
          <div className="mt-1">{u.text}</div>
          <div className="mt-2 p-2 bg-slate-50 rounded">{u.aiDiary}</div>
          <div className="mt-3 flex gap-2 items-center">
            <span className="text-xs text-slate-600">Quick react:</span>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-red-50 transition text-sm">❤️</button>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-yellow-50 transition text-sm">👍</button>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-blue-50 transition text-sm">😊</button>
            <button 
              onClick={givePaw}
              className="px-2 py-1 bg-white border border-brand-teal rounded hover:bg-brand-teal hover:text-white transition text-sm font-medium"
            >
              🐾 {pawGiven ? 'Priority set!' : 'Make Priority'}
            </button>
            <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-green-50 transition text-sm">✨</button>
          </div>
          {pawGiven && i === updates.length - 1 && (
            <div className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ This companion is now a priority for your future bookings!
            </div>
          )}
        </div>))}</div>
      </div>
    </div>
  )
}
