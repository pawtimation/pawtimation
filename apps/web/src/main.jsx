import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './screens/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DataRefreshProvider } from './contexts/DataRefreshContext';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <DataRefreshProvider>
      <App />
    </DataRefreshProvider>
  </ErrorBoundary>
)
