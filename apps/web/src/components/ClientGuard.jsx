import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { repo } from '../../api/src/repo.js';

export function ClientGuard({ children }) {
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client');
      if (!raw) {
        setAllowed(false);
        setChecked(true);
        return;
      }
      const { clientId } = JSON.parse(raw);
      const client = await repo.getClient(clientId);
      
      if (!client) {
        setAllowed(false);
        setChecked(true);
        return;
      }

      const isOnboarding = location.pathname.startsWith('/client/onboarding');

      if (client.profileComplete || isOnboarding) {
        setAllowed(true);
      } else {
        setAllowed(false);
      }
      setChecked(true);
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
