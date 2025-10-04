import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

function todayISO(){ return new Date().toISOString().slice(0,10); }
function plusDays(iso, n){ const d=new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

export default function BookingAuto({ ownerId='o_demo_owner', petId='p_demo_pet', onBack }){
  const [owner, setOwner] = useState({ id: ownerId, name:'Demo Owner', city:'Beaconsfield', postcode:'HP9', email:'demo@user.test' });
  const [pet, setPet] = useState({ id: petId, name:'Hector', type:'Dog', notes:'' });
  const [serviceKey, setServiceKey] = useState('homevisit');
  const [fromISO, setFromISO] = useState(todayISO());
  const [toISO, setToISO] = useState(plusDays(todayISO(), 2));
  const [budget, setBudget] = useState(30);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  async function ensureOwner(){
    await fetch(`${API_BASE}/owners`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(owner) });
  }

  async function autoAssign(){
    await ensureOwner();
    const r = await fetch(`${API_BASE}/bookings/auto-assign`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ownerId: owner.id, owner, serviceKey, fromISO, toISO, budget })
    }).then(r=>r.json());
    setResult(r);
  }

  async function confirm(sitterId, priceQuoted){
    setConfirming(true);
    const r = await fetch(`${API_BASE}/bookings`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ownerId: owner.id, petId: pet.id, sitterId, serviceKey, fromISO, toISO, priceQuoted })
    }).then(r=>r.json());
    setConfirming(false);
    setConfirmed(r.booking);
  }

  useEffect(()=>{ autoAssign(); }, []);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
        <h2 className="text-xl font-semibold">Auto booking</h2>
        <div />
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
        <div className="font-medium">Your details</div>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Your full name"
                 value={owner.name} onChange={e=>setOwner({...owner, name:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="Email"
                 value={owner.email} onChange={e=>setOwner({...owner, email:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="City"
                 value={owner.city} onChange={e=>setOwner({...owner, city:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="Postcode"
                 value={owner.postcode} onChange={e=>setOwner({...owner, postcode:e.target.value})}/>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Service</label>
            <select className="border rounded px-3 py-2 w-full" value={serviceKey} onChange={e=>setServiceKey(e.target.value)}>
              <option value="homevisit">One home visit a day</option>
              <option value="walk">Dog Walking</option>
              <option value="daycare">Doggy Day Care</option>
            </select>
          </div>
          <div>
            <label className="text-sm">From</label>
            <input type="date" className="border rounded px-3 py-2 w-full" value={fromISO} onChange={e=>setFromISO(e.target.value)}/>
          </div>
          <div>
            <label className="text-sm">To</label>
            <input type="date" className="border rounded px-3 py-2 w-full" value={toISO} onChange={e=>setToISO(e.target.value)}/>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Budget (£ per unit)</label>
            <input type="number" className="border rounded px-3 py-2 w-full" value={budget} onChange={e=>setBudget(Number(e.target.value||0))}/>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={autoAssign}>Find a Companion</button>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <div className="font-medium mb-3">Recommended Companion</div>
        {!result ? (
          <div>Working out the best match…</div>
        ) : !result.assigned ? (
          <div>No available Companion meets the criteria. Try different dates or service.</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{result.assigned.name}</div>
                <div className="text-slate-600 text-sm">Score {Math.round(result.assigned.score.total*100)} / 100</div>
                <div className="text-sm text-slate-600">
                  Locality:{' '}
                  {Math.round(result.assigned.score.parts.locality*100)} · Reputation:{' '}
                  {Math.round(result.assigned.score.parts.rep*100)} · Verification:{' '}
                  {Math.round(result.assigned.score.parts.ver*100)} · Price fit:{' '}
                  {Math.round(result.assigned.score.parts.priceFit*100)} · Recency:{' '}
                  {Math.round(result.assigned.score.parts.recency*100)}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Service: £{result.assigned.score.price} · {result.request.serviceKey}
                </div>
              </div>
              <button
                disabled={confirming}
                className="px-4 py-2 rounded bg-emerald-600 text-white whitespace-nowrap"
                onClick={()=>confirm(result.assigned.id, result.assigned.score.price)}
              >
                {confirming ? 'Confirming…' : 'Confirm & create booking'}
              </button>
            </div>

            {result.alternates?.length ? (
              <div className="mt-4">
                <div className="font-medium mb-1">Alternatives</div>
                <div className="space-y-2">
                  {result.alternates.map(a=>(
                    <div key={a.id} className="flex items-center justify-between border rounded-xl p-3">
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-sm text-slate-600">
                          Score {Math.round(a.score.total*100)} / 100 · £{a.score.price}
                        </div>
                      </div>
                      <button className="px-3 py-1 rounded bg-slate-200"
                              onClick={()=>confirm(a.id, a.score.price)}>Pick</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {confirmed ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4">
          <div className="font-semibold">Booking created</div>
          <div className="text-sm text-emerald-800">Reference: {confirmed.id}</div>
        </div>
      ) : null}
    </div>
  );
}
