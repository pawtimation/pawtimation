import React, { useState } from 'react'
import { FriendsInvite } from './FriendsInvite'
import { BookingFeed } from './BookingFeed'
import { BrowseSitters } from './BrowseSitters'
import { TrustCard } from './TrustCard'
import { CancelBooking } from './CancelBooking'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export function App(){
  const [bookingId, setBookingId] = useState(null)
  const [view, setView] = useState('home')
  const [selectedSitterId] = useState('s1')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header onNav={setView} />
      {view==='home' && (
        <div className="space-y-6">
          <section className="rounded-2xl p-6 bg-gradient-to-r from-brand-teal/10 to-brand-green/10 border border-slate-200">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome to Pawtimation</h2>
            <p className="text-slate-600 max-w-2xl">Invite a trusted friend for £15/day or book a vetted sitter. Daily photos, AI diary summaries, and clear UK-style policies.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="px-5 py-2.5 bg-brand-green text-white rounded-lg font-medium hover:opacity-90 transition" onClick={()=>setView('friends')}>Invite a Friend</button>
              <button className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:opacity-90 transition" onClick={()=>setView('sitters')}>Browse Sitters</button>
              <button className="px-5 py-2.5 bg-brand-blue text-white rounded-lg font-medium hover:opacity-90 transition" onClick={()=>setView('trust')}>Trust & Safety</button>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="text-sm text-slate-500 mb-1">Step 1</div>
              <h3 className="font-semibold">Choose Friends or Pros</h3>
              <p className="text-slate-600 text-sm mt-1">Friends channel keeps costs low; Pros add insurance & licensing.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="text-sm text-slate-500 mb-1">Step 2</div>
              <h3 className="font-semibold">Daily updates</h3>
              <p className="text-slate-600 text-sm mt-1">Photos + notes → tidy AI diary for easy sharing.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="text-sm text-slate-500 mb-1">Step 3</div>
              <h3 className="font-semibold">Clear policies</h3>
              <p className="text-slate-600 text-sm mt-1">British English, transparent cancellation, and visible agreements.</p>
            </div>
          </section>
        </div>
      )}

      {view==='friends' && <FriendsInvite onBooked={(id)=>{ setBookingId(id); setView('feed'); }}/> }
      {view==='feed' && <BookingFeed bookingId={bookingId} onBack={()=>setView('home')} /> }
      {view==='sitters' && <BrowseSitters onBack={()=>setView('home')} /> }
      {view==='trust' && <TrustCard sitterId={selectedSitterId} onBack={()=>setView('home')} /> }
      {view==='cancel' && <CancelBooking bookingId={bookingId} onBack={()=>setView('home')} /> }

      <Footer />
    </div>
  )
}
