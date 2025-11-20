import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const DataRefreshContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

export function DataRefreshProvider({ children }) {
  const [scopedTriggers, setScopedTriggers] = useState({});
  const intervalRefs = useRef(new Map());
  const socketRef = useRef(null);

  const triggerRefresh = useCallback((scope = 'global') => {
    setScopedTriggers(prev => ({
      ...prev,
      [scope]: (prev[scope] || 0) + 1
    }));
  }, []);

  const startAutoRefresh = useCallback((scope, intervalMs = 30000) => {
    if (intervalRefs.current.has(scope)) {
      clearInterval(intervalRefs.current.get(scope));
    }

    const intervalId = setInterval(() => {
      triggerRefresh(scope);
    }, intervalMs);

    intervalRefs.current.set(scope, intervalId);
    console.log(`[DataRefresh] Started auto-refresh for ${scope} every ${intervalMs}ms`);

    return () => {
      clearInterval(intervalId);
      intervalRefs.current.delete(scope);
    };
  }, [triggerRefresh]);

  const stopAutoRefresh = useCallback((scope) => {
    if (intervalRefs.current.has(scope)) {
      clearInterval(intervalRefs.current.get(scope));
      intervalRefs.current.delete(scope);
      console.log(`[DataRefresh] Stopped auto-refresh for ${scope}`);
    }
  }, []);

  useEffect(() => {
    // Connect to socket.io for real-time updates
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[DataRefresh] Connected to real-time updates');
    });

    socket.on('disconnect', () => {
      console.log('[DataRefresh] Disconnected from real-time updates');
    });

    // Listen for booking events
    socket.on('booking:created', () => {
      console.log('[DataRefresh] Booking created event received');
      triggerRefresh('bookings');
      triggerRefresh('calendar');
      triggerRefresh('stats');
    });

    socket.on('booking:updated', () => {
      console.log('[DataRefresh] Booking updated event received');
      triggerRefresh('bookings');
      triggerRefresh('calendar');
      triggerRefresh('stats');
    });

    socket.on('booking:deleted', () => {
      console.log('[DataRefresh] Booking deleted event received');
      triggerRefresh('bookings');
      triggerRefresh('calendar');
      triggerRefresh('stats');
    });

    // Listen for invoice events
    socket.on('invoice:created', () => {
      console.log('[DataRefresh] Invoice created event received');
      triggerRefresh('invoices');
      triggerRefresh('stats');
    });

    socket.on('invoice:updated', () => {
      console.log('[DataRefresh] Invoice updated event received');
      triggerRefresh('invoices');
      triggerRefresh('stats');
    });

    // Listen for stats events
    socket.on('stats:changed', () => {
      console.log('[DataRefresh] Stats changed event received');
      triggerRefresh('stats');
    });

    return () => {
      socket.disconnect();
      intervalRefs.current.forEach(intervalId => clearInterval(intervalId));
      intervalRefs.current.clear();
    };
  }, [triggerRefresh]);

  const value = {
    scopedTriggers,
    triggerRefresh,
    startAutoRefresh,
    stopAutoRefresh
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within DataRefreshProvider');
  }
  return context;
}
