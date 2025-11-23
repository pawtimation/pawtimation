import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, clientApi, clearSession, setSession, registerClientValidationCacheInvalidator } from '../lib/auth';

// In-memory validation cache (not localStorage to prevent tampering)
const validationCache = new Map();
const CACHE_FRESHNESS_MS = 3 * 60 * 1000; // 3 minutes

function computeValidationKey({ token, expiry, role }) {
  if (!token || !role) return null;
  // Create fingerprint from token (first 12 + last 6 chars) + role + expiry
  const tokenFingerprint = `${token.slice(0, 12)}:${token.slice(-6)}`;
  return `${role}:${tokenFingerprint}:${expiry || ''}`;
}

function getCachedValidation({ token, expiry, role }) {
  const key = computeValidationKey({ token, expiry, role });
  if (!key) return null;
  
  const cached = validationCache.get(key);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_FRESHNESS_MS) {
    validationCache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedValidation({ token, expiry, role }, data) {
  const key = computeValidationKey({ token, expiry, role });
  if (!key) return;
  
  validationCache.set(key, {
    timestamp: Date.now(),
    data
  });
}

// Export for use in auth.js to invalidate cache on session changes
export function invalidateClientValidationCache() {
  validationCache.clear();
}

// Register cache invalidator with auth module
registerClientValidationCacheInvalidator(invalidateClientValidationCache);

export function ClientGuard({ children }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const session = getSession('CLIENT');
      
      // Reject if no session or token
      if (!session || !session.token) {
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Reject if wrong role
      if (session.role !== 'CLIENT') {
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Check token expiry  
      if (session.expiry && new Date(session.expiry) < new Date()) {
        clearSession('CLIENT');
        invalidateClientValidationCache();
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Check in-memory cache first (fast path)
      const cached = getCachedValidation({ 
        token: session.token, 
        expiry: session.expiry, 
        role: session.role 
      });
      if (cached && cached.id) {
        setAllowed(true);
        setChecked(true);
        return;
      }

      // No cache or expired - validate with server using retry/backoff
      const maxRetries = 5;
      const baseDelay = 200;
      let lastError = null;
      let lastStatus = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await clientApi('/me');
          lastStatus = response.status;
          
          if (!response.ok) {
            if (attempt < maxRetries && (response.status === 401 || response.status === 403)) {
              // Cookie may not be ready, retry with exponential backoff + jitter
              const jitter = Math.random() * 100;
              const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            // Persistent auth failure
            clearSession('CLIENT');
            invalidateClientValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }

          const data = await response.json();
          
          // Verify valid client data
          if (!data || !data.id) {
            clearSession('CLIENT');
            invalidateClientValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }
          
          // Verify business scope if available
          if (data.businessId && session.businessId && data.businessId !== session.businessId) {
            console.error('ClientGuard: Business scope mismatch');
            clearSession('CLIENT');
            invalidateClientValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }
          
          // Success - update session with authoritative server data
          const refreshedToken = data.token || session.token;
          const refreshedExpiry = data.tokenExpiry || session.expiry;
          
          // Enhance server data with correct field mapping for setSession
          // /client/me returns client object where id = client CRM ID
          const authoritativeUser = {
            ...data, // Preserve all server fields first
            crmClientId: data.id, // Client CRM ID (required for setSession extraction) - override to ensure it exists
            id: data.userId || session.userId, // User account ID - override client ID
            email: data.email || session.email, // Override with fallback
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || session.name, // Formatted name
            businessId: data.businessId || session.businessId, // Override with fallback
            role: 'CLIENT', // Override to ensure correct role
            isAdmin: false // Override to ensure correct admin flag
          };
          
          setSession('CLIENT', {
            token: refreshedToken,
            user: authoritativeUser, // setSession extracts crmClientId and stores full object as userSnapshot
            expiry: refreshedExpiry
          });
          
          // Cache validation result using refreshed token/expiry
          setCachedValidation({ 
            token: refreshedToken, 
            expiry: refreshedExpiry, 
            role: 'CLIENT' 
          }, data);
          
          setAllowed(true);
          setChecked(true);
          return;
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries) {
            const jitter = Math.random() * 100;
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }
      
      // All retries exhausted - clear corrupted session
      console.error('ClientGuard: Validation failed after', maxRetries, 'attempts. Last error:', lastError, 'Last status:', lastStatus);
      clearSession('CLIENT');
      invalidateClientValidationCache();
      setAllowed(false);
      setChecked(true);
    })();
  }, [location.pathname]);

  if (!checked) {
    return <p className="text-sm text-slate-600 px-4 py-6">Checking your account…</p>;
  }

  if (!allowed) {
    return <Navigate to="/client/login" replace />;
  }

  return children;
}
