import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

const Badge = ({children}) => <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs">{children}</span>;

// Placeholder review data
const STUB_REVIEWS = [
  {
    id: 1,
    author: 'Sarah M.',
    rating: 5,
    date: '2 weeks ago',
    text: 'Absolutely wonderful experience! My dog Max was so happy and well cared for. Highly recommend!'
  },
  {
    id: 2,
    author: 'James T.',
    rating: 5,
    date: '1 month ago',
    text: 'Very professional and caring. Great communication throughout. Will definitely book again.'
  },
  {
    id: 3,
    author: 'Emily R.',
    rating: 4,
    date: '2 months ago',
    text: 'Great service! My cat was comfortable and happy. Would have loved more photo updates though.'
  }
];

function ReviewModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Write a Review</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} disabled className="text-2xl text-gray-300 cursor-not-allowed">★</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your Review</label>
          <textarea
            disabled
            className="w-full border-2 border-slate-200 rounded-lg p-3 text-slate-400 cursor-not-allowed"
            rows="4"
            placeholder="Reviews coming soon..."
          />
        </div>

        <button
          disabled
          className="w-full px-6 py-3 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed font-medium"
        >
          Submit Review (Coming Soon)
        </button>
      </div>
    </div>
  );
}

export function CompanionPublicProfile(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(()=>{
    (async ()=>{
      try {
        const a = await fetch(`${API_BASE}/sitters/${id}`).then(r=>r.json());
        setS(a.sitter);
      } catch (err) {
        console.error('Failed to load companion:', err);
        setS(null);
      } finally {
        setLoading(false);
      }
    })();
  },[id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="text-slate-600">Loading companion profile...</p>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300" onClick={() => navigate('/')}>← Back to Home</button>
        
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Companion Profile Coming Soon</h2>
          <p className="text-slate-600 mb-6">This companion hasn't completed their profile yet. Check back later!</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition font-medium"
          >
            Browse Other Companions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300" onClick={() => navigate('/')}>← Back to Home</button>
        <h2 className="text-xl font-semibold text-slate-800">{s.name}'s Profile</h2>
        <div />
      </div>

      <div className="rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-teal-400 to-cyan-400" style={{
        backgroundImage: s.bannerUrl ? `url(${s.bannerUrl})` : undefined,
        backgroundSize:'cover', 
        backgroundPosition:'center'
      }} />

      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src={s.avatarUrl || '/dog-photo-new.jpg'} 
            alt={s.name} 
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-800">{s.name}</h1>
              {s.verification?.pro && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Pro</span>
              )}
            </div>
            <div className="text-slate-600">📍 {s.city}{s.postcode ? ` (${s.postcode})` : ''}</div>
            {s.rating > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(s.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">{s.rating.toFixed(1)}</span>
                <span className="text-sm text-slate-500">({s.reviews || 0} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-3 text-slate-800">About {s.name}</h3>
        <p className="text-slate-700 leading-relaxed">{s.bio || 'No bio provided yet.'}</p>
      </div>

      {s.services && s.services.length > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-slate-800">Services & Pricing</h3>
          <div className="space-y-3">
            {s.services.map(svc=>(
              <div key={svc.key} className="flex items-start justify-between border-2 border-slate-100 rounded-xl p-4 hover:border-teal-300 transition">
                <div>
                  <div className="font-semibold text-slate-800">{svc.label}</div>
                  <div className="text-sm text-slate-500">{svc.at==='sitter'?'At companion\'s home':'At your home'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-teal-600">£{svc.price} <span className="text-sm text-slate-500">/ {svc.per}</span></div>
                  {svc.extraPet ? <div className="text-xs text-slate-500">+£{svc.extraPet} / extra pet</div> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Reviews</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium text-slate-700">4.7 average</span>
              <span className="text-sm text-slate-500">• {STUB_REVIEWS.length} reviews</span>
            </div>
          </div>
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2 border-2 border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 transition font-medium"
          >
            Write a Review
          </button>
        </div>

        <div className="space-y-4">
          {STUB_REVIEWS.map(review => (
            <div key={review.id} className="border-2 border-slate-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-slate-800">{review.author}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      </div>

      <ReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} />

      <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">📋</div>
          <div>
            <h3 className="font-bold text-slate-800">Ready to book?</h3>
            <p className="text-sm text-slate-600">Sign in or create an account to book this companion</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/auth/signin')}
            className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/auth/register?role=owner')}
            className="flex-1 px-6 py-3 border-2 border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 transition font-medium"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
