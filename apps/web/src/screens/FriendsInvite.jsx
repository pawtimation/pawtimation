import React, { useState } from 'react';
import { API_BASE } from '../config';

export function FriendsInvite({ userEmail = 'you@example.com' }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  async function sendInvite() {
    const r = await fetch(`${API_BASE}/referrals/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fromEmail: userEmail, 
        toEmail: email 
      })
    });
    const j = await r.json();
    setReferralLink(j.referralLink || '');
    setSent(true);
  }

  function copyLink() {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      alert('Link copied to clipboard!');
    }
  }

  return (
    <div className='max-w-2xl mx-auto mt-8 p-8 bg-white rounded-lg shadow-card'>
      <h1 className='text-3xl font-semibold text-slate-800 mb-2'>
        Invite a Friend to Pawtimation
      </h1>
      <p className='text-slate-600 mb-6'>
        Share the love and save together! When your friend signs up and books their first pet care, you'll both enjoy:
      </p>

      <div className='bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-lg p-6 mb-6'>
        <h3 className='text-lg font-semibold text-teal-800 mb-3'>Referral Rewards</h3>
        <ul className='space-y-2 text-slate-700'>
          <li className='flex items-start gap-2'>
            <span className='text-teal-600 font-bold'>✓</span>
            <span><strong>10% off your next booking</strong> for both you and your friend</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='text-teal-600 font-bold'>✓</span>
            <span><strong>1 month of live tracking free</strong> — monitor your pet's care in real-time</span>
          </li>
        </ul>
      </div>

      {!sent ? (
        <div>
          <label className='block mb-4'>
            <span className='text-sm font-medium text-slate-700 mb-1 block'>
              Friend's email address
            </span>
            <input
              type='email'
              className='w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500'
              placeholder='friend@example.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>
          <button
            className='w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition'
            onClick={sendInvite}
            disabled={!email}
          >
            Send Invitation
          </button>
        </div>
      ) : (
        <div className='text-center'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
            <p className='text-green-800 font-semibold'>Invitation sent successfully!</p>
            <p className='text-green-700 text-sm mt-1'>Your friend will receive an email with your referral link.</p>
          </div>
          
          {referralLink && (
            <div className='mt-4'>
              <p className='text-sm text-slate-600 mb-2'>Or share this link directly:</p>
              <div className='flex gap-2'>
                <input
                  type='text'
                  className='flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm bg-slate-50'
                  value={referralLink}
                  readOnly
                />
                <button
                  className='bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition'
                  onClick={copyLink}
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <button
            className='mt-4 text-teal-600 hover:text-teal-700 font-medium'
            onClick={() => { setSent(false); setEmail(''); }}
          >
            Invite another friend
          </button>
        </div>
      )}
    </div>
  );
}
