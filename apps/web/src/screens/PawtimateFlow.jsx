import React, { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { PaymentOptions } from '../components/PaymentOptions'
import { FriendJobPosted } from './FriendJobPosted'
import { ArrowLeft } from '../components/Icons'

function formatTier(tier){
  if(tier === 'PREMIUM') return 'Pro'
  if(tier === 'VERIFIED') return 'Verified'
  if(tier === 'TRAINEE') return 'Trainee'
  return tier
}

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
  const [enableFriendJobs, setEnableFriendJobs] = useState(false)
  const [friendJobRate, setFriendJobRate] = useState(1500)

  useEffect(()=>{ loadPets(); loadOwnerSettings() },[])

  async function loadPets(){
    const r = await fetch(`${API_BASE}/owners/${encodeURIComponent(ownerEmail)}/pets`)
    if(r.ok){
      const data = await r.json()
      setPets(data.pets || [])
    }
  }

  async function loadOwnerSettings(){
    const r = await fetch(`${API_BASE}/owners/${encodeURIComponent(ownerEmail)}/settings`)
    if(r.ok){
      const data = await r.json()
      setEnableFriendJobs(data.enableFriendJobs ?? false)
    }
  }

  async function createRequest(){
    if(!selectedPet || !startDate || !endDate) return
    setLoading(true)
    
    const bookingType = choice === 'friendJob' ? 'FRIEND_JOB' : choice === 'pro' || choice === 'trainee' ? 'COMPANION' : 'FRIEND_SHARE'
    const shareWithFriends = bookingType === 'FRIEND_SHARE' || bookingType === 'FRIEND_JOB'
    
    const r = await fetch(`${API_BASE}/pawtimate/request`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        ownerEmail,
        petId: selectedPet.id,
        startDate,
        endDate,
        shareWithFriends,
        bookingType,
        calibre: (choice === 'pro' || choice === 'trainee') ? calibre : null,
        friendJobRate: choice === 'friendJob' ? friendJobRate : null
      })
    })
    if(r.ok){
      const data = await r.json()
      setBookingRequestId(data.bookingRequest.id)
      if(choice === 'pro' || choice === 'trainee'){
        await autoBookBestCompanion(data.bookingRequest.id)
      } else if(choice === 'friendJob') {
        setStep('friendJobPosted')
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
        <button className="flex items-center gap-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded transition-colors" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
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
          <h3 className="font-semibold mb-3">3. Choose your pet care option</h3>
          <div className={`grid ${enableFriendJobs ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
            <div onClick={()=>{ setChoice('pro'); setCalibre('PREMIUM'); }} 
              className={`border rounded-xl p-5 cursor-pointer transition ${choice==='pro'?'border-emerald-600 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}>
              <div className="text-lg font-semibold mb-2">⭐ Companion - Pro</div>
              <div className="text-sm text-slate-600">Premium tier</div>
              <div className="text-sm text-slate-600 mt-2">Professional companions with vet nursing background</div>
            </div>
            
            <div onClick={()=>{ setChoice('trainee'); setCalibre('TRAINEE'); }} 
              className={`border rounded-xl p-5 cursor-pointer transition ${choice==='trainee'?'border-blue-600 bg-blue-50':'border-slate-200 hover:border-blue-400'}`}>
              <div className="text-lg font-semibold mb-2">🌱 Companion - Trainee</div>
              <div className="text-sm text-slate-600">Entry tier</div>
              <div className="text-sm text-slate-600 mt-2">Animal lovers starting their pet care journey</div>
            </div>

            {enableFriendJobs && (
              <div onClick={()=>setChoice('friendJob')} 
                className={`border rounded-xl p-5 cursor-pointer transition ${choice==='friendJob'?'border-emerald-600 bg-emerald-50':'border-slate-200 hover:border-emerald-400'}`}>
                <div className="text-lg font-semibold mb-2">👥 Create paid job for a friend</div>
                <div className="text-sm text-slate-600">£15/day suggested</div>
                <div className="text-sm text-slate-600 mt-2">Post a paid job for your trusted friends</div>
              </div>
            )}
          </div>

          {choice === 'friendJob' && (
            <div className="mt-4">
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 text-lg">⚠️</span>
                  <div className="text-sm text-slate-700">
                    <strong>Important:</strong> Friends you hire will not have the same background checks, DBS verification, or insurance coverage as professional Pet Companions. By enabling this feature, you acknowledge this is your personal choice and responsibility.
                  </div>
                </div>
              </div>
              
              <label className="block text-sm font-medium mb-2">Daily rate for friend (£)</label>
              <input 
                type="number" 
                className="border rounded px-4 py-2 w-full max-w-xs" 
                value={friendJobRate/100} 
                onChange={e=>setFriendJobRate(Math.round(Number(e.target.value) * 100))}
                placeholder="15"
              />
              <p className="text-xs text-slate-500 mt-1">This job will be posted to your friends to accept</p>
            </div>
          )}

          {choice && (
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50" onClick={createRequest} disabled={loading}>
              {loading ? 'Creating request...' : choice === 'friendJob' ? 'Post job to friends' : 'Find companions'}
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
                        <span className={`px-2 py-0.5 rounded text-xs ${s.tier==='PREMIUM'?'bg-emerald-100 text-emerald-800':s.tier==='VERIFIED'?'bg-cyan-100 text-cyan-800':'bg-slate-100 text-slate-800'}`}>
                          {formatTier(s.tier)}
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

      {step === 'friendJobPosted' && (
        <FriendJobPosted 
          pet={selectedPet}
          startDate={startDate}
          endDate={endDate}
          rate={friendJobRate}
          onDone={() => window.location.reload()}
        />
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
