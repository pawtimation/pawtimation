import React from 'react'

export function Header({onNav}){
  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-logo.png' alt='Pawtimation' className='w-10 h-10'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
      <nav className='flex items-center justify-between mt-3 text-sm text-brand-inkMuted'>
        <div className='flex items-center gap-4'>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('home')}>Home</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('friends')}>Friends</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('sitters')}>Pet Companions</button>
          <button className='hover:text-brand-teal transition' onClick={()=>onNav('ui')}>UI Kit</button>
        </div>
        <div className='text-brand-inkMuted opacity-70'>v0.3</div>
      </nav>
    </header>
  )
}
