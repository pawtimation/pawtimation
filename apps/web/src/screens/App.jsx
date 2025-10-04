import React, { useState, useEffect } from 'react'
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
import { JoinInvite } from './JoinInvite'
import { SitterEdit } from './SitterEdit'
import { SitterPublic } from './SitterPublic'
import { PetManager } from './PetManager'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ChatWidget } from '../components/ChatWidget'
import { ExplorePanel } from '../components/ExplorePanel'
import { SitterDashboard } from './SitterDashboard'
import { Login } from './Login'
import { Register } from './Register'
import { AccountMenu } from '../components/AccountMenu'
import { auth } from '../lib/auth'
import BookingAuto from './BookingAuto'
import { Community } from './Community'

export function App(){
  const [view, setView] = useState('landing')
  const [bookingId, setBookingId] = useState(null)
  const [selectedSitterId, setSelectedSitterId] = useState('s1')
  const [sitterId, setSitterId] = useState('s_demo_companion')
  const [incidentData, setIncidentData] = useState(null)
  const [chatRoom, setChatRoom] = useState(null)

  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const hasToken = !!qs.get('token');
    if (location.pathname === '/join' || hasToken) {
      setView('join');
    }
  }, []);

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
          onPets={()=>setView('ownerPets')}
          onCircle={()=>setView('ownerCircle')}
          onChat={()=>setView('chat')}
          onBookingAuto={()=>setView('bookingAuto')}
        />
      )}
      {view==='companionStart' && (
        <CompanionStart 
          onBack={()=>setView('landing')} 
          onSignIn={()=>setView('login')} 
          onCreate={()=>setView('register')}
          onEditProfile={()=>setView('sitterEdit')}
          onPreview={()=>setView('sitterPublic')}
        />
      )}
      {view==='ownerCircle' && (
        <OwnerCircle 
          onBack={()=>setView('ownerStart')} 
          onChat={(roomId)=>{ setChatRoom(roomId); setView('chat'); }} 
        />
      )}
      {view==='join' && (
        <JoinInvite 
          onBack={()=>setView('landing')} 
          onOpenChat={({ ownerId, friendId })=>{
            fetch('/api/chat/dm', {
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ ownerId, friendId, label:'Private chat' })
            })
            .then(r=>r.json()).then(j=>{ setChatRoom(j.roomId); setView('chat'); });
          }}
        />
      )}
      {view==='chat' && <Chat roomId={chatRoom || undefined} onBack={()=>setView('landing')} />}
      {view==='community' && <Community onBack={()=>setView('landing')} />}
      {view==='sitterEdit' && (
        <SitterEdit
          sitterId={sitterId}
          onBack={()=>setView('companionStart')}
          onPreview={(id)=>{ setSitterId(id); setView('sitterPublic'); }}
        />
      )}
      {view==='sitterPublic' && (
        <SitterPublic
          sitterId={sitterId}
          onBack={()=>setView('companionStart')}
        />
      )}
      {view==='ownerPets' && <PetManager onBack={()=>setView('ownerStart')} />}
      {view==='bookingAuto' && <BookingAuto onBack={()=>setView('ownerStart')} onSuccess={()=>setView('ownerStart')} />}

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
      <ExplorePanel onGo={(v)=>setView(v)} />
    </div>
  )
}
