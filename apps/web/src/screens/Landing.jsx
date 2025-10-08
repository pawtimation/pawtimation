import React, { useState, useEffect } from 'react';
import { auth } from '../lib/auth';
import { WalkthroughModal } from '../components/WalkthroughModal';

export function Landing({ onOwner, onCompanion, onSignIn, onRegister, onDashboard }) {
  const user = auth.user;
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pt_walkthrough_dismissed');
    if (!dismissed && !user) {
      setShowWalkthrough(true);
    }
  }, [user]);
  
  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-40">
          <img src="/hero-dog-ball.jpg" alt="" className="w-full h-full object-cover object-center"/>
        </div>
        <div className="relative z-10 p-6 md:p-16 text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 drop-shadow-lg">Welcome to Pawtimation</h1>
          <p className="text-lg md:text-2xl opacity-95 max-w-3xl drop-shadow-md">Trusted pet care for families — friends or professionals, your choice</p>
          
          <button
            onClick={() => setShowWalkthrough(true)}
            className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm"
            title="Show walkthrough"
          >
            <span className="text-xl font-bold">?</span>
          </button>
        </div>
      </div>

      <WalkthroughModal 
        isOpen={showWalkthrough} 
        onClose={() => setShowWalkthrough(false)} 
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">🐾</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">I'm a Pet Owner</h3>
              <p className="text-slate-600 leading-relaxed">Invite a friend or book a vetted Companion. Daily photos and AI diary summaries included.</p>
            </div>
          </div>
          {user ? (
            <button 
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors" 
              onClick={() => onDashboard('owner')}
            >
              Open my dashboard
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors" 
                onClick={onSignIn}
              >
                Sign in
              </button>
              <button 
                className="flex-1 px-6 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium transition-colors" 
                onClick={() => onRegister('owner')}
              >
                Create account
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-4xl">💼</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">I'm a Pet Companion</h3>
              <p className="text-slate-600 leading-relaxed">Create your profile, set rates and upload documents to move from Trainee to Pro.</p>
            </div>
          </div>
          {user ? (
            <button 
              className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors" 
              onClick={() => onDashboard('companion')}
            >
              Open my dashboard
            </button>
          ) : (
            <div className="flex gap-3">
              <button 
                className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium transition-colors" 
                onClick={onSignIn}
              >
                Sign in
              </button>
              <button 
                className="flex-1 px-6 py-3 border-2 border-slate-800 text-slate-800 rounded-lg hover:bg-slate-50 font-medium transition-colors" 
                onClick={() => onRegister('companion')}
              >
                Create account
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-teal-50 rounded-2xl p-6 md:p-12 border border-teal-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/3">
            <img src="/chocolate-lab-running.jpg" alt="Happy chocolate lab" className="w-full h-64 object-cover object-center rounded-xl shadow-lg"/>
          </div>
          <div className="md:w-2/3">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Why Pawtimation?</h2>
            <p className="text-lg text-slate-600 mb-4">The intelligent way to book pet care.</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-xl">✓</span>
                <span className="text-slate-700">Every companion verified, insured, and reviewed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-xl">✓</span>
                <span className="text-slate-700">AI-powered: Smart matching, daily diary summaries, and reliability tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-xl">✓</span>
                <span className="text-slate-700">Receive live updates, photos, and behaviour notes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-600 text-xl">✓</span>
                <span className="text-slate-700">Peace of mind: GPS tracking, verification, and UK legal compliance</span>
              </li>
            </ul>
            <p className="text-slate-800 font-medium text-lg">Join Pawtimation — trusted care, intelligent connection, total peace of mind.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
