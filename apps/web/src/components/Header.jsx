import React from 'react';

export function Header() {
  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-paw.png' alt='Pawtimation' className='w-10 h-10 object-contain'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
    </header>
  );
}
