import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { ImageUpload } from '../components/ImageUpload.jsx';

export function PetManager({ ownerId='owner_demo', onBack }){
  const [pets, setPets] = useState([]);
  const [edit, setEdit] = useState(null);

  async function load(){ const r = await fetch(`${API_BASE}/owners/${ownerId}/pets`); const j = await r.json(); setPets(j.pets||[]); }
  useEffect(()=>{ load(); }, [ownerId]);

  function startNew(){ setEdit({ name:'', species:'Dog', breed:'', age:'', weightKg:'', notes:'', avatarUrl:'', vet:{name:'',phone:''}, behaviour:{recall:true,anxious:false,goodWithDogs:true}, medical:{allergies:'',meds:''} }); }
  function cancel(){ setEdit(null); }

  async function save(){
    if (!edit.id){
      await fetch(`${API_BASE}/owners/${ownerId}/pets`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(edit) });
    } else {
      await fetch(`${API_BASE}/owners/${ownerId}/pets/${edit.id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(edit) });
    }
    setEdit(null); await load();
  }

  async function remove(p){ if(!confirm('Delete this pet?')) return; await fetch(`${API_BASE}/owners/${ownerId}/pets/${p.id}`, { method:'DELETE' }); await load(); }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">Your pets</h2>
        <button className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={startNew}>Add pet</button>
      </div>

      {!edit && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          {pets.length===0 && <div className="text-slate-500">No pets yet. Click "Add pet".</div>}
          <div className="divide-y">
            {pets.map(p=>(
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={p.avatarUrl||'https://placehold.co/64x64'} alt="" className="w-12 h-12 rounded object-cover border"/>
                  <div>
                    <div className="font-medium">{p.name} <span className="text-slate-500 text-sm">({p.species})</span></div>
                    <div className="text-xs text-slate-500">{p.breed}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300" onClick={()=>setEdit(p)}>Edit</button>
                  <button className="px-3 py-1 bg-rose-600 text-white rounded hover:bg-rose-700" onClick={()=>remove(p)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {edit && (
        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/>
            <input className="border rounded px-3 py-2" placeholder="Species" value={edit.species} onChange={e=>setEdit({...edit,species:e.target.value})}/>
            <input className="border rounded px-3 py-2" placeholder="Breed" value={edit.breed} onChange={e=>setEdit({...edit,breed:e.target.value})}/>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Age" value={edit.age} onChange={e=>setEdit({...edit,age:e.target.value})}/>
            <input className="border rounded px-3 py-2" placeholder="Weight (kg)" value={edit.weightKg} onChange={e=>setEdit({...edit,weightKg:e.target.value})}/>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pet Photo</label>
            <ImageUpload 
              currentImageUrl={edit.avatarUrl}
              onImageUploaded={(url) => setEdit({...edit, avatarUrl: url})}
              label="Upload Photo"
            />
          </div>
          <div>
            <label className="text-sm">Notes for carers</label>
            <textarea className="border rounded w-full px-3 py-2" rows={3} value={edit.notes} onChange={e=>setEdit({...edit,notes:e.target.value})}/>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Vet name" value={edit.vet.name} onChange={e=>setEdit({...edit,vet:{...edit.vet,name:e.target.value}})}/>
            <input className="border rounded px-3 py-2" placeholder="Vet phone" value={edit.vet.phone} onChange={e=>setEdit({...edit,vet:{...edit.vet,phone:e.target.value}})}/>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Allergies" value={edit.medical.allergies} onChange={e=>setEdit({...edit,medical:{...edit.medical,allergies:e.target.value}})}/>
            <input className="border rounded px-3 py-2" placeholder="Medication" value={edit.medical.meds} onChange={e=>setEdit({...edit,medical:{...edit.medical,meds:e.target.value}})}/>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!edit.behaviour.recall} onChange={e=>setEdit({...edit,behaviour:{...edit.behaviour,recall:e.target.checked}})}/> Good recall
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!edit.behaviour.goodWithDogs} onChange={e=>setEdit({...edit,behaviour:{...edit.behaviour,goodWithDogs:e.target.checked}})}/> Good with dogs
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!edit.behaviour.anxious} onChange={e=>setEdit({...edit,behaviour:{...edit.behaviour,anxious:e.target.checked}})}/> Anxious
            </label>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700" onClick={save}>Save pet</button>
            <button className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
