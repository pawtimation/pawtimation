import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';
import { getSession } from '../lib/auth';

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

      const clientId = session.crmClientId || session.userSnapshot?.crmClientId;
      
      if (!clientId) {
        setAllowed(false);
        setChecked(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/clients/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });
        
        if (!response.ok) {
          setAllowed(false);
          setChecked(true);
          return;
        }

        const client = await response.json();
        
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
