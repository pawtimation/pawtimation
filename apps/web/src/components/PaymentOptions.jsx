import React, { useState } from 'react'

export function PaymentOptions({ amount, onSelectPayment }) {
  const [paymentMethod, setPaymentMethod] = useState('card')

  const handlePaymentChange = (method) => {
    setPaymentMethod(method)
    onSelectPayment(method)
  }

  const totalAmount = (amount / 100).toFixed(2)
  const installmentAmount = (amount / 400).toFixed(2)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="font-semibold mb-4">Payment Options</h3>
      
      <div className="space-y-3">
        <div
          onClick={() => handlePaymentChange('card')}
          className={`border rounded-xl p-4 cursor-pointer transition ${
            paymentMethod === 'card' ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-200 hover:border-brand-teal/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'card' ? 'border-brand-teal' : 'border-slate-300'
              }`}>
                {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-brand-teal"></div>}
              </div>
              <div>
                <div className="font-medium">💳 Card Payment</div>
                <div className="text-sm text-slate-600">Pay in full now</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">£{totalAmount}</div>
              <div className="text-xs text-slate-500">One-time payment</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => handlePaymentChange('klarna')}
          className={`border rounded-xl p-4 cursor-pointer transition ${
            paymentMethod === 'klarna' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 hover:border-brand-blue/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'klarna' ? 'border-brand-blue' : 'border-slate-300'
              }`}>
                {paymentMethod === 'klarna' && <div className="w-3 h-3 rounded-full bg-brand-blue"></div>}
              </div>
              <div>
                <div className="font-medium">✨ Pay in 4 with Klarna</div>
                <div className="text-sm text-slate-600">Interest-free installments</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">£{installmentAmount}</div>
              <div className="text-xs text-slate-500">4 payments of £{installmentAmount}</div>
            </div>
          </div>
          {paymentMethod === 'klarna' && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600">✓</span>
                <span>0% interest - no fees when paid on time</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600">✓</span>
                <span>Payment held until service complete</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Automatic payments every 2 weeks</span>
              </div>
            </div>
          )}
        </div>

        <div
          onClick={() => handlePaymentChange('affirm')}
          className={`border rounded-xl p-4 cursor-pointer transition ${
            paymentMethod === 'affirm' ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'affirm' ? 'border-purple-600' : 'border-slate-300'
              }`}>
                {paymentMethod === 'affirm' && <div className="w-3 h-3 rounded-full bg-purple-600"></div>}
              </div>
              <div>
                <div className="font-medium">💰 Pay with Affirm</div>
                <div className="text-sm text-slate-600">Flexible monthly plans</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">From £{installmentAmount}/mo</div>
              <div className="text-xs text-slate-500">3-12 month options</div>
            </div>
          </div>
          {paymentMethod === 'affirm' && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600">✓</span>
                <span>As low as 0% APR for qualified buyers</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-600">✓</span>
                <span>Choose 3, 6, or 12 monthly payments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>Instant approval decision</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
        <div className="font-medium mb-1">🔒 Payment Protection</div>
        <div className="text-xs">Your payment is held in escrow and only released after your pet companion completes the service.</div>
      </div>
    </div>
  )
}
