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
import { SitterDashboard } from './SitterDashboard'
import { Login } from './Login'
import { Register } from './Register'
import { AccountMenu } from '../components/AccountMenu'
import { auth } from '../lib/auth'
import BookingAuto from './BookingAuto'
import { Community } from './Community'
import { SupportMetrics } from './SupportMetrics'
import { Account } from './Account'
import { CommunityEvents } from './CommunityEvents'
import { DashboardOwner } from './DashboardOwner'
import { DashboardCompanion } from './DashboardCompanion'
import { DashboardChoose } from './DashboardChoose'
import { AuthGuard } from '../components/AuthGuard'

export function App(){
  const [view, setView] = useState('home')
  const [bookingId, setBookingId] = useState(null)
  const [selectedSitterId, setSelectedSitterId] = useState('s1')
  const [sitterId, setSitterId] = useState('s_demo_companion')
  const [incidentData, setIncidentData] = useState(null)
  const [chatRoom, setChatRoom] = useState(null)
  const [currentUser, setCurrentUser] = useState(auth.user)

  useEffect(() => {
    const storedUser = localStorage.getItem('pt_user');
    const storedToken = localStorage.getItem('pt_token');
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        auth.user = user;
        auth.token = storedToken;
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_token');
      }
    }

    const qs = new URLSearchParams(location.search);
    const hasToken = !!qs.get('token');
    if (location.pathname === '/join' || hasToken) {
      setView('join');
    }
  }, []);

  function handleDashboardRoute(role) {
    if (role === 'owner') {
      setView('dashboardOwner');
    } else if (role === 'companion') {
      setView('dashboardCompanion');
    } else {
      setView('dashboardChoose');
    }
  }

  function handleAuthSuccess(user) {
    auth.user = user;
    auth.token = localStorage.getItem('pt_token') || '';
    setCurrentUser(user);
    setView('dashboardChoose');
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header onNav={setView} user={currentUser} />

      {view==='home' && (
        <Landing 
          onSignIn={()=>setView('signin')} 
          onRegister={()=>setView('register')}
          onDashboard={handleDashboardRoute}
        />
      )}

      {view==='signin' && <Login onSuccess={handleAuthSuccess} onBack={()=>setView('home')} />}
      {view==='register' && <Register onSuccess={handleAuthSuccess} onBack={()=>setView('home')} />}

      {view==='dashboardOwner' && (
        <AuthGuard onRedirect={()=>setView('signin')}>
          <DashboardOwner onNavigate={setView} onBack={()=>setView('home')} />
        </AuthGuard>
      )}

      {view==='dashboardCompanion' && (
        <AuthGuard onRedirect={()=>setView('signin')}>
          <DashboardCompanion onNavigate={setView} onBack={()=>setView('home')} />
        </AuthGuard>
      )}

      {view==='dashboardChoose' && (
        <AuthGuard onRedirect={()=>setView('signin')}>
          <DashboardChoose onChoose={handleDashboardRoute} onBack={()=>setView('home')} />
        </AuthGuard>
      )}

      {view==='ownerStart' && (
        <OwnerStart 
          onBack={()=>setView('home')} 
          onSignIn={()=>setView('signin')} 
          onCreate={()=>setView('register')}
          onPets={()=>setView('pets')}
          onCircle={()=>setView('ownerCircle')}
          onChat={()=>setView('chat')}
          onBookingAuto={()=>setView('bookingAuto')}
        />
      )}
      {view==='companionStart' && (
        <CompanionStart 
          onBack={()=>setView('home')} 
          onSignIn={()=>setView('signin')} 
          onCreate={()=>setView('register')}
          onEditProfile={()=>setView('sitterEdit')}
          onPreview={()=>setView('sitterPublic')}
        />
      )}
      {view==='ownerCircle' && (
        <OwnerCircle 
          onBack={()=>setView('dashboardOwner')} 
          onChat={(roomId)=>{ setChatRoom(roomId); setView('chat'); }} 
        />
      )}
      {view==='join' && (
        <JoinInvite 
          onBack={()=>setView('home')} 
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
      {view==='chat' && <Chat roomId={chatRoom || undefined} onBack={()=>setView('dashboardOwner')} />}
      {view==='community' && <Community onBack={()=>setView('home')} />}
      {view==='sitterEdit' && (
        <SitterEdit
          sitterId={auth.user?.sitterId || 's_demo_companion'}
          onBack={()=>setView('dashboardCompanion')}
          onPreview={(id)=>{ setSitterId(id); setView('sitterPublic'); }}
        />
      )}
      {view==='sitterPublic' && (
        <SitterPublic
          sitterId={sitterId}
          onBack={()=>setView('dashboardCompanion')}
        />
      )}
      {view==='pets' && <PetManager onBack={()=>setView('dashboardOwner')} />}
      {view==='bookingAuto' && <BookingAuto onBack={()=>setView('dashboardOwner')} onSuccess={()=>setView('dashboardOwner')} />}

      {view==='ownerOnboard' && (
        <OwnerOnboarding
          onDone={()=>setView('home')}
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
        onBack={()=>setView('home')} 
        onReportIncident={(data)=>{setIncidentData(data); setView('reportIncident')}}
      />}
      {view==='sitters' && <BrowseSitters onBack={()=>setView('ownerOnboard')} /> }
      {view==='trust' && <TrustCard sitterId={selectedSitterId} onBack={()=>setView('home')} /> }
      {view==='cancel' && <CancelBooking bookingId={bookingId} onBack={()=>setView('home')} /> }

      {view==='login' && <Login onSuccess={handleAuthSuccess} onBack={()=>setView('home')} />}
      {view==='sitterDash' && <SitterDashboard sitterId={(auth.user?.sitterId)||'s1'} onBack={()=>setView('home')} />}
      
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

      {view==='about' && <AboutUs onBack={()=>setView('home')} />}

      {view==='subscriptions' && <SubscriptionPlans onPlanSelected={(planId)=>{ console.log('Selected plan:', planId); setView('ownerOnboard'); }} onBack={()=>setView('ownerOnboard')} />}

      {view==='supportMetrics' && <SupportMetrics onBack={()=>setView('home')} />}

      {view==='account' && (
        <AuthGuard onRedirect={()=>setView('signin')}>
          <Account 
            onBack={()=>setView('home')} 
            onNavigate={(screen)=>setView(screen)}
          />
        </AuthGuard>
      )}

      {view==='communityEvents' && <CommunityEvents onBack={()=>setView('home')} />}

      {(view==='owners' || view==='companions') && (
        <Landing 
          onSignIn={()=>setView('signin')} 
          onRegister={()=>setView('register')}
          onDashboard={handleDashboardRoute}
        />
      )}

      {view==='services' && <SitterEdit sitterId={auth.user?.sitterId || 's1'} onBack={()=>setView('account')} onPreview={(id)=>{setSitterId(id); setView('sitterPublic');}} />}

      <Footer onNav={setView} />
      <ChatWidget />
    </div>
  )
}
