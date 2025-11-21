import React from 'react';

export function Header() {
  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/brand/paw.svg' alt='Pawtimation' className='w-10 h-10'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
    </header>
  );
}
