import React, { createContext, useContext, useState, useCallback } from 'react';
import { ErrorToastContainer } from '../components/ErrorToast';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([]);
  const [recentMessages, setRecentMessages] = useState(new Map());

  const showError = useCallback((message, duration = 5000) => {
    const now = Date.now();
    const messageKey = message.substring(0, 50);
    
    const lastShown = recentMessages.get(messageKey);
    if (lastShown && now - lastShown < 3000) {
      return null;
    }
    
    setRecentMessages(prev => {
      const newMap = new Map(prev);
      newMap.set(messageKey, now);
      
      if (newMap.size > 20) {
        const oldestKey = Array.from(newMap.keys())[0];
        newMap.delete(oldestKey);
      }
      
      return newMap;
    });
    
    const id = Date.now() + Math.random();
    const newError = { id, message, duration };
    
    setErrors(prev => [...prev, newError]);

    if (duration > 0) {
      setTimeout(() => {
        setErrors(prev => prev.filter(e => e.id !== id));
      }, duration);
    }

    return id;
  }, [recentMessages]);

  const dismissError = useCallback((id) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, dismissError, clearErrors }}>
      {children}
      <ErrorToastContainer errors={errors} onDismiss={dismissError} />
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
