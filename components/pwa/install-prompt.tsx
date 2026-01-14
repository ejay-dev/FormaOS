'use client';

/**
 * =========================================================
 * PWA Install Prompt Component
 * =========================================================
 * Encourage users to install the app
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
            <Download className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">Install FormaOS</h3>
            <p className="text-sm text-blue-100 mb-3">
              Install our app for faster access and offline support. Works just
              like a native app!
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 rounded-lg font-medium hover:bg-white/30 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Benefits list */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <div className="font-semibold">⚡ Faster</div>
              <div className="text-blue-100">Instant loading</div>
            </div>
            <div>
              <div className="font-semibold">📱 Native</div>
              <div className="text-blue-100">App experience</div>
            </div>
            <div>
              <div className="font-semibold">🔔 Offline</div>
              <div className="text-blue-100">Works anywhere</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
