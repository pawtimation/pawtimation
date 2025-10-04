import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export function BookingMatched({ bookingId, sitterId, onContinue, onBack, confirming }) {
  const [booking, setBooking] = useState(null);
  const [sitter, setSitter] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Load the selected companion
        const companionId = sitterId || 's_demo_companion';
        const sitterRes = await fetch(`${API_BASE}/sitters/${companionId}`);
        const sitterData = await sitterRes.json();
        setSitter(sitterData.sitter);
        
        // If we have a bookingId, load the actual booking
        if (bookingId) {
          const bookingRes = await fetch(`${API_BASE}/bookings/${bookingId}`);
          const bookingData = await bookingRes.json();
          setBooking(bookingData.booking);
        }
      } catch (err) {
        console.error('Failed to load matched companion:', err);
      }
    }
    load();
  }, [bookingId, sitterId]);

  if (!sitter) return <div className="text-center py-8">Loading your match...</div>;

  const verificationBadge = sitter.verification?.pro ? (
    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
      ✓ Pro Verified
    </span>
  ) : sitter.verification?.trainee ? (
    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
      Trainee
    </span>
  ) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">We've Found Your Perfect Match!</h1>
        <p className="text-slate-600">Meet your recommended Pet Companion</p>
      </div>

      {/* Companion Card */}
      <div className="bg-white border-2 border-teal-200 rounded-2xl overflow-hidden shadow-lg">
        {/* Banner */}
        {sitter.bannerUrl && (
          <div className="h-32 bg-gradient-to-r from-teal-400 to-blue-400" style={{
            backgroundImage: `url(${sitter.bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        )}

        <div className="p-6 space-y-4">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <img 
              src={sitter.avatarUrl || 'https://via.placeholder.com/100'}
              alt={sitter.name}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg -mt-10"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">{sitter.name}</h2>
                {verificationBadge}
              </div>
              <div className="text-slate-600 mt-1">
                {sitter.city} {sitter.postcode && `(${sitter.postcode})`}
              </div>
              {sitter.yearsExperience > 0 && (
                <div className="text-sm text-slate-500 mt-1">
                  {sitter.yearsExperience} years of experience
                </div>
              )}
            </div>
          </div>

          {/* Rating */}
          {sitter.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(sitter.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium">{sitter.rating.toFixed(1)}</span>
              {sitter.reviews > 0 && (
                <span className="text-sm text-slate-500">({sitter.reviews} reviews)</span>
              )}
            </div>
          )}

          {/* Bio */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">About {sitter.name}</h3>
            <p className="text-slate-700">{sitter.bio}</p>
          </div>

          {/* Services */}
          {sitter.services && sitter.services.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Services Offered</h3>
              <div className="space-y-2">
                {sitter.services.map((svc) => (
                  <div key={svc.key} className="flex justify-between items-center bg-slate-50 rounded-lg p-3">
                    <div>
                      <div className="font-medium">{svc.label}</div>
                      <div className="text-sm text-slate-500">
                        {svc.at === 'owner' ? 'At your home' : "At companion's home"}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-teal-600">£{svc.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why This Match */}
          <div className="border-t pt-4 bg-teal-50 -mx-6 -mb-6 px-6 py-4 mt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Why This Match?
            </h3>
            <ul className="space-y-1 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Located in your area ({sitter.city})</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Highly rated with verified credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>Services match your requirements</span>
              </li>
              {sitter.yearsExperience > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <span>Experienced professional ({sitter.yearsExperience}+ years)</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
        >
          See Other Options
        </button>
        <button
          onClick={onContinue}
          disabled={confirming}
          className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? 'Confirming...' : `Continue with ${sitter.name}`}
          {!confirming && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
