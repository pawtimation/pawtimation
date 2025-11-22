import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';

export function AuthGuard({ children, role = 'STAFF' }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const session = getSession(role);
    
    if (session && session.token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    
    setIsReady(true);
  }, [role]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search + location.hash;
    
    const loginPath = role === 'STAFF' 
      ? `/staff/login?returnTo=${encodeURIComponent(fullPath)}`
      : `/client/login?returnTo=${encodeURIComponent(fullPath)}`;
    
    return <Navigate to={loginPath} replace />;
  }

  return children;
}
