import React, { useState } from 'react'
import { Landing } from './Landing'
import { OwnerOnboarding } from './OwnerOnboarding'
import { FriendsInvite } from './FriendsInvite'
import { BookingFeed } from './BookingFeed'
import { BrowseSitters } from './BrowseSitters'
import { TrustCard } from './TrustCard'
import { CancelBooking } from './CancelBooking'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { SitterDashboard } from './SitterDashboard'

export function App(){
  const [view, setView] = useState('landing')
  const [bookingId, setBookingId] = useState(null)
  const [selectedSitterId] = useState('s1')

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header onNav={setView} />

      {view==='landing' && <Landing onOwner={()=>setView('ownerOnboard')} onSitter={()=>setView('sitterDash')} />}

      {view==='ownerOnboard' && (
        <OwnerOnboarding
          onDone={()=>setView('landing')}
          onFriends={()=>setView('friends')}
          onSitters={()=>setView('sitters')}
        />
      )}

      {view==='friends' && <FriendsInvite onBooked={(id)=>{ setBookingId(id); setView('feed'); }}/> }
      {view==='feed' && <BookingFeed bookingId={bookingId} onBack={()=>setView('landing')} /> }
      {view==='sitters' && <BrowseSitters onBack={()=>setView('landing')} /> }
      {view==='trust' && <TrustCard sitterId={selectedSitterId} onBack={()=>setView('landing')} /> }
      {view==='cancel' && <CancelBooking bookingId={bookingId} onBack={()=>setView('landing')} /> }

      {view==='sitterDash' && <SitterDashboard onBack={()=>setView('landing')} />}

      <Footer />
    </div>
  )
}
