import React, { useState, useEffect } from 'react'

export function Header({onNav}){
  const [rsvpCount, setRsvpCount] = useState(0)

  useEffect(() => {
    fetch('/api/community/rsvp-count')
      .then(r => r.json())
      .then(d => setRsvpCount(d.count || 0))
      .catch(() => {})
  }, [])

  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-logo.png' alt='Pawtimation' className='w-10 h-10'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
      <nav className='flex items-center justify-between mt-3 text-sm text-brand-inkMuted'>
        <div className='flex items-center gap-4'>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('home')}>Home</button>
          <button className='hover:text-brand-teal transition relative' onClick={()=>onNav('community')}>
            Community
            {rsvpCount > 0 && (
              <span className='absolute -top-1.5 -right-2 bg-brand-teal text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold'>
                {rsvpCount}
              </span>
            )}
          </button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('ui')}>UI Kit</button>
        </div>
        <div className='text-brand-inkMuted opacity-70'>v0.3</div>
      </nav>
    </header>
  )
}
