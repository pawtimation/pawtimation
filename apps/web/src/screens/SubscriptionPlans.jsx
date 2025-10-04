import React, { useState } from 'react'
import { Paw } from '../ui/Paw'

export function SubscriptionPlans({ onPlanSelected }){
  const [showComparison, setShowComparison] = useState(false)

  const plans = [
    {
      id: 'owner_free',
      name: 'Free',
      price: '\u00a30',
      period: 'month',
      tagline: 'Start simple, stay connected.',
      description: 'Create your pet profile and connect with a Care Partner or trusted friend. Photo sharing and essential updates included.',
      cta: 'Choose Free',
      features: [
        '1 pet profile',
        'Basic AI diary',
        'Friends channel - Invite trusted friends for \u00a315/day',
        'Photo sharing',
        'Essential updates'
      ],
      badges: [
        '\u00a30 / month - No card required',
        'Friends channel - Invite trusted friends for \u00a315/day'
      ],
      highlight: false
    },
    {
      id: 'owner_plus',
      name: 'Plus',
      price: '\u00a39.99',
      period: 'month',
      tagline: 'Smarter care, more peace of mind.',
      description: 'Unlimited pet profiles, enhanced AI diary, live tracking, vet chat, priority support, and loyalty rewards.',
      cta: 'Choose Plus',
      features: [
        'Unlimited pet profiles',
        'Enhanced AI diary',
        'Live tracking - Arrival & departure verified',
        'Vet chat - 24/7 advice via partner chat',
        'Priority support - Faster help when you need it',
        'PawPoints loyalty rewards'
      ],
      badges: [
        'Live tracking - Arrival & departure verified',
        'Vet chat - 24/7 advice via partner chat',
        'Priority support - Faster help when you need it'
      ],
      highlight: true
    },
    {
      id: 'owner_premium',
      name: 'Premium',
      price: '\u00a319.99',
      period: 'month',
      tagline: 'Everything automated, beautifully.',
      description: 'Everything in Plus, plus personalised behaviour insights, playful AI summaries, monthly PawPoints bonuses, automatic booking discount (e.g., 10%), and per-booking insurance included.',
      cta: 'Choose Premium',
      features: [
        'Everything in Plus',
        'Auto discount - Save on every booking',
        'Insurance included - Per-booking cover',
        'AI Care Pack - Diary + photo montage',
        'Personalised behaviour insights',
        'Monthly PawPoints bonuses',
        'Automatic 10% booking discount'
      ],
      badges: [
        'Auto discount - Save on every booking',
        'Insurance included - Per-booking cover',
        'AI Care Pack - Diary + photo montage'
      ],
      highlight: false
    }
  ]

  const comparisonFeatures = [
    { label: 'Pet profiles', free: '1', plus: 'Unlimited', premium: 'Unlimited' },
    { label: 'AI pet diary', free: 'Basic', plus: 'Enhanced', premium: 'Personalised' },
    { label: 'Live tracking (arrival/departure)', free: '\u2014', plus: '\u2713', premium: '\u2713' },
    { label: 'Vet chat', free: '\u2014', plus: '\u2713', premium: '\u2713' },
    { label: 'Priority support', free: '\u2014', plus: '\u2713', premium: '\u2713' },
    { label: 'Behavioural tips (AI-assisted)', free: '\u2014', plus: '\u2014', premium: '\u2713' },
    { label: 'PawPoints bonuses', free: '\u2014', plus: '\u2713', premium: '\u2713 (extra)' },
    { label: 'Insurance add-on included', free: '\u2014', plus: '\u2014', premium: '\u2713' },
    { label: 'Automatic booking discount', free: '\u2014', plus: '\u2014', premium: 'e.g. 10%' }
  ]

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Paw className="w-10 h-10" />
          <h1 className="text-4xl font-bold text-slate-900">Choose Your Plan</h1>
        </div>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Start free or unlock premium features for smarter care and peace of mind
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map(plan => (
          <div 
            key={plan.id}
            className={`relative bg-white border-2 rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl ${
              plan.highlight ? 'border-brand-teal scale-105' : 'border-slate-200'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-teal text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            )}
            
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-slate-600 mb-3">{plan.tagline}</p>
              <div className="mb-3">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-600"> / {plan.period}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 min-h-[60px]">{plan.description}</p>

            <button
              onClick={() => onPlanSelected(plan.id)}
              className={`w-full py-3 rounded-lg font-semibold mb-4 transition-colors ${
                plan.highlight 
                  ? 'bg-brand-teal text-white hover:bg-brand-blue' 
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {plan.cta}
            </button>

            <div className="space-y-2 mb-4">
              {plan.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-500 mt-0.5">\u2713</span>
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            {plan.badges.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {plan.badges.slice(0, 2).map((badge, idx) => (
                  <div key={idx} className="text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg border border-slate-100">
                    {badge}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <button 
          onClick={() => setShowComparison(!showComparison)}
          className="text-brand-teal hover:text-brand-blue font-semibold underline"
        >
          {showComparison ? 'Hide' : 'Compare'} plans in detail
        </button>
      </div>

      {showComparison && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">Compare plans</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Free</th>
                  <th className="text-center py-3 px-4 font-semibold text-brand-teal">Plus</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-700">{feature.label}</td>
                    <td className="text-center py-3 px-4 text-slate-600">{feature.free}</td>
                    <td className="text-center py-3 px-4 text-slate-900 font-medium">{feature.plus}</td>
                    <td className="text-center py-3 px-4 text-slate-600">{feature.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center">
            Premium example: 10% automatic discount on bookings and per-booking insurance included.
          </p>
        </div>
      )}

      <div className="bg-gradient-to-br from-brand-teal to-brand-blue rounded-2xl p-6 text-white mb-8">
        <h3 className="text-xl font-bold mb-3">Why Premium?</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-2xl">\ud83d\udcb0</span>
            <div>
              <p className="font-semibold">Save every time</p>
              <p className="text-sm opacity-90">Automatic 10% discount on eligible bookings</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-2xl">\ud83d\udee1\ufe0f</span>
            <div>
              <p className="font-semibold">Protected by default</p>
              <p className="text-sm opacity-90">Insurance included on every qualifying booking</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-2xl">\u2728</span>
            <div>
              <p className="font-semibold">Daily delight</p>
              <p className="text-sm opacity-90">AI diary + photo montage delivered to your inbox</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3">Frequently Asked Questions</h3>
        
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-slate-900 mb-1">Is Premium worth it if I still pay for care?</p>
            <p className="text-sm text-slate-600">
              Yes - Premium saves money through automatic booking discounts, includes per-booking insurance, 
              unlocks vet chat and the AI Care Pack, and speeds matching with top Care Partners.
            </p>
          </div>
          
          <div>
            <p className="font-semibold text-slate-900 mb-1">Do Friends bookings get discounts?</p>
            <p className="text-sm text-slate-600">
              No - Friends are fixed at \u00a315/day as a community rate.
            </p>
          </div>
          
          <div>
            <p className="font-semibold text-slate-900 mb-1">Can I switch plans?</p>
            <p className="text-sm text-slate-600">
              Yes - upgrade or downgrade any time; changes apply from your next billing period.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
        <p><strong>Live tracking:</strong> We only collect location during an active booking and round coordinates to ~100m. Data auto-clears after 7 days.</p>
        <p><strong>Vet chat:</strong> 24/7 veterinary advice via our partner. Not a replacement for emergency care.</p>
        <p><strong>Insurance included (Premium):</strong> Covers qualified bookings with participating Care Partners. Excess may apply.</p>
        <p><strong>Automatic discount:</strong> Applied to eligible bookings with participating Care Partners. Excludes Friends channel.</p>
      </div>
    </div>
  )
}
