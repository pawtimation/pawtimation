import React, { useState } from 'react';

export function BetaApplicationModal({ isOpen, onClose, betaStatus }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    phone: '',
    location: '',
    businessSize: '',
    servicesOffered: '',
    currentTools: '',
    website: '',
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/beta/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Application failed');
      }

      setSubmitStatus({ 
        success: true, 
        message: data.message,
        isWaitlisted: data.status === 'WAITLISTED'
      });
      
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', businessName: '', phone: '', location: '', businessSize: '', servicesOffered: '', currentTools: '', website: '', comments: '' });
        setSubmitStatus(null);
      }, 3000);
    } catch (err) {
      setSubmitStatus({ success: false, message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWaitlistMode = betaStatus?.slotsAvailable === 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white sm:rounded-xl w-full sm:max-w-lg min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col shadow-2xl">
        <div className="sticky top-0 bg-white px-4 sm:px-8 pt-4 sm:pt-6 pb-4 border-b border-slate-100 flex justify-between items-start z-10 sm:rounded-t-xl">
          <div className="pr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              {isWaitlistMode ? 'Join Beta Waiting List' : 'Get Early Access'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {isWaitlistMode 
                ? "We're at capacity but we'll notify you when spots open."
                : `${betaStatus?.slotsAvailable || 0} spots remaining out of ${betaStatus?.maxTesters || 15}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">

        {submitStatus ? (
          <div className={`p-4 rounded-lg mb-6 ${submitStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2">
              {submitStatus.success ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <p className="font-medium">{submitStatus.message}</p>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone Number (optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., London, Manchester, Edinburgh"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Business Size (optional)
            </label>
            <select
              value={formData.businessSize}
              onChange={(e) => setFormData({ ...formData, businessSize: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            >
              <option value="">Select...</option>
              <option value="solo">Solo (just me)</option>
              <option value="2-5">Small team (2-5 people)</option>
              <option value="6-10">Growing (6-10 people)</option>
              <option value="11+">Agency (11+ people)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Services You Offer (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Dog walking, Pet sitting, Home visits"
              value={formData.servicesOffered}
              onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Tools (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Spreadsheets, Time To Pet, PetExec"
              value={formData.currentTools}
              onChange={(e) => setFormData({ ...formData, currentTools: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Website (optional)
            </label>
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Anything else you'd like us to know? (optional)
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none resize-none"
              style={{ focusRingColor: '#3F9C9B' }}
              disabled={isSubmitting || submitStatus?.success}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || submitStatus?.success}
            className="w-full px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#3F9C9B' }}
          >
            {isSubmitting ? 'Submitting...' : isWaitlistMode ? 'Join Waiting List' : 'Get Early Access'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
