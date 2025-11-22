import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';

const BusinessContext = createContext(null);

function getCurrentSessionForRoute(pathname) {
  // Route-aware session selection to prevent cross-portal leakage
  if (pathname.startsWith('/client')) {
    return getSession('CLIENT');
  }
  if (pathname.startsWith('/staff')) {
    return getSession('STAFF');
  }
  if (pathname.startsWith('/owner')) {
    return getSession('SUPER_ADMIN');
  }
  // For admin routes or neutral routes, prefer admin
  return getSession('ADMIN') || getSession('STAFF') || getSession('CLIENT') || getSession('SUPER_ADMIN');
}

export function BusinessProvider({ children }) {
  const location = useLocation();
  const prevPathname = useRef('');
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(() => {
    const session = getCurrentSessionForRoute(window.location.pathname);
    return session?.userSnapshot || null;
  });

  // Update session when route changes
  useEffect(() => {
    const session = getCurrentSessionForRoute(location.pathname);
    const newUser = session?.userSnapshot || null;
    if (JSON.stringify(newUser) !== JSON.stringify(authUser)) {
      setAuthUser(newUser);
    }
  }, [location.pathname]);

  // Subscribe to auth events and polling (once on mount)
  useEffect(() => {
    const handleAuthChange = () => {
      // Use current pathname at time of event, not mount-time pathname
      const session = getCurrentSessionForRoute(window.location.pathname);
      setAuthUser(session?.userSnapshot || null);
    };
    
    // Listen for businessNameUpdated event (already used in app)
    window.addEventListener('businessNameUpdated', handleAuthChange);
    
    // Also poll session periodically as fallback
    const interval = setInterval(() => {
      // Use current pathname, not mount-time pathname, to prevent session leakage
      const session = getCurrentSessionForRoute(window.location.pathname);
      const currentUser = session?.userSnapshot || null;
      // Only update if data actually changed
      setAuthUser((prev) => {
        if (JSON.stringify(currentUser) !== JSON.stringify(prev)) {
          return currentUser;
        }
        return prev;
      });
    }, 1000);
    
    return () => {
      window.removeEventListener('businessNameUpdated', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  // Update business when authUser changes
  useEffect(() => {
    if (authUser && authUser.businessId) {
      setBusiness({
        id: authUser.businessId,
        name: authUser.businessName || 'Your Business'
      });
      setLoading(false);
    } else {
      setBusiness(null);
      setLoading(false);
    }
  }, [authUser?.businessId, authUser?.businessName]);

  const refreshBusiness = () => {
    // Use current pathname, not potentially stale location.pathname
    const session = getCurrentSessionForRoute(window.location.pathname);
    setAuthUser(session?.userSnapshot || null);
  };

  return (
    <BusinessContext.Provider value={{ business, loading, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
