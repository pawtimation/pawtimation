import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

export function ClientGuard({ children }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      // Check for pt_client first, fallback to pt_user for backward compatibility
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      const token = localStorage.getItem('pt_token');
      
      if (!raw || !token) {
        setAllowed(false);
        setChecked(true);
        return;
      }

      let clientId;
      try {
        const parsed = JSON.parse(raw);
        
        // Check if this is a client user
        if (parsed.role !== 'client') {
          setAllowed(false);
          setChecked(true);
          return;
        }
        
        // Get clientId from either crmClientId or clientId field
        clientId = parsed.crmClientId || parsed.clientId;
        
        if (!clientId) {
          setAllowed(false);
          setChecked(true);
          return;
        }
      } catch {
        setAllowed(false);
        setChecked(true);
        return;
      }

      // Fetch client data from API
      try {
        const response = await fetch(`${API_BASE}/clients/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          setAllowed(false);
          setChecked(true);
          return;
        }

        const client = await response.json();
        
        const isOnboarding = location.pathname.startsWith('/client/onboarding');

        if (client.profileComplete || isOnboarding) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
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

  if (!allowed && !location.pathname.startsWith('/client/onboarding')) {
    return <Navigate to="/client/onboarding" replace />;
  }

  return children;
}
