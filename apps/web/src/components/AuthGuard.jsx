import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';

export function AuthGuard({ children, role = 'STAFF', allowedRoles = null }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Support multiple allowed roles
    const rolesToCheck = allowedRoles || [role];
    
    let foundSession = false;
    for (const roleToCheck of rolesToCheck) {
      const session = getSession(roleToCheck);
      if (session && session.token) {
        foundSession = true;
        break;
      }
    }
    
    setIsAuthenticated(foundSession);
    setIsReady(true);
  }, [role, allowedRoles]);

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
