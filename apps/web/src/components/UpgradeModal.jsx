import React from 'react';

export function UpgradeModal({ isOpen, onClose, currentPlan = 'FREE' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Upgrade Your Plan</h2>
            <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Free Plan */}
            <div className={`border-2 rounded-lg p-6 ${currentPlan === 'FREE' ? 'border-slate-400 bg-slate-50' : 'border-slate-200'}`}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Free</div>
                <div className="text-3xl font-bold mb-4">£0</div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Basic booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Up to 2 pets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Community access</span>
                  </li>
                </ul>
                {currentPlan === 'FREE' && (
                  <div className="text-sm font-medium text-slate-600 bg-slate-200 rounded py-2">Current Plan</div>
                )}
              </div>
            </div>

            {/* Plus Plan */}
            <div className={`border-2 rounded-lg p-6 ${currentPlan === 'PLUS' ? 'border-teal-400 bg-teal-50' : 'border-teal-200'}`}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Plus</div>
                <div className="text-3xl font-bold mb-1">£4.99<span className="text-base font-normal">/mo</span></div>
                <div className="text-xs text-slate-500 mb-4">Everything in Free, plus:</div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Unlimited pets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>AI diary summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Create events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Smart matching</span>
                  </li>
                </ul>
                {currentPlan === 'PLUS' ? (
                  <div className="text-sm font-medium text-teal-700 bg-teal-200 rounded py-2">Current Plan</div>
                ) : currentPlan === 'FREE' ? (
                  <button className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors">
                    Upgrade to Plus
                  </button>
                ) : (
                  <div className="text-sm text-slate-500">Lower tier</div>
                )}
              </div>
            </div>

            {/* Premium Plan */}
            <div className={`border-2 rounded-lg p-6 ${currentPlan === 'PREMIUM' ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200'}`}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">Premium ⭐</div>
                <div className="text-3xl font-bold mb-1">£9.99<span className="text-base font-normal">/mo</span></div>
                <div className="text-xs text-slate-500 mb-4">Everything in Plus, plus:</div>
                <ul className="text-sm text-left space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Live tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Auto-post social</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>Weekly insights</span>
                  </li>
                </ul>
                {currentPlan === 'PREMIUM' ? (
                  <div className="text-sm font-medium text-emerald-700 bg-emerald-200 rounded py-2">Current Plan</div>
                ) : (
                  <button className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors">
                    Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-slate-600">
            <p>Plans are billed monthly. Cancel anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
