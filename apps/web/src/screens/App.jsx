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
          <section className="rounded-2xl p-8 bg-gradient-to-br from-brand-teal/15 via-brand-mint/10 to-brand-cloud border border-brand-mint/30">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-brand-ink">Welcome to Pawtimation</h2>
            <p className="text-brand-inkMuted max-w-2xl leading-relaxed">Invite a trusted friend for £15/day or book a vetted sitter. Daily photos, AI diary summaries, and clear UK-style policies.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="px-6 py-3 bg-brand-green text-white rounded-lg font-medium hover:opacity-90 transition shadow-sm" onClick={()=>setView('friends')}>Invite a Friend</button>
              <button className="px-6 py-3 bg-brand-ink text-white rounded-lg font-medium hover:opacity-90 transition shadow-sm" onClick={()=>setView('sitters')}>Browse Sitters</button>
              <button className="px-6 py-3 bg-brand-blue text-white rounded-lg font-medium hover:opacity-90 transition shadow-sm" onClick={()=>setView('trust')}>Trust & Safety</button>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-card border border-brand-cloud">
              <div className="text-sm text-brand-gold font-medium mb-1">Step 1</div>
              <h3 className="font-semibold text-brand-ink">Choose Friends or Pros</h3>
              <p className="text-brand-inkMuted text-sm mt-1">Friends channel keeps costs low; Pros add insurance & licensing.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card border border-brand-cloud">
              <div className="text-sm text-brand-gold font-medium mb-1">Step 2</div>
              <h3 className="font-semibold text-brand-ink">Daily updates</h3>
              <p className="text-brand-inkMuted text-sm mt-1">Photos + notes → tidy AI diary for easy sharing.</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card border border-brand-cloud">
              <div className="text-sm text-brand-gold font-medium mb-1">Step 3</div>
              <h3 className="font-semibold text-brand-ink">Clear policies</h3>
              <p className="text-brand-inkMuted text-sm mt-1">British English, transparent cancellation, and visible agreements.</p>
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
