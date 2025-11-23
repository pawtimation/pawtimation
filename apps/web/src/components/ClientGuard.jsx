import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, clientApi, clearSession, setSession } from '../lib/auth';

// In-memory validation cache (not localStorage to prevent tampering)
const validationCache = new Map();
const CACHE_FRESHNESS_MS = 3 * 60 * 1000; // 3 minutes

function getCacheKey(token) {
  // Simple fingerprint based on token (could use first/last chars for security)
  return token ? token.substring(0, 20) : null;
}

function getCachedValidation(token) {
  const key = getCacheKey(token);
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

function setCachedValidation(token, data) {
  const key = getCacheKey(token);
  if (!key) return;
  
  validationCache.set(key, {
    timestamp: Date.now(),
    data
  });
}

function clearValidationCache() {
  validationCache.clear();
}

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
        clearValidationCache();
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Check in-memory cache first (fast path)
      const cached = getCachedValidation(session.token);
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
            clearValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }

          const data = await response.json();
          
          // Verify valid client data
          if (!data || !data.id) {
            clearSession('CLIENT');
            clearValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }
          
          // Verify business scope if available
          if (data.businessId && session.businessId && data.businessId !== session.businessId) {
            console.error('ClientGuard: Business scope mismatch');
            clearSession('CLIENT');
            clearValidationCache();
            setAllowed(false);
            setChecked(true);
            return;
          }
          
          // Success - update session with authoritative server data
          const authoritativeUser = {
            id: data.userId || session.userId,
            email: data.email || session.email,
            name: data.name || session.name,
            businessId: data.businessId || session.businessId,
            crmClientId: data.id,
            role: 'client',
            isAdmin: false
          };
          
          setSession('CLIENT', {
            token: session.token,
            user: authoritativeUser,
            expiry: session.expiry
          });
          
          // Cache validation result in memory
          setCachedValidation(session.token, data);
          
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
      clearValidationCache();
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
