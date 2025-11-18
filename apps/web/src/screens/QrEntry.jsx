import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function QrEntry() {
  const navigate = useNavigate();
  const { businessId } = useParams();

  useEffect(() => {
    if (businessId) {
      navigate(`/client/register?biz=${businessId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [businessId, navigate]);

  return (
    <div className="min-h-[200px] flex items-center justify-center text-sm text-slate-500">
      Opening signup…
    </div>
  );
}
