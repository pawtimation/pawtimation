import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { BookingMatched } from './BookingMatched';

function todayISO(){ return new Date().toISOString().slice(0,10); }
function plusDays(iso, n){ const d=new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

export default function BookingAuto({ ownerId='o_demo_owner', petId='p_demo_pet', onBack, onSuccess }){
  const [owner, setOwner] = useState({ id: ownerId, name:'Demo Owner', city:'Beaconsfield', postcode:'HP9', email:'demo@user.test' });
  const [pet, setPet] = useState({ id: petId, name:'Hector', type:'Dog', notes:'' });
  const [serviceKey, setServiceKey] = useState('homevisit');
  const [fromISO, setFromISO] = useState(todayISO());
  const [toISO, setToISO] = useState(plusDays(todayISO(), 2));
  const [budget, setBudget] = useState(30);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [showMatched, setShowMatched] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [bookingRoute, setBookingRoute] = useState(null);
  const [userPlan, setUserPlan] = useState('FREE');

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

  function previewMatch(sitterId, priceQuoted){
    setSelectedMatch({ sitterId, priceQuoted });
    setShowMatched(true);
  }

  async function confirmBooking(){
    if (!selectedMatch) return;
    setConfirming(true);
    const r = await fetch(`${API_BASE}/bookings`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ownerId: owner.id, petId: pet.id, sitterId: selectedMatch.sitterId, serviceKey, fromISO, toISO, priceQuoted: selectedMatch.priceQuoted })
    }).then(r=>r.json());
    setConfirming(false);
    setConfirmed(r.booking);
  }

  useEffect(()=>{ 
    const storedUser = localStorage.getItem('pt_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserPlan(user.plan || 'FREE');
      } catch (e) {}
    }
  }, []);

  // Show matched companion screen before final booking confirmation
  if (showMatched && !confirmed) {
    return (
      <BookingMatched 
        bookingId={null}
        sitterId={selectedMatch?.sitterId}
        confirming={confirming}
        onBack={() => {
          setShowMatched(false);
          setSelectedMatch(null);
        }}
        onContinue={confirmBooking}
      />
    );
  }

  // Show success after booking is confirmed
  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
        <p className="text-slate-600">Reference: {confirmed.id}</p>
        <div className="flex gap-3 justify-center mt-8">
          <button
            onClick={() => onSuccess ? onSuccess() : onBack()}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPaidUser = userPlan !== 'FREE';

  if (!bookingRoute) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
          <h2 className="text-xl font-semibold">Bookings</h2>
          <div />
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Choose Booking Method</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setBookingRoute('manual')}
              className="border-2 border-slate-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-md transition-all text-left"
            >
              <div className="text-3xl mb-3">🔍</div>
              <h4 className="font-semibold text-lg mb-2">Manual Search</h4>
              <p className="text-sm text-slate-600">Browse and select from available companions yourself</p>
              <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium inline-block">Always Available</div>
            </button>

            <button
              onClick={() => {
                if (isPaidUser) {
                  setBookingRoute('automated');
                  autoAssign();
                }
              }}
              disabled={!isPaidUser}
              className={`border-2 rounded-xl p-6 transition-all text-left ${
                isPaidUser 
                  ? 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer' 
                  : 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="text-3xl mb-3">✨</div>
              <h4 className="font-semibold text-lg mb-2">AI-Powered Match</h4>
              <p className="text-sm text-slate-600">Let our AI find the perfect companion based on your preferences</p>
              <div className="mt-4">
                {isPaidUser ? (
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium inline-block">Premium Feature</span>
                ) : (
                  <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded text-xs font-medium inline-block">Requires Plus or Premium Plan</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingRoute === 'manual') {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <button className="px-3 py-1 bg-slate-200 rounded" onClick={() => setBookingRoute(null)}>← Back to Booking Methods</button>
          <h2 className="text-xl font-semibold">Manual Booking</h2>
          <div />
        </div>
        <div className="bg-white border rounded-xl p-6 text-center py-12">
          <div className="text-5xl mb-4">🚧</div>
          <h3 className="font-semibold text-lg mb-2">Manual Search Coming Soon</h3>
          <p className="text-slate-600">Browse and filter companions manually.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={() => setBookingRoute(null)}>← Back to Booking Methods</button>
        <h2 className="text-xl font-semibold">AI-Powered Booking</h2>
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
                className="px-4 py-2 rounded bg-emerald-600 text-white whitespace-nowrap"
                onClick={()=>previewMatch(result.assigned.id, result.assigned.score.price)}
              >
                View Match Details
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
                              onClick={()=>previewMatch(a.id, a.score.price)}>View</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

    </div>
  );
}
