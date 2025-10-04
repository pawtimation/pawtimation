import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'

function Card({children}){ return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div> }

export function BrowseSitters({ onBack }){
  const [tier, setTier] = useState('TRAINEE')
  const [list, setList] = useState([])
  const [postcode, setPostcode] = useState('HP20')

  async function load(){
    const j = await (await fetch(`${API_BASE}/sitters/search?tier=${tier}&postcode=${encodeURIComponent(postcode)}`)).json()
    setList(j.results||[])
  }
  useEffect(()=>{ load() }, [tier])

  return (
    <div className="space-y-4">
      <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      <Card>
        <h2 className="text-xl font-semibold mb-2">Marketplace Pet Companions</h2>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <label className="text-sm">Tier:</label>
          <select className="border rounded px-2 py-1" value={tier} onChange={e=>setTier(e.target.value)}>
            <option>TRAINEE</option><option>VERIFIED</option><option>PRO</option>
          </select>
          <input className="border rounded px-3 py-1 ml-2" value={postcode} onChange={e=>setPostcode(e.target.value)} placeholder="Postcode"/>
          <button className="px-3 py-1 bg-brand-blue text-white rounded font-medium" onClick={load}>Search</button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {list.map(s=>(
            <div key={s.id} className="rounded-xl border border-slate-200 p-4 bg-white flex items-start justify-between">
              <div>
                <div className="font-semibold text-lg">{s.name} <span className="text-xs ml-2 px-2 py-0.5 bg-slate-100 rounded">{s.tier}</span></div>
                <div className="text-slate-600 text-sm">{s.postcode} • ⭐ {s.rating} ({s.reviews})</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">£{(s.ratePerDay/100).toFixed(0)}/day</div>
                <button className="mt-1 px-3 py-1 bg-brand-blue text-white rounded text-sm font-medium" onClick={()=>window.location.hash='#/trust'}>View Profile</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
