import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone === true;
      
      if (standalone) {
        setIsInstallable(false);
        return;
      }

      setIsInstallable(!!(window as any).deferredPrompt);
    };

    // Run initial check
    checkStatus();

    // Listen to standard and custom events to update reactive state instantly
    const handleReady = () => setIsInstallable(true);
    const handleClosed = () => setIsInstallable(false);

    window.addEventListener('beforeinstallprompt', handleReady);
    window.addEventListener('pwaPromptReady', handleReady);
    window.addEventListener('pwaPromptClosed', handleClosed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleReady);
      window.removeEventListener('pwaPromptReady', handleReady);
      window.removeEventListener('pwaPromptClosed', handleClosed);
    };
  }, []);

  const triggerInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      setIsInstallable(false);
      return;
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
    } catch (err) {
      console.error('[PWA] Error launching installation prompt:', err);
    } finally {
      (window as any).deferredPrompt = null;
      window.dispatchEvent(new CustomEvent('pwaPromptClosed'));
      setIsInstallable(false);
    }
  };

  return { isInstallable, triggerInstall };
}
