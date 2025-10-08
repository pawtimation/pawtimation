import { useState, useEffect } from 'react';
import { auth } from '../lib/auth';

export function usePlan() {
  const [plan, setPlan] = useState('FREE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me/plan', {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        setPlan(data.plan || 'FREE');
        // Sync to localStorage for cross-component access
        localStorage.setItem('pt_plan', (data.plan || 'FREE').toLowerCase());
      })
      .catch(() => setPlan('FREE'))
      .finally(() => setLoading(false));
  }, []);

  return { plan, loading };
}
