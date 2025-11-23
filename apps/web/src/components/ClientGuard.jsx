import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, clientApi } from '../lib/auth';

export function ClientGuard({ children }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const session = getSession('CLIENT');
      
      if (!session || !session.token) {
        setAllowed(false);
        setChecked(true);
        return;
      }

      if (session.role !== 'CLIENT') {
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Check if session has crmClientId from cache (fast path)
      const clientId = session.crmClientId || session.userSnapshot?.crmClientId;
      
      if (clientId) {
        // Session has cached client ID - allow access immediately
        setAllowed(true);
        setChecked(true);
        return;
      }

      // No cached client ID - verify via API as fallback (handles fresh sessions)
      try {
        const response = await clientApi('/me');
        
        if (!response.ok) {
          setAllowed(false);
          setChecked(true);
          return;
        }

        const data = await response.json();
        
        // Defensively check for client data (tolerates different response shapes)
        if (!data || !data.id) {
          setAllowed(false);
          setChecked(true);
          return;
        }
        
        setAllowed(true);
        setChecked(true);
      } catch (error) {
        console.error('ClientGuard error:', error);
        setAllowed(false);
        setChecked(true);
      }
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
