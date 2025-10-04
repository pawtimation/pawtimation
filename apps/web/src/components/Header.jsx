import React, { useState, useEffect } from 'react'

export function Header({onNav, user}){
  const [rsvpCount, setRsvpCount] = useState(0)
  const [plan, setPlan] = useState('FREE')
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  useEffect(() => {
    fetch('/api/community/rsvp-count')
      .then(r => r.json())
      .then(d => setRsvpCount(d.count || 0))
      .catch(() => {})

    if (user) {
      const token = localStorage.getItem('pt_token')
      fetch('/api/me/plan', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(r => r.json())
        .then(d => setPlan(d.plan || 'FREE'))
        .catch(() => {})
    }
  }, [user])

  const planChip = {
    FREE: { bg: 'bg-slate-200', text: 'text-slate-700', label: 'Free' },
    PLUS: { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Plus' },
    PREMIUM: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Premium ⭐' }
  }

  const currentChip = planChip[plan]

  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-logo.png' alt='Pawtimation' className='w-10 h-10'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
      <nav className='flex items-center justify-between mt-3 text-sm'>
        <div className='flex items-center gap-4 text-brand-inkMuted'>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('home')}>Home</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('owners')}>Owners</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('companions')}>Companions</button>
          <button className='hover:text-brand-teal transition relative' onClick={()=>onNav('communityEvents')}>
            Community / Events
            {rsvpCount > 0 && (
              <span className='absolute -top-1.5 -right-2 bg-brand-teal text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold'>
                {rsvpCount}
              </span>
            )}
          </button>
        </div>
        
        <div className='relative'>
          {user ? (
            <button 
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className='flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded hover:from-slate-600 hover:to-slate-800 transition-all'
            >
              <span>Account</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${currentChip.bg} ${currentChip.text}`}>
                {currentChip.label}
              </span>
            </button>
          ) : (
            <button 
              onClick={() => onNav('register')}
              className='px-4 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700'
            >
              Sign in
            </button>
          )}

          {showAccountMenu && user && (
            <div className='absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50'>
              <button 
                onClick={() => { setShowAccountMenu(false); onNav('account'); }}
                className='w-full text-left px-4 py-2 hover:bg-slate-50 rounded-t-lg'
              >
                Account Hub
              </button>
              <button 
                onClick={() => { setShowAccountMenu(false); onNav('pets'); }}
                className='w-full text-left px-4 py-2 hover:bg-slate-50'
              >
                My Pets
              </button>
              <button 
                onClick={() => { setShowAccountMenu(false); onNav('sitterEdit'); }}
                className='w-full text-left px-4 py-2 hover:bg-slate-50'
              >
                Companion Profile
              </button>
              <div className='border-t my-1'></div>
              <button 
                onClick={() => {
                  localStorage.removeItem('pt_token')
                  localStorage.removeItem('pt_user')
                  fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = '/'
                }}
                className='w-full text-left px-4 py-2 hover:bg-slate-50 text-rose-600 rounded-b-lg'
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
