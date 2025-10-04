import React from 'react'

export function Header({onNav}){
  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-logo.svg' alt='Pawtimation' className='w-12 h-12'/>
        <div>
          <h1 className='text-3xl font-bold text-brand-ink'>Pawtimation</h1>
          <p className='font-medium -mt-1 text-brand-gold'>Where every tail wags while you're away</p>
        </div>
      </div>
      <nav className='flex items-center justify-between mt-3 text-sm text-brand-inkMuted'>
        <div className='flex items-center gap-4'>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('home')}>Home</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('friends')}>Friends</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('sitters')}>Sitters</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('ui')}>UI Kit</button>
        </div>
        <div className='text-brand-inkMuted opacity-70'>v0.3</div>
      </nav>
    </header>
  )
}
