import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'

export function SitterDashboard({ sitterId='s1', onBack }){
  const [dash, setDash] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load(){
    setLoading(true)
    const r = await fetch(`${API_BASE}/sitters/${sitterId}/dashboard`)
    if(r.ok){
      const data = await r.json()
      setDash(data)
      if(data.sitter){
        const s = data.sitter
        setForm({
          name: s.name ?? '',
          postcode: s.postcode ?? '',
          bio: s.bio ?? '',
          services: (s.services ?? []).join(', '),
          ratePerDay: s.ratePerDay ?? ''
        })
      }
    }
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  async function save(){
    if(!form || loading) return
    setLoading(true)
    const body = {}
    if(form.name) body.name = form.name
    if(form.postcode) body.postcode = form.postcode
    if(form.bio) body.bio = form.bio
    if(form.services) body.services = form.services.split(',').map(s=>s.trim()).filter(Boolean)
    if(form.ratePerDay !== '') body.ratePerDay = Number(form.ratePerDay)
    await fetch(`${API_BASE}/sitters/${sitterId}/profile`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    await load()
  }

  if(!dash || !form) return <div className="p-5 bg-white rounded shadow-card">Loading…</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sitter dashboard</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-sm text-slate-600">Profile completion</div>
        <div className="mt-1 h-3 bg-slate-200 rounded">
          <div className="h-3 bg-emerald-600 rounded" style={{ width: `${dash.completion||0}%` }} />
        </div>
        {dash.tasks?.length>0 && (
          <ul className="list-disc pl-5 text-sm text-slate-700 mt-2">
            {dash.tasks.map((t,i)=><li key={i}>{t}</li>)}
          </ul>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold mb-2">Your profile</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <input placeholder="Name" className="border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input placeholder="Postcode" className="border rounded px-3 py-2" value={form.postcode} onChange={e=>setForm({...form, postcode:e.target.value})}/>
          <input placeholder="Services (comma separated)" className="border rounded px-3 py-2 md:col-span-2" value={form.services} onChange={e=>setForm({...form, services:e.target.value})}/>
          <textarea placeholder="Bio" className="border rounded px-3 py-2 md:col-span-2" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})}/>
          <input type="number" placeholder="Rate per day (pence)" className="border rounded px-3 py-2" value={form.ratePerDay} onChange={e=>setForm({...form, ratePerDay:e.target.value})}/>
          <div className="md:col-span-2">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" onClick={save} disabled={loading}>
              {loading ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold mb-2">Agreements</h3>
        <div className="text-sm text-slate-600">Your signed agreements appear here for owners.</div>
      </div>
    </div>
  )
}
