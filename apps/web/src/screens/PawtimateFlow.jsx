import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { PaymentOptions } from '../components/PaymentOptions'

export function PawtimateFlow({ ownerEmail='owner@example.com', onBack, onBooked }){
  const [step, setStep] = useState('pet')
  const [pets, setPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [choice, setChoice] = useState(null)
  const [calibre, setCalibre] = useState('ANY')
  const [sitters, setSitters] = useState([])
  const [selectedSitter, setSelectedSitter] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [bookingRequestId, setBookingRequestId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ loadPets() },[])

  async function loadPets(){
    const r = await fetch(`${API_BASE}/owners/${encodeURIComponent(ownerEmail)}/pets`)
    if(r.ok){
      const data = await r.json()
      setPets(data.pets || [])
    }
  }

  async function createRequest(){
    if(!selectedPet || !startDate || !endDate) return
    setLoading(true)
    const r = await fetch(`${API_BASE}/pawtimate/request`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerEmail,
        petId: selectedPet.id,
        startDate,
        endDate,
        shareWithFriends: choice === 'friends',
        calibre: choice === 'sitters' ? calibre : null
      })
    })
    if(r.ok){
      const data = await r.json()
      setBookingRequestId(data.bookingRequest.id)
      if(choice === 'sitters'){
        await autoBookBestCompanion(data.bookingRequest.id)
      } else {
        setStep('share')
      }
    }
    setLoading(false)
  }

  async function autoBookBestCompanion(reqId){
    setLoading(true)
    const r = await fetch(`${API_BASE}/pawtimate/auto-book`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ 
        bookingRequestId: reqId,
        paymentMethod,
        postcode: 'HP20'
      })
    })
    if(r.ok){
      const data = await r.json()
      setSelectedSitter(data.companion)
      setStep('payment')
    }
    setLoading(false)
  }

  async function searchSitters(){
    setLoading(true)
    const params = new URLSearchParams({
      startDate,
      endDate,
      calibre: calibre !== 'ANY' ? calibre : '',
      postcode: 'HP20'
    })
    const r = await fetch(`${API_BASE}/pawtimate/sitters?${params}`)
    if(r.ok){
      const data = await r.json()
      setSitters(data.sitters || [])
    }
    setLoading(false)
  }

  async function bookSitter(sitterId){
    if(!bookingRequestId) return
    setLoading(true)
    const r = await fetch(`${API_BASE}/pawtimate/book`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ bookingRequestId, sitterId, paymentMethod })
    })
    if(r.ok){
      const data = await r.json()
      if(onBooked) onBooked(data.booking.id)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pawtimate your pet</h2>
        <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      </div>

      {step === 'pet' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3">1. Select your pet</h3>
          {pets.length === 0 ? (
            <div className="text-slate-600 text-sm">No pets added yet. Please add a pet first.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {pets.map(p=>(
                <div key={p.id} 
                  onClick={()=>setSelectedPet(p)} 
                  className={`border rounded p-3 cursor-pointer transition ${selectedPet?.id===p.id?'border-emerald-600 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-slate-600">{p.breed} {p.age && `• ${p.age}`}</div>
                </div>
              ))}
            </div>
          )}
          {selectedPet && (
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={()=>setStep('dates')}>
              Next: Choose dates
            </button>
          )}
        </div>
      )}

      {step === 'dates' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3">2. Holiday dates</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start date</label>
              <input type="date" className="border rounded px-3 py-2 w-full" value={startDate} onChange={e=>setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End date</label>
              <input type="date" className="border rounded px-3 py-2 w-full" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>
          </div>
          {startDate && endDate && (
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={()=>setStep('choice')}>
              Next: Choose companion type
            </button>
          )}
        </div>
      )}

      {step === 'choice' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3">3. Share with friends or find pet companions?</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div onClick={()=>setChoice('friends')} 
              className={`border rounded-xl p-5 cursor-pointer transition ${choice==='friends'?'border-emerald-600 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}>
              <div className="text-lg font-semibold mb-2">👥 Share with friends</div>
              <div className="text-sm text-slate-600">£15/day suggested rate</div>
              <div className="text-sm text-slate-600 mt-2">Invite trusted friends to care for {selectedPet?.name}</div>
            </div>
            <div onClick={()=>setChoice('sitters')} 
              className={`border rounded-xl p-5 cursor-pointer transition ${choice==='sitters'?'border-sky-600 bg-sky-50':'border-slate-200 hover:border-sky-400'}`}>
              <div className="text-lg font-semibold mb-2">⭐ Find pet companions</div>
              <div className="text-sm text-slate-600">Professional care</div>
              <div className="text-sm text-slate-600 mt-2">Browse vetted, insured pet companions</div>
            </div>
          </div>

          {choice === 'sitters' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Pet companion calibre</label>
              <div className="flex gap-2">
                <button onClick={()=>setCalibre('ANY')} className={`px-4 py-2 rounded ${calibre==='ANY'?'bg-slate-800 text-white':'bg-slate-200'}`}>Any</button>
                <button onClick={()=>setCalibre('TRAINEE')} className={`px-4 py-2 rounded ${calibre==='TRAINEE'?'bg-slate-800 text-white':'bg-slate-200'}`}>Trainee</button>
                <button onClick={()=>setCalibre('VERIFIED')} className={`px-4 py-2 rounded ${calibre==='VERIFIED'?'bg-slate-800 text-white':'bg-slate-200'}`}>Verified</button>
                <button onClick={()=>setCalibre('PREMIUM')} className={`px-4 py-2 rounded ${calibre==='PREMIUM'?'bg-slate-800 text-white':'bg-slate-200'}`}>Premium</button>
              </div>
            </div>
          )}

          {choice && (
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50" onClick={createRequest} disabled={loading}>
              {loading ? 'Creating request...' : choice === 'friends' ? 'Create share link' : 'Find pet companions'}
            </button>
          )}
        </div>
      )}

      {step === 'sitters' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Recommended pet companions for {selectedPet?.name}</h3>
          {sitters.length === 0 ? (
            <div className="text-slate-600 text-sm">No pet companions found for your criteria.</div>
          ) : (
            <div className="space-y-3">
              {sitters.map(s=>(
                <div key={s.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{s.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${s.tier==='PREMIUM'?'bg-purple-100 text-purple-800':s.tier==='VERIFIED'?'bg-blue-100 text-blue-800':'bg-slate-100 text-slate-800'}`}>
                          {s.tier}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{s.postcode}</div>
                      <div className="text-sm text-slate-700 mt-2">{s.bio}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span>⭐ {s.rating} ({s.reviews} reviews)</span>
                        <span>📊 Score: {s.score}</span>
                        <span>📅 {s.totalBookings} bookings</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Services: {s.services?.join(', ')}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold">£{(s.ratePerDay/100).toFixed(0)}</div>
                      <div className="text-xs text-slate-600">per day</div>
                      <button onClick={()=>{setSelectedSitter(s); setStep('payment');}} className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50" disabled={loading}>
                        Select & Pay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'payment' && selectedSitter && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Pet:</span>
                <span className="font-medium">{selectedPet?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dates:</span>
                <span className="font-medium">{startDate} to {endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pet Companion:</span>
                <span className="font-medium">{selectedSitter.name}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-slate-600">Total:</span>
                <span className="font-bold text-lg">£{(selectedSitter.ratePerDay/100).toFixed(0)}</span>
              </div>
            </div>
          </div>

          <PaymentOptions amount={selectedSitter.ratePerDay} onSelectPayment={setPaymentMethod} />

          <button
            onClick={async () => {
              setLoading(true)
              await bookSitter(selectedSitter.id)
              setLoading(false)
            }}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Confirm Booking with ${paymentMethod === 'card' ? 'Card' : paymentMethod === 'klarna' ? 'Klarna' : 'Affirm'}`}
          </button>
        </div>
      )}

      {step === 'share' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Share with friends</h3>
          <div className="text-slate-700 mb-3">
            Send this booking request to your trusted friends via the Friends invite flow.
          </div>
          <div className="bg-slate-50 rounded p-3 text-sm">
            <div><strong>Pet:</strong> {selectedPet?.name}</div>
            <div><strong>Dates:</strong> {startDate} to {endDate}</div>
            <div><strong>Suggested rate:</strong> £15/day</div>
          </div>
          <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={()=>window.location.reload()}>
            Done
          </button>
        </div>
      )}
    </div>
  )
}
