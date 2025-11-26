import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/auth';

export function SetupAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    loadBusinessData();
  }, []);

  async function loadBusinessData() {
    try {
      const res = await api('/admin/me');
      if (!res.ok) {
        navigate('/admin/login');
        return;
      }

      const data = await res.json();
      if (data.business) {
        setBusinessName(data.business.name || '');
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load business data:', err);
      setLoading(false);
    }
  }

  function handleContinue() {
    // Redirect to admin dashboard which shows onboarding wizard
    navigate('/admin');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Welcome to Pawtimation!</h1>
          <p className="text-xl text-slate-600 mb-2">Your beta account for <strong>{businessName}</strong> is all set</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">What's Next?</h2>
          <p className="text-slate-600 mb-6">
            We'll guide you through a quick setup to get your pet-care business up and running. This includes:
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Add Your Services</h3>
                <p className="text-sm text-slate-600">Set up the services you offer, like dog walking, pet sitting, or home visits</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Invite Your Team</h3>
                <p className="text-sm text-slate-600">Add staff members and manage their schedules and permissions</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Add Clients & Pets</h3>
                <p className="text-sm text-slate-600">Import your existing clients or invite new ones to book services</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 font-semibold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Create Your First Booking</h3>
                <p className="text-sm text-slate-600">Schedule bookings and let Pawtimation handle the rest</p>
              </div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-teal-800">
              <strong>Tip:</strong> You can customize your branding, business hours, and other settings anytime from the Settings menu.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-md"
          >
            Continue to Dashboard
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Need help getting started? <a href="mailto:hello@pawtimation.co.uk" className="text-teal-600 hover:underline font-medium">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
