import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { BookingMatched } from './BookingMatched';
import { trackEvent } from '../lib/metrics';

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
  
  // Manual booking state (hoisted to top level to avoid hooks rule violation)
  const [companions, setCompanions] = useState([]);
  const [companionsLoaded, setCompanionsLoaded] = useState(false);
  
  // Filter state for manual search
  const [filters, setFilters] = useState({
    location: '',
    service: '',
    maxPrice: ''
  });

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

  // Load companions for manual booking
  useEffect(() => {
    async function loadCompanions() {
      if (bookingRoute === 'manual' && !companionsLoaded) {
        try {
          const response = await fetch(`${API_BASE}/sitters`);
          const data = await response.json();
          setCompanions(data.sitters || []);
        } catch (err) {
          console.error('Failed to load companions:', err);
        } finally {
          setCompanionsLoaded(true);
        }
      }
    }
    loadCompanions();
  }, [bookingRoute, companionsLoaded]);

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

        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-xl mb-2 text-slate-800">Choose Booking Method</h3>
          <p className="text-sm text-slate-600 mb-6">Select how you'd like to find your perfect pet companion</p>
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => {
                trackEvent('owner_browse_companions');
                setBookingRoute('manual');
              }}
              className="group border-2 border-slate-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-xl transition-all text-left bg-gradient-to-br from-white to-emerald-50/30"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🔍</div>
              <h4 className="font-bold text-lg mb-2 text-slate-800 group-hover:text-emerald-700 transition">Browse Companions</h4>
              <p className="text-sm text-slate-600 mb-4">Browse and select from available companions yourself</p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold inline-block">Always Available</div>
                <svg className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => {
                if (isPaidUser) {
                  setBookingRoute('automated');
                  autoAssign();
                }
              }}
              disabled={!isPaidUser}
              className={`group border-2 rounded-xl p-6 transition-all text-left ${
                isPaidUser 
                  ? 'border-slate-200 hover:border-teal-500 hover:shadow-xl cursor-pointer bg-gradient-to-br from-white to-teal-50/30' 
                  : 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className={`text-4xl mb-3 transition-transform ${isPaidUser ? 'group-hover:scale-110' : ''}`}>✨</div>
              <h4 className={`font-bold text-lg mb-2 transition ${isPaidUser ? 'text-slate-800 group-hover:text-teal-700' : 'text-slate-500'}`}>AI-Powered Match</h4>
              <p className="text-sm text-slate-600 mb-4">Let our AI find the perfect companion based on your preferences</p>
              <div className="flex items-center gap-2">
                {isPaidUser ? (
                  <>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold inline-block">Premium Feature</span>
                    <svg className="w-5 h-5 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : (
                  <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-semibold inline-block">🔒 Requires Plus or Premium Plan</span>
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
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <button 
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition" 
            onClick={() => setBookingRoute(null)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Browse Companions</h2>
          <div />
        </div>

        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">🔍</div>
            <div>
              <h3 className="font-semibold text-slate-800">Manual Search Mode</h3>
              <p className="text-sm text-slate-600">Browse all available companions and select your preferred match</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. London, Manchester"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Service Type</label>
              <select
                value={filters.service}
                onChange={(e) => setFilters({...filters, service: e.target.value})}
                className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              >
                <option value="">All Services</option>
                <option value="homevisit">Home Visit</option>
                <option value="boarding">Boarding</option>
                <option value="daycare">Day Care</option>
                <option value="walking">Dog Walking</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Price (£/day)</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>
        </div>

        {!companionsLoaded ? (
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-slate-600">Loading companions...</p>
          </div>
        ) : companions.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-xl p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-7xl mb-4">🐾</div>
              <h3 className="font-bold text-2xl text-slate-800 mb-3">No companions nearby yet</h3>
              <p className="text-slate-600 mb-6">
                We're building our community of trusted pet companions in your area. 
                Try adjusting your filters or expanding your search radius.
              </p>
              <div className="space-y-3">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition font-medium">
                  Invite a friend to join
                </button>
                <button className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium">
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {companions.map((companion) => (
              <div key={companion.id} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-lg transition-all">
                {companion.bannerUrl && (
                  <div className="h-32 bg-gradient-to-r from-teal-400 to-blue-400" style={{
                    backgroundImage: `url(${companion.bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                )}
                
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <img 
                      src={companion.avatarUrl || '/dog-photo-new.jpg'}
                      alt={companion.name}
                      className={`w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover ${companion.bannerUrl ? '-mt-8' : ''}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">{companion.name}</h3>
                        {companion.verification?.pro && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Pro</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{companion.city}</p>
                    </div>
                  </div>

                  {companion.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.round(companion.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium">{companion.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-700 line-clamp-2">{companion.bio}</p>

                  {companion.services && companion.services.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-xs text-slate-500 mb-2">Services from:</div>
                      <div className="flex gap-2 flex-wrap">
                        {companion.services.slice(0, 3).map((svc) => (
                          <span key={svc.key} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                            £{svc.price} {svc.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => previewMatch(companion.id, companion.services?.[0]?.price || 30)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg hover:from-teal-700 hover:to-emerald-700 font-medium transition flex items-center justify-center gap-2"
                  >
                    Select {companion.name}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
