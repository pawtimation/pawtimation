import { useState } from 'react';
import { getSession, setSession, adminApi } from '../lib/auth';

export function MasqueradeBanner() {
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  
  const session = getSession('ADMIN');
  
  // Read persisted masquerade context (survives token refreshes)
  let masqueradeContext = null;
  try {
    const stored = localStorage.getItem('masqueradeContext');
    if (stored) {
      masqueradeContext = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to parse masquerade context:', err);
  }
  
  // Check for masquerade mode: prefer persisted context, fall back to JWT
  let isMasquerading = false;
  let masqueradingFrom = null;
  let businessName = null;
  
  if (masqueradeContext) {
    // Use persisted context (most reliable across refreshes)
    isMasquerading = true;
    masqueradingFrom = masqueradeContext.adminUserId;
    businessName = masqueradeContext.businessName;
  } else if (session?.token) {
    // Fall back to JWT decoding if no persisted context
    try {
      const base64Url = session.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(paddedBase64));
      
      isMasquerading = !!payload.masqueradeBy;
      masqueradingFrom = payload.masqueradeBy;
      businessName = session.userSnapshot?.businessName || 'Business Admin';
    } catch (err) {
      console.error('Failed to decode JWT:', err);
    }
  }
  
  if (!isMasquerading) return null;

  async function handleEndMasquerade() {
    if (!masqueradingFrom) {
      setError('Cannot end masquerade - missing super admin ID');
      return;
    }

    setEnding(true);
    setError('');

    try {
      const response = await adminApi('/admin/masquerade/exit', {
        method: 'POST',
        body: { adminUserId: masqueradingFrom }
      });

      if (!response.ok) {
        throw new Error('Failed to end masquerade');
      }

      const data = await response.json();
      
      // Validate response data
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Clear masquerade context
      localStorage.removeItem('masqueradeContext');
      
      // Clear the masquerade ADMIN session completely
      localStorage.removeItem('session_ADMIN');
      
      // Clear the auth token cookie (masquerade session cookie)
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
      
      // Restore the original super admin session
      if (data.user.isSuperAdmin) {
        setSession('SUPER_ADMIN', {
          token: data.token,
          user: data.user
        });
        
        // Navigate back to owner portal
        window.location.href = '/owner';
      } else {
        // Regular admin - restore ADMIN session
        setSession('ADMIN', {
          token: data.token,
          user: data.user
        });
        
        // Navigate to admin portal
        window.location.href = '/admin';
      }
    } catch (err) {
      console.error('Failed to end masquerade:', err);
      setError(err.message || 'Failed to end masquerade session');
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm">Super Admin Masquerade Mode</div>
            <div className="text-xs text-purple-200">
              Viewing as business admin {businessName ? `for "${businessName}"` : ''}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {error && (
            <div className="text-xs bg-red-500/20 border border-red-400 px-3 py-1 rounded">
              {error}
            </div>
          )}
          <button
            onClick={handleEndMasquerade}
            disabled={ending}
            className="px-4 py-2 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ending ? 'Ending...' : 'End Masquerade'}
          </button>
        </div>
      </div>
    </div>
  );
}
