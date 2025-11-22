export function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-teal-100">
          <div className="text-6xl mb-6">🐾</div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Plans Coming Soon</h1>
          <p className="text-xl text-slate-600 mb-8">
            We're finalizing our pricing plans. Check back in <strong>January 2025</strong> for full details.
          </p>
          <div className="border-t border-slate-200 pt-6 mt-6">
            <p className="text-sm text-slate-500 mb-4">In the meantime, join our beta program for early access.</p>
            <a 
              href="mailto:hello@pawtimation.co.uk?subject=Beta Program Interest"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
