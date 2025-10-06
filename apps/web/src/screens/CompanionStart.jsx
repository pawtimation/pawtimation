import React from 'react';
import { useNavigate } from 'react-router-dom';

export function CompanionStart() {
  const navigate = useNavigate();

  const benefits = [
    { icon: '💰', title: 'Flexible Earnings', desc: 'Set your own rates and availability' },
    { icon: '🐾', title: 'Love What You Do', desc: 'Spend time with pets you adore' },
    { icon: '📅', title: 'Work Your Way', desc: 'Choose when and how often you work' },
    { icon: '✨', title: 'Support & Growth', desc: 'Tools and training to help you succeed' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-ink mb-4">Become a Pet Companion</h1>
        <p className="text-xl text-slate-600">Join Beaconsfield's trusted pet care community</p>
      </div>

      <div className="bg-gradient-to-br from-brand-teal to-emerald-600 text-white rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-4">What to Expect</h2>
        <div className="space-y-3 text-white/90">
          <p>✓ Quick 5-minute signup to get started</p>
          <p>✓ Build your profile and set your services</p>
          <p>✓ AI-powered matching with local pet owners</p>
          <p>✓ Verification process (optional now, required for Pro status later)</p>
          <p>✓ Start receiving booking requests within days</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-6">
            <div className="text-4xl mb-3">{benefit.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
            <p className="text-slate-600 text-sm">{benefit.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-900 mb-2">No Payment Setup Required Yet</h3>
        <p className="text-sm text-amber-800">Focus on building your profile first. We'll help you set up payments when you're ready to accept bookings.</p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => navigate('/auth/register?role=companion')}
          className="px-8 py-4 bg-brand-teal text-white rounded-xl font-semibold text-lg hover:bg-teal-700 transition-colors"
        >
          Get Started
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-200 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
