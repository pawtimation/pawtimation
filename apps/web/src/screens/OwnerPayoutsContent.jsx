import { useState, useEffect } from 'react';
import { ownerApi } from '../lib/auth';

export function OwnerPayoutsContent() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessCommissions, setBusinessCommissions] = useState([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ method: 'BANK_TRANSFER', reference: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayoutSummaries();
  }, []);

  async function loadPayoutSummaries() {
    setLoading(true);
    setError(null);
    try {
      const res = await ownerApi('/owner/payouts/summary');
      if (!res.ok) {
        throw new Error('Failed to load payout summaries');
      }
      const data = await res.json();
      setSummaries(data.summaries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBusinessCommissions(businessId) {
    setBusinessLoading(true);
    try {
      const res = await ownerApi(`/owner/payouts/business/${businessId}`);
      if (!res.ok) {
        throw new Error('Failed to load business commissions');
      }
      const data = await res.json();
      setSelectedBusiness(data.business);
      setBusinessCommissions(data.commissions || []);
    } catch (err) {
      alert('Failed to load commissions: ' + err.message);
    } finally {
      setBusinessLoading(false);
    }
  }

  async function handleMarkPaid(commissionId) {
    if (!paymentForm.method) {
      alert('Please select a payment method');
      return;
    }

    setProcessing(true);
    try {
      const res = await ownerApi(`/owner/payouts/mark-paid/${commissionId}`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: paymentForm.method,
          paymentReference: paymentForm.reference || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to mark as paid');
      }

      alert('Commission marked as paid. Notification email sent to referrer.');
      setPaymentModal(null);
      setPaymentForm({ method: 'BANK_TRANSFER', reference: '' });
      
      if (selectedBusiness) {
        await loadBusinessCommissions(selectedBusiness.id);
      }
      await loadPayoutSummaries();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleBulkPay(businessId) {
    if (!paymentForm.method) {
      alert('Please select a payment method');
      return;
    }

    if (!confirm('Mark ALL pending commissions for this business as paid?')) {
      return;
    }

    setProcessing(true);
    try {
      const res = await ownerApi(`/owner/payouts/bulk-mark-paid/${businessId}`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: paymentForm.method,
          paymentReference: paymentForm.reference || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process bulk payment');
      }

      const result = await res.json();
      alert(`${result.processedCount} commissions marked as paid. Total: GBP ${result.totalAmount}. Notification email sent.`);
      setPaymentModal(null);
      setPaymentForm({ method: 'BANK_TRANSFER', reference: '' });
      setSelectedBusiness(null);
      setBusinessCommissions([]);
      await loadPayoutSummaries();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  }

  const totalPending = summaries.reduce((sum, s) => sum + s.totalPendingCents, 0);
  const businessesWithPending = summaries.filter(s => s.totalPendingCents > 0).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">Loading payout data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadPayoutSummaries}
          className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Referral Commission Payouts</h2>
        <p className="text-sm text-slate-600 mb-4">
          Manage referral commission payments to businesses. Commissions are 10% recurring monthly on referred customer subscriptions.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Pending</p>
            <p className="text-2xl font-bold text-slate-900">GBP {(totalPending / 100).toFixed(2)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Businesses Owed</p>
            <p className="text-2xl font-bold text-slate-900">{businessesWithPending}</p>
          </div>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-600 font-medium">No commission records yet</p>
          <p className="text-sm text-slate-500 mt-1">Commissions will appear here when referred businesses make payments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summaries.filter(s => s.totalPendingCents > 0).length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-200">
                <h3 className="font-semibold text-amber-900">Pending Payouts</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {summaries.filter(s => s.totalPendingCents > 0).map(summary => (
                  <div key={summary.referrerBusinessId} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{summary.businessName}</p>
                        <p className="text-sm text-slate-600">{summary.businessEmail}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {summary.pendingCount} pending commission{summary.pendingCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-600">GBP {summary.pendingAmount}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => loadBusinessCommissions(summary.referrerBusinessId)}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => setPaymentModal({ type: 'bulk', businessId: summary.referrerBusinessId, businessName: summary.businessName, amount: summary.pendingAmount })}
                            className="px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                          >
                            Pay All
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summaries.filter(s => s.totalPaidCents > 0).length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 bg-green-50 border-b border-green-200">
                <h3 className="font-semibold text-green-900">Payment History</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {summaries.filter(s => s.totalPaidCents > 0).map(summary => (
                  <div key={summary.referrerBusinessId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{summary.businessName}</p>
                        <p className="text-sm text-slate-600">{summary.paidCount} payment{summary.paidCount !== 1 ? 's' : ''} made</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">GBP {summary.paidAmount}</p>
                        {summary.lastPaymentAt && (
                          <p className="text-xs text-slate-500">Last: {new Date(summary.lastPaymentAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBusiness.name}</h3>
                  <p className="text-sm text-slate-600">{selectedBusiness.email}</p>
                </div>
                <button
                  onClick={() => { setSelectedBusiness(null); setBusinessCommissions([]); }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {businessLoading ? (
                <p className="text-slate-600 text-center py-8">Loading...</p>
              ) : businessCommissions.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No commissions found</p>
              ) : (
                <div className="space-y-3">
                  {businessCommissions.map(commission => (
                    <div key={commission.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">GBP {commission.amount}</p>
                          <p className="text-sm text-slate-600">Period: {commission.periodFormatted}</p>
                          <p className="text-xs text-slate-500">From: {commission.referredBusinessName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            commission.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {commission.status}
                          </span>
                          {commission.status === 'PENDING' && (
                            <button
                              onClick={() => setPaymentModal({ type: 'single', commissionId: commission.id, amount: commission.amount })}
                              className="ml-2 px-3 py-1 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded"
                            >
                              Mark Paid
                            </button>
                          )}
                          {commission.status === 'PAID' && commission.paidAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              Paid: {new Date(commission.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {paymentModal.type === 'bulk' ? `Pay All - ${paymentModal.businessName}` : 'Mark Payment Complete'}
            </h3>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Amount: <span className="font-bold text-slate-900">GBP {paymentModal.amount}</span></p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (optional)</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Transaction ID or reference"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setPaymentModal(null); setPaymentForm({ method: 'BANK_TRANSFER', reference: '' }); }}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => paymentModal.type === 'bulk' ? handleBulkPay(paymentModal.businessId) : handleMarkPaid(paymentModal.commissionId)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
