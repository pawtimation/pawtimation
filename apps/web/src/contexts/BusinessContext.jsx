import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/auth';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(auth.user);

  // Subscribe to auth changes via custom event
  useEffect(() => {
    const handleAuthChange = () => {
      setAuthUser(auth.user);
    };
    
    // Listen for businessNameUpdated event (already used in app)
    window.addEventListener('businessNameUpdated', handleAuthChange);
    
    // Also poll auth.user periodically as fallback
    const interval = setInterval(() => {
      if (auth.user !== authUser) {
        setAuthUser(auth.user);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('businessNameUpdated', handleAuthChange);
      clearInterval(interval);
    };
  }, [authUser]);

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
    setAuthUser(auth.user);
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
