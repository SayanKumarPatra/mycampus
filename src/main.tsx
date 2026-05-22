import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any leftover service workers from previous PWA setups cleanly
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('[MyCampus] Unregistered stale PWA service worker.');
      }).catch((err) => {
        console.warn('[MyCampus] Failed to unregister stale service worker:', err);
      });
    }
  }).catch((err) => {
    console.warn('[MyCampus] Error checking service worker registrations:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

