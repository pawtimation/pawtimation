import React from 'react'

export function AboutUs({ onBack }){
  return (
    <div className="mt-6 space-y-6">
      <button className="px-3 py-1 bg-slate-200 rounded" onClick={onBack}>← Back</button>
      
      <div className="bg-white rounded-xl shadow-card p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">About Pawtimation</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
            <div className="order-2 md:order-1">
              <h2 className="text-2xl font-bold mb-4">Founded by Dog Lovers</h2>
              <p className="text-lg text-slate-700 mb-4">
                Hi, I'm <strong>Andrew James</strong>, founder of Pawtimation.
              </p>
              <p className="text-slate-700 mb-4">
                The truth is simple: I love dogs more than I love most humans. That's not entirely a joke. 
                My dog Hector has been my most loyal companion, my confidant, and honestly, the best part of my life.
              </p>
              <p className="text-slate-700 mb-4">
                When I had to travel for work and couldn't find someone I truly trusted to care for Hector, 
                I realized there had to be a better way. A way to connect with people who share the same 
                deep love and respect for our four-legged family members.
              </p>
              <p className="text-slate-700 mb-4">
                But here's what makes Pawtimation different: we use objective AI to match you with companions. 
                No human bias. No commercial favoritism. No paid promotions pushing certain companions to the top. 
                Just pure performance data—ratings, track record, and trust built through actual care delivered.
              </p>
              <p className="text-slate-700 mb-4">
                The best companions naturally rise to the top because that's what they've earned. 
                People who genuinely love animals and dedicate themselves to exceptional care will always succeed here. 
                Humans are imperfect, and traditional platforms reflect those imperfections. We let the work speak for itself.
              </p>
              <p className="text-slate-700 mb-4">
                I also want owners to remember something important: these companions dedicate their lives to caring for 
                your pets. They're professionals who deserve respect, fair treatment, and appreciation for the incredible 
                responsibility they take on every single day.
              </p>
              <p className="text-slate-700 italic">
                When you trust someone with your dog's care, you're trusting them with family. 
                We take that responsibility seriously, and so do they.
              </p>
            </div>
            
            <div className="order-1 md:order-2">
              <img 
                src="/founder-hector.jpg" 
                alt="Andrew James with Hector" 
                className="w-full rounded-lg shadow-lg grayscale"
              />
              <p className="text-center text-sm text-slate-500 mt-2">Andrew & Hector</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 mt-8">
            <h3 className="text-xl font-bold mb-4">Our Mission</h3>
            <p className="text-slate-700 mb-4">
              Pawtimation exists to give pet owners complete peace of mind while celebrating the companions 
              who dedicate their lives to animal care. We connect you with trusted professionals 
              who understand that caring for a pet isn't just a job—it's a calling.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="bg-teal-50 rounded-lg p-5">
                <div className="text-3xl mb-2">🐾</div>
                <h4 className="font-semibold mb-2">Trust & Safety</h4>
                <p className="text-sm text-slate-600">
                  Every companion is verified, insured, and held accountable to UK duty of care standards.
                </p>
              </div>
              
              <div className="bg-teal-50 rounded-lg p-5">
                <div className="text-3xl mb-2">🤖</div>
                <h4 className="font-semibold mb-2">Objective AI Matching</h4>
                <p className="text-sm text-slate-600">
                  No bias, no favoritism, no paid promotions. Our AI ranks companions purely on performance, 
                  so the best naturally rise to the top.
                </p>
              </div>
              
              <div className="bg-teal-50 rounded-lg p-5">
                <div className="text-3xl mb-2">⚖️</div>
                <h4 className="font-semibold mb-2">Zero Tolerance</h4>
                <p className="text-sm text-slate-600">
                  One strike for duty of care violations. No exceptions. Your pet's safety is non-negotiable.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 mt-8">
            <h3 className="text-xl font-bold mb-4">Why Pawtimation?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-teal-600 text-xl">✓</span>
                <span className="text-slate-700">Book trusted friends at £15/day or vetted Pet Companions with full insurance</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 text-xl">✓</span>
                <span className="text-slate-700">Daily photo updates and AI-generated care summaries so you're never out of the loop</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 text-xl">✓</span>
                <span className="text-slate-700">GPS check-in/check-out tracking for complete transparency</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 text-xl">✓</span>
                <span className="text-slate-700">Escrow payments with Klarna/Affirm installment options</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal-600 text-xl">✓</span>
                <span className="text-slate-700">UK-compliant legal framework protecting both owners and companions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 mt-8">
            <p className="text-lg text-slate-800 text-center mb-4">
              Your pet isn't just an animal. They're family. And family deserves the very best care.
            </p>
            <p className="text-sm text-slate-700 text-center">
              This platform runs on trust, performance, and mutual respect. Companions dedicate their lives 
              to your pets—they deserve your appreciation just as much as you deserve their excellence.
            </p>
            <p className="text-sm text-slate-600 mt-3 text-center italic">— Andrew James, Founder</p>
          </div>
        </div>
      </div>
    </div>
  )
}
