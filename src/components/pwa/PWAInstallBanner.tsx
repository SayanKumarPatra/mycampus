import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, ArrowUpFromLine, PlusSquare, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if the app is already running as a standalone PWA
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);
    if (checkStandalone) return;

    // 2. Detect iOS platform
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);

    // 3. Listen for Chrome / Android beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwaPromptReady'));
      // Automatically prompt the user by displaying our gorgeous banner
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Global trigger function accessible anywhere in the app (e.g. Login, Register footers)
    (window as any).triggerPwaInstall = async () => {
      const gPrompt = (window as any).deferredPrompt;
      if (gPrompt) {
        try {
          await gPrompt.prompt();
          const { outcome } = await gPrompt.userChoice;
          console.log(`[PWA] Global trigger installer outcome: ${outcome}`);
          (window as any).deferredPrompt = null;
          setDeferredPrompt(null);
          setIsVisible(false);
        } catch (err) {
          console.error('[PWA] Global installation prompt error:', err);
        }
      } else {
        // If no prompt event, dispatch custom alert or let user know how to add
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches 
          || (window.navigator as any).standalone === true;
        if (checkStandalone) {
          alert("MyCampus is already installed as a standalone transition-secure application on your device list!");
        } else {
          // If iOS
          const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
          if (detectIOS) {
            alert("To install on iOS: Tap the Share button in Safari, then select 'Add to Home Screen'.");
          } else {
            alert("To install, open this page in Chrome/Edge, or click 'Add to Home Screen' in your browser options menu!");
          }
        }
      }
    };

    // If on iOS and not standalone, show the instruction prompt after a short delay to feel natural
    if (detectIOS && !checkStandalone) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000); // 4 seconds delay feels organic
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Trigger the real system installation prompt
    await deferredPrompt.prompt();

    // Check user decision
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install choice outcome: ${outcome}`);

    // Clean up
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Do not render anything if already installed as standalone
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="pwa-install-banner"
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 overflow-hidden"
        >
          {/* Main Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#5d0e31] via-[#7A0F3A] to-[#35081b] border border-white/10 shadow-2xl shadow-black/60 text-white">
            
            {/* Background Ambient Spotlights */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#ff9d4d]/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

            {/* Close Button */}
            <button
              id="pwa-close-btn"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Dismiss prompt"
            >
              <X size={16} />
            </button>

            {/* Content Layout */}
            <div className="flex gap-4 items-start">
              {/* Icon Shield */}
              <div className="flex-shrink-0 p-3 rounded-xl bg-white/10 border border-white/10 shadow-inner text-[#ff9d4d]">
                <Smartphone size={28} className="animate-pulse" />
              </div>

              {/* Title & Description */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-[#ff9d4d] bg-white/10 px-2 py-0.5 rounded-full">
                    Official App
                  </span>
                  <Sparkles size={11} className="text-[#ff9d4d] animate-bounce" />
                </div>
                <h3 className="mt-1.5 text-base font-bold font-sans tracking-tight leading-snug">
                  Install MyCampus
                </h3>
                <p className="mt-1 text-xs text-white/80 leading-relaxed font-sans font-medium">
                  Add to your home screen for high-performance offline portal operations, calendar sync, and real-time alerts.
                </p>
              </div>
            </div>

            {/* Installation Action Section */}
            <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-end">
              {!isIOS ? (
                /* Android / Chrome Native Prompt */
                <div className="flex items-center gap-2.5 w-full">
                  <button
                    id="pwa-later-btn"
                    onClick={handleDismiss}
                    className="flex-1 py-2 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5"
                  >
                    Maybe Later
                  </button>
                  <button
                    id="pwa-action-btn"
                    onClick={handleInstallClick}
                    disabled={!deferredPrompt}
                    className="flex-1 py-2 px-4 text-xs font-bold text-white bg-gradient-to-r from-[#ff9d4d] to-[#ff6a13] hover:from-[#ffa75e] hover:to-[#ff7524] rounded-xl shadow-lg shadow-[#ff6a13]/20 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} />
                    Install Now
                  </button>
                </div>
              ) : (
                /* iOS Custom Instructions */
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-white/90 flex items-center justify-center gap-2 flex-wrap">
                    To install on iOS: Tap <ArrowUpFromLine size={14} className="text-[#ff9d4d]" /> Share, then scroll down and choose <span className="text-[#ff9d4d] font-bold inline-flex items-center gap-1"><PlusSquare size={13} /> Add to Home Screen</span>.
                  </p>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
