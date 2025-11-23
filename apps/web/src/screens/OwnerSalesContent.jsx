export function OwnerSalesContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sales & Billing</h2>
        <p className="text-sm text-slate-600 mt-1">High-level revenue and subscription metrics across all businesses</p>
      </div>

      {/* Coming Soon Message */}
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-teal-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Sales & Billing Dashboard</h3>
        <p className="text-slate-600 mb-4">Comprehensive sales analytics and billing insights coming soon</p>
        <p className="text-sm text-slate-500">Features will include MRR tracking, subscription analytics, invoice management, and revenue reporting</p>
      </div>
    </div>
  );
}
