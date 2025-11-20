import { useEffect, useCallback, useState } from 'react';
import { useDataRefresh } from '../contexts/DataRefreshContext';

export function useAutoRefresh(fetchFunction, options = {}) {
  const {
    intervalMs = 30000,
    scope = 'default',
    enabled = true,
    dependencies = []
  } = options;

  const { scopedTriggers, startAutoRefresh, stopAutoRefresh } = useDataRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error(`[useAutoRefresh] Error fetching data:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData, scopedTriggers[scope]]);

  useEffect(() => {
    if (!enabled) {
      stopAutoRefresh(scope);
      return;
    }

    const cleanup = startAutoRefresh(scope, intervalMs);
    return cleanup;
  }, [enabled, scope, intervalMs, startAutoRefresh, stopAutoRefresh]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}

export function useManualRefresh(fetchFunction, scope = 'global', dependencies = []) {
  const { scopedTriggers } = useDataRefresh();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error(`[useManualRefresh] Error fetching data:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData, scopedTriggers[scope]]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh
  };
}
