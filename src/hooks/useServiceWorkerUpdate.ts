import { useState, useEffect, useCallback } from 'react';

/**
 * Detects when a new Service Worker is available and provides
 * a function to apply the update (skipWaiting + reload).
 * 
 * With autoUpdate + skipWaiting in vite.config, the SW updates
 * automatically. This hook serves as a fallback UI notification.
 */
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      // New SW took control – reload once
      console.log('[SW] Controller changed – reloading');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready.then((registration) => {
      // If there's already a waiting worker on load
      if (registration.waiting) {
        console.log('[SW] Waiting worker found on load – auto-activating');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
      }

      // Listen for new SW installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        console.log('[SW] Update found – new worker installing');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New worker installed – sending SKIP_WAITING');
            // Auto-activate: send SKIP_WAITING immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    });

    // Check for updates frequently (every 15s)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update();
      });
    }, 15_000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback: just reload
      window.location.reload();
    }
  }, [waitingWorker]);

  const checkForUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
        return true;
      }
    }
    return false;
  }, []);

  return { updateAvailable, applyUpdate, checkForUpdate };
}
