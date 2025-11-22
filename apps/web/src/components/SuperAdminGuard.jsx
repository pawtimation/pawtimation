import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession, ownerApi } from '../lib/auth';

export function SuperAdminGuard({ children }) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAccess() {
      const session = getSession('SUPER_ADMIN');
      
      if (!session || !session.token || !session.userSnapshot?.isSuperAdmin) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        const res = await ownerApi('/owner/verify');
        if (res.ok) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error('Super admin verification failed:', err);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    verifyAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/owner/login" replace />;
  }

  return children;
}
