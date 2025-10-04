import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'

export function OwnerOnboarding({ onDone, onFriends, onSitters }){
  const [email, setEmail] = useState('owner@example.com')
  const [pet, setPet] = useState({ name:'H', breed:'', age:'', notes:'' })
  const [pets, setPets] = useState([])

  async function load(){ const r=await fetch(`${API_BASE}/owners/${encodeURIComponent(email)}/pets`); const j=await r.json(); setPets(j.pets||[]) }
  useEffect(()=>{ load() },[])

  async function addPet(e){
    e.preventDefault()
    const r = await fetch(`${API_BASE}/owners/${encodeURIComponent(email)}/pets`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(pet)
    }); if(r.ok){ setPet({ name:'', breed:'', age:'', notes:'' }); await load() }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-xl font-semibold">Add your pet</h2>
        <form className="grid md:grid-cols-2 gap-3 mt-2" onSubmit={addPet}>
          <div><label className="block text-sm">Owner email</label>
            <input className="border rounded px-3 py-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div><label className="block text-sm">Name</label>
            <input required className="border rounded px-3 py-2 w-full" value={pet.name} onChange={e=>setPet({...pet, name:e.target.value})} />
          </div>
          <div><label className="block text-sm">Breed</label>
            <input className="border rounded px-3 py-2 w-full" value={pet.breed} onChange={e=>setPet({...pet, breed:e.target.value})} />
          </div>
          <div><label className="block text-sm">Age</label>
            <input className="border rounded px-3 py-2 w-full" value={pet.age} onChange={e=>setPet({...pet, age:e.target.value})} />
          </div>
          <div className="md:col-span-2"><label className="block text-sm">Notes</label>
            <textarea className="border rounded px-3 py-2 w-full" value={pet.notes} onChange={e=>setPet({...pet, notes:e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Add pet</button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold mb-2">Your pets</h3>
        {pets.length===0 ? <div className="text-slate-600 text-sm">No pets yet.</div> :
          <ul className="grid md:grid-cols-2 gap-3">
            {pets.map(p=>(
              <li key={p.id} className="border rounded p-3">
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-600">{p.breed} {p.age && `• ${p.age}`}</div>
                {p.notes && <div className="text-xs text-slate-500 mt-1">{p.notes}</div>}
              </li>
            ))}
          </ul>
        }
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={onFriends}>Invite a Friend</button>
        <button className="px-4 py-2 bg-sky-600 text-white rounded-lg" onClick={onSitters}>Browse Sitters</button>
        <button className="px-4 py-2 bg-slate-800 text-white rounded-lg" onClick={onDone}>Back to landing</button>
      </div>
    </div>
  )
}
