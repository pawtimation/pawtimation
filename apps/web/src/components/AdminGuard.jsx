import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/auth';

export function AdminGuard({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('pt_user');
    const storedToken = localStorage.getItem('pt_token');
    
    if (storedUser && storedToken) {
      try {
        auth.user = JSON.parse(storedUser);
        auth.token = storedToken;
        setIsAdmin(auth.user?.isAdmin === true);
      } catch (e) {
        localStorage.removeItem('pt_user');
        localStorage.removeItem('pt_token');
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center">
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-rose-800 mb-3">Access Denied</h2>
          <p className="text-rose-700">You do not have permission to access the admin area.</p>
        </div>
      </div>
    );
  }

  return children;
}
