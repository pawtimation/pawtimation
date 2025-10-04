import React, { useState } from 'react'
import { Landing } from './Landing'
import { OwnerOnboarding } from './OwnerOnboarding'
import { PawtimateFlow } from './PawtimateFlow'
import { FriendsInvite } from './FriendsInvite'
import { BookingFeed } from './BookingFeed'
import { BrowseSitters } from './BrowseSitters'
import { TrustCard } from './TrustCard'
import { CancelBooking } from './CancelBooking'
import { ReportIncident } from './ReportIncident'
import { AboutUs } from './AboutUs'
import { SubscriptionPlans } from './SubscriptionPlans'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ChatWidget } from '../components/ChatWidget'
import { SitterDashboard } from './SitterDashboard'
import { Login } from './Login'
import { Register } from './Register'
import { auth } from '../lib/auth'

export function App(){
  const [view, setView] = useState('landing')
  const [bookingId, setBookingId] = useState(null)
  const [selectedSitterId, setSelectedSitterId] = useState('s1')
  const [incidentData, setIncidentData] = useState(null)

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <Header onNav={setView} />
        {!auth.user ? (
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-slate-200" onClick={()=>setView('login')}>Sign in</button>
            <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={()=>setView('register')}>Create account</button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-600">Hi, {auth.user.name}</span>
            <button className="px-3 py-1 rounded bg-slate-200" onClick={()=>setView('sitterDash')}>Dashboard</button>
            <button className="px-3 py-1 rounded bg-rose-600 text-white" onClick={()=>{
              auth.token = ''; auth.user = null; fetch('/api/auth/logout',{method:'POST'}); setView('landing');
            }}>Sign out</button>
          </div>
        )}
      </div>

      {view==='landing' && <Landing onOwner={()=>setView('ownerOnboard')} onSitter={()=>setView('sitterDash')} />}

      {view==='ownerOnboard' && (
        <OwnerOnboarding
          onDone={()=>setView('landing')}
          onFriends={()=>setView('friends')}
          onSitters={()=>setView('sitters')}
          onPawtimate={()=>setView('pawtimate')}
          onSubscriptions={()=>setView('subscriptions')}
        />
      )}

      {view==='pawtimate' && <PawtimateFlow onBack={()=>setView('ownerOnboard')} onBooked={(id)=>{ setBookingId(id); setView('feed'); }} />}
      {view==='friends' && <FriendsInvite onBooked={(id)=>{ setBookingId(id); setView('feed'); }}/> }
      {view==='feed' && <BookingFeed 
        bookingId={bookingId} 
        onBack={()=>setView('landing')} 
        onReportIncident={(data)=>{setIncidentData(data); setView('reportIncident')}}
      />}
      {view==='sitters' && <BrowseSitters onBack={()=>setView('ownerOnboard')} /> }
      {view==='trust' && <TrustCard sitterId={selectedSitterId} onBack={()=>setView('landing')} /> }
      {view==='cancel' && <CancelBooking bookingId={bookingId} onBack={()=>setView('landing')} /> }

      {view==='login' && <Login onSuccess={(u)=>{ setView('sitterDash'); }} onBack={()=>setView('landing')} />}
      {view==='register' && <Register onSuccess={(u)=>{ setView('sitterDash'); }} onBack={()=>setView('landing')} />}
      {view==='sitterDash' && <SitterDashboard sitterId={(auth.user?.sitterId)||'s1'} onBack={()=>setView('landing')} />}
      
      {view==='reportIncident' && incidentData && (
        <ReportIncident 
          bookingId={incidentData.bookingId}
          sitterId={incidentData.sitterId}
          sitterName={incidentData.sitterName}
          ownerEmail={incidentData.ownerEmail}
          onBack={()=>setView('feed')}
          onReported={()=>setView('feed')}
        />
      )}

      {view==='about' && <AboutUs onBack={()=>setView('landing')} />}

      {view==='subscriptions' && <SubscriptionPlans onPlanSelected={(planId)=>{ console.log('Selected plan:', planId); setView('ownerOnboard'); }} onBack={()=>setView('ownerOnboard')} />}

      <Footer onNav={setView} />
      <ChatWidget />
    </div>
  )
}
