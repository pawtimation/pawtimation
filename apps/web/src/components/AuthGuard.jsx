import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/auth';

export function AuthGuard({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('pt_user');
    const storedToken = localStorage.getItem('pt_token');
    
    if (storedUser && storedToken) {
      try {
        auth.user = JSON.parse(storedUser);
        auth.token = storedToken;
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    const fullPath = location.pathname + location.search + location.hash;
    return <Navigate to={`/auth/signin?returnTo=${encodeURIComponent(fullPath)}`} replace />;
  }

  return children;
}
