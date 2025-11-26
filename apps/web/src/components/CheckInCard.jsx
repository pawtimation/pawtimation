import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { isMapsEnabled } from '../lib/mapsEnabled'

export function CheckInCard({ bookingId }){
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  async function load(){
    const r = await fetch(`${API_BASE}/bookings/${bookingId}/attendance`)
    if(r.ok){ setStatus(await r.json()) }
  }
  useEffect(()=>{ if(bookingId) load() }, [bookingId])

  async function getLoc(){
    if (!isMapsEnabled()) {
      console.log('[CHECKIN] GPS collection disabled - VITE_ENABLE_MAPS=false');
      return { lat: null, lng: null };
    }
    
    return new Promise((resolve, reject)=>{
      if(!navigator.geolocation) return resolve({ lat: null, lng: null })
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => {
          console.log('[CHECKIN] Geolocation error, using null coords:', err.message);
          resolve({ lat: null, lng: null })
        },
        { enableHighAccuracy:true, timeout:10000 }
      )
    })
  }

  async function send(kind){
    try{
      setBusy(true)
      const { lat, lng } = await getLoc()
      const r = await fetch(`${API_BASE}/bookings/${bookingId}/${kind}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ lat, lng })
      })
      if(r.ok){ await load() }
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-white">
      <h3 className="font-semibold">Arrival / Departure</h3>
      {!status && <div className="text-sm text-slate-600 mt-1">Loading…</div>}
      {status && (
        <>
          <div className="text-sm text-slate-700 mt-1">
            <div>Arrived: <b>{status.checkin ? status.checkin.ts : '—'}</b></div>
            <div>Departed: <b>{status.checkout ? status.checkout.ts : '—'}</b></div>
            <div>Duration: <b>{status.durationMinutes ?? '—'} min</b></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button disabled={busy || !!status.checkin} onClick={()=>send('checkin')}
              className={`px-3 py-1 rounded text-white ${status?.checkin ? 'bg-slate-400' : 'bg-emerald-600 hover:opacity-95'}`}>
              {status?.checkin ? 'Arrived' : 'Mark arrival'}
            </button>
            <button disabled={busy || !status.checkin || !!status.checkout} onClick={()=>send('checkout')}
              className={`px-3 py-1 rounded text-white ${status?.checkout ? 'bg-slate-400' : 'bg-rose-600 hover:opacity-95'}`}>
              {status?.checkout ? 'Departed' : 'Mark departure'}
            </button>
          </div>
          {isMapsEnabled() && (
            <p className="text-xs text-slate-500 mt-2">We store approximate GPS (±100m) and auto-clear after 7 days.</p>
          )}
        </>
      )}
    </div>
  )
}
