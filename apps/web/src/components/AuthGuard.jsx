import React, { useEffect, useState } from 'react';
import { auth } from '../lib/auth';

export function AuthGuard({ children, onRedirect }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('pt_user');
    const storedToken = localStorage.getItem('pt_token');
    
    if (storedUser && storedToken) {
      try {
        auth.user = JSON.parse(storedUser);
        auth.token = storedToken;
        setIsReady(true);
      } catch (e) {
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_token');
        onRedirect();
      }
    } else {
      onRedirect();
    }
  }, [onRedirect]);

  if (!isReady || !auth.user) {
    return null;
  }

  return children;
}
