import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function Header({ user }) {
  const [rsvpCount, setRsvpCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/community/rsvp-count')
      .then(r => r.json())
      .then(d => setRsvpCount(d.count || 0))
      .catch(() => {});
  }, [user]);

  return (
    <header className='mb-6'>
      <div className='flex items-center gap-3'>
        <img src='/pawtimation-logo.png' alt='Pawtimation' className='w-10 h-10'/>
        <h1 className='text-2xl font-bold text-brand-ink'>Pawtimation</h1>
      </div>
      <nav className='flex items-center justify-between mt-3 text-sm'>
        <div className='flex items-center gap-4 text-brand-inkMuted'>
          <Link to="/" className='hover:text-brand-teal transition'>Home</Link>
          <Link to="/community" className='hover:text-brand-teal transition relative'>
            Community
            {rsvpCount > 0 && (
              <span className='absolute -top-1.5 -right-2 bg-brand-teal text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold'>
                {rsvpCount}
              </span>
            )}
          </Link>
          {user && (
            <Link to="/account" className='hover:text-brand-teal transition'>Account</Link>
          )}
        </div>
        
        <div className='relative'>
          {!user && (
            <button 
              onClick={() => navigate('/auth/signin')}
              className='px-4 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700'
            >
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
