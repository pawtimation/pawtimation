import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as businessApi from '../../lib/businessApi';

export function ClientSupport() {
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) {
        navigate('/client/login');
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        const businessId = parsed.businessId;

        if (!businessId) {
          localStorage.removeItem('pt_client');
          localStorage.removeItem('pt_user');
          navigate('/client/login');
          return;
        }

        const biz = await businessApi.getBusiness(businessId);
        setBusiness(biz);
      } catch (err) {
        console.error('Failed to load support info:', err);
        localStorage.removeItem('pt_client');
        localStorage.removeItem('pt_user');
        navigate('/client/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return <div className="text-sm text-slate-600">Loading support information…</div>;
  }

  if (!business) {
    return null;
  }

  const settings = business.settings || {};
  const profile = settings.profile || {};

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Support & Help</h1>

      <div className="bg-white p-6 border border-slate-200 rounded space-y-4">
        <div>
          <h2 className="text-sm font-semibold mb-3">Contact {business.name}</h2>
          
          {profile.contactEmail && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Email
              </label>
              <p className="text-sm mt-1">
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="text-teal-600 hover:underline"
                >
                  {profile.contactEmail}
                </a>
              </p>
            </div>
          )}

          {profile.contactPhone && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Phone
              </label>
              <p className="text-sm mt-1">
                <a
                  href={`tel:${profile.contactPhone}`}
                  className="text-teal-600 hover:underline"
                >
                  {profile.contactPhone}
                </a>
              </p>
            </div>
          )}

          {profile.addressLine1 && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Address
              </label>
              <p className="text-sm mt-1">
                {profile.addressLine1}
                {profile.city && <><br />{profile.city}</>}
                {profile.postcode && <><br />{profile.postcode}</>}
              </p>
            </div>
          )}

          {!profile.contactEmail && !profile.contactPhone && (
            <p className="text-sm text-slate-600">
              Contact information not available. Please reach out to your pet-care team directly.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 border border-slate-200 rounded">
        <h2 className="text-sm font-semibold mb-3">Common questions</h2>
        <ul className="text-sm text-slate-700 space-y-2">
          <li className="flex gap-2">
            <span className="text-teal-600">•</span>
            <span>
              <strong>How do I request a booking?</strong> Use the &quot;Request
              booking&quot; button on your dashboard.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600">•</span>
            <span>
              <strong>How do I view my invoices?</strong> Navigate to the
              Invoices section in the menu.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600">•</span>
            <span>
              <strong>How do I update my profile?</strong> Contact your pet-care team to
              update your contact details.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-600">•</span>
            <span>
              <strong>Can I add my own dogs?</strong> Your pet-care team will add your
              dogs to your profile during onboarding.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
