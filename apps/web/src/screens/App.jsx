import React, { useState } from 'react'
import { Landing } from './Landing'
import { OwnerStart } from './OwnerStart'
import { CompanionStart } from './CompanionStart'
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
import { OwnerCircle } from './OwnerCircle'
import { Chat } from './Chat'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ChatWidget } from '../components/ChatWidget'
import { SitterDashboard } from './SitterDashboard'
import { Login } from './Login'
import { Register } from './Register'
import { AccountMenu } from '../components/AccountMenu'
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
        <AccountMenu
          onSignIn={()=>setView('login')}
          onRegister={()=>setView('register')}
          onDashboard={()=>setView('sitterDash')}
          onSignOut={()=>{ auth.token=''; auth.user=null; fetch('/api/auth/logout',{method:'POST'}); setView('landing'); }}
        />
      </div>

      {view==='landing' && <Landing onOwner={()=>setView('ownerStart')} onCompanion={()=>setView('companionStart')} />}
      {view==='ownerStart' && (
        <OwnerStart 
          onBack={()=>setView('landing')} 
          onSignIn={()=>setView('login')} 
          onCreate={()=>setView('register')}
          onCircle={()=>setView('ownerCircle')}
          onChat={()=>setView('chat')}
        />
      )}
      {view==='companionStart' && <CompanionStart onBack={()=>setView('landing')} onSignIn={()=>setView('login')} onCreate={()=>setView('register')} />}
      {view==='ownerCircle' && <OwnerCircle onBack={()=>setView('ownerStart')} onChat={()=>setView('chat')} />}
      {view==='chat' && <Chat onBack={()=>setView('landing')} />}

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

      {view==='login' && <Login onSuccess={()=>setView('sitterDash')} onBack={()=>setView('landing')} />}
      {view==='register' && <Register onSuccess={()=>setView('sitterDash')} onBack={()=>setView('landing')} />}
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
