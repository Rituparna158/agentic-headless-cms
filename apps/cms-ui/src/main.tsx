import './utils/suppressLogs';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initWebVitals } from './utils/webVitals';
import { initAxeDev } from './utils/axeDev';

initWebVitals();
initAxeDev();

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
