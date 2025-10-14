import React, { useState, useEffect } from 'react'

export function Community({ onBack, cityDefault='Beaconsfield', postcodeDefault='HP9' }){
  const [items, setItems] = useState([])
  const [city, setCity] = useState(cityDefault)
  const [pc, setPc] = useState(postcodeDefault)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [city, pc])

  const loadEvents = async () => {
    setLoading(true)
    const res = await fetch(`/api/community/events?city=${city}&postcode=${pc}`)
    const data = await res.json()
    setItems(data.events || [])
    setLoading(false)
  }

  const handleRsvp = async (eventId, userEmail) => {
    await fetch('/api/community/rsvp', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ eventId, userEmail, status:'yes' })
    })
    loadEvents()
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='border-b border-slate-200 pb-4 mb-6'>
        {onBack && <button onClick={onBack} className='inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-brand-teal hover:text-teal-700 mb-2' aria-label="Go back">← Back</button>}
        <h1 className='text-2xl md:text-3xl font-bold text-brand-ink tracking-tight'>Community Events</h1>
        <p className='text-slate-600 mt-1'>Connect with fellow pet owners in {city}</p>
      </div>

      <div className='flex gap-3 mb-6'>
        <input 
          type='text' 
          value={city} 
          onChange={(e)=>setCity(e.target.value)}
          placeholder='City'
          className='px-3 py-2 border border-slate-300 rounded-xl flex-1 focus:ring-teal-500 focus:border-teal-500'
        />
        <input 
          type='text' 
          value={pc} 
          onChange={(e)=>setPc(e.target.value)}
          placeholder='Postcode'
          className='px-3 py-2 border border-slate-300 rounded-xl w-28 focus:ring-teal-500 focus:border-teal-500'
        />
      </div>

      {loading ? (
        <div className='text-center py-12 text-slate-500'>Loading events...</div>
      ) : items.length === 0 ? (
        <div className='text-center py-12 text-slate-500'>No events found for this area</div>
      ) : (
        <div className='space-y-4'>
          {items.map(evt => {
            const confirmedCount = evt.rsvps?.filter(r => r.status === 'yes').length || 0
            const isConfirmed = confirmedCount >= 5
            
            return (
              <div key={evt.id} className='border rounded-xl p-6 hover:border-brand-teal transition'>
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h3 className='text-xl font-semibold text-brand-ink'>{evt.title}</h3>
                    <p className='text-sm text-slate-600'>{evt.location}</p>
                  </div>
                  {isConfirmed && (
                    <span className='bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium'>
                      Confirmed
                    </span>
                  )}
                </div>
                
                <p className='text-slate-700 mb-4'>{evt.description}</p>
                
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-slate-600'>
                    📅 {evt.date} at {evt.time} • {confirmedCount} {confirmedCount === 1 ? 'person' : 'people'} attending
                  </div>
                  <button 
                    onClick={() => handleRsvp(evt.id, 'demo@example.com')}
                    className='inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500'
                  >
                    RSVP
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
