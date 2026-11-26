import './utils/suppressLogs';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initWebVitals } from './utils/webVitals';
import { initAxeDev } from './utils/axeDev';
import { browserLogger } from '@repo/logger/browser';

initWebVitals();
initAxeDev();

// Global unhandled promise rejection listener gating debug details to DEV
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    browserLogger.error('Unhandled Promise Rejection:', {
      reason: event.reason,
    });
    if (import.meta.env.DEV) {
      // In development, show details in console
      console.error('[DEV Unhandled Rejection]', event.reason);
    }
  });

  window.addEventListener('error', (event) => {
    browserLogger.error('Global Window Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
    });
  });
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
