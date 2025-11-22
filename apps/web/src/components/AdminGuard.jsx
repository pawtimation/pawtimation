import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../lib/auth';

export function AdminGuard({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const session = getSession('ADMIN');
    
    if (session && session.token) {
      const isAdminUser = session.role === 'ADMIN' && (session.isAdmin === true || session.userSnapshot?.isAdmin === true);
      setIsAdmin(isAdminUser);
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
          <p className="text-sm text-rose-600 mt-2">Please log in with an admin account.</p>
          <a href="/admin/login" className="inline-block mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return children;
}
