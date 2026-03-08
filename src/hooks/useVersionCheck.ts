/**
 * Runtime version check: detects when the deployed build has changed
 * and forces a hard reload + cache clear to bust stale assets.
 *
 * 1. At build time, Vite generates /version.json with a unique BUILD_ID.
 * 2. On mount (and periodically), we fetch /version.json with cache: 'no-store'.
 * 3. If the server version differs from the local one, we clear all caches
 *    and force-reload the page.
 */
import { useEffect } from 'react';

declare const __APP_BUILD_ID__: string;

const LOCAL_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const RELOAD_FLAG = '__app_reloaded_for_update__';
const VERSION_KEY = '__app_version__';

/** Clear all browser caches (Cache API + optionally SW) */
async function clearAllCaches() {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    console.log('[VersionCheck] Cleared', keys.length, 'cache(s)');
  } catch (e) {
    console.warn('[VersionCheck] Cache clear failed:', e);
  }
}

/** Force-update the service worker if one exists */
async function forceUpdateSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  } catch (e) {
    console.warn('[VersionCheck] SW update failed:', e);
  }
}

async function checkVersion() {
  // Don't run in dev mode
  if (import.meta.env.DEV) {
    console.log('[VersionCheck] DEV mode – skipping');
    return;
  }

  // Prevent infinite reload loop
  if (sessionStorage.getItem(RELOAD_FLAG)) {
    sessionStorage.removeItem(RELOAD_FLAG);
    console.log('[VersionCheck] Post-reload check – version:', LOCAL_BUILD_ID);
    localStorage.setItem(VERSION_KEY, LOCAL_BUILD_ID);
    return;
  }

  try {
    const res = await fetch('/version.json?_t=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
    });
    if (!res.ok) {
      // Fallback to old index.html method
      await checkVersionFallback();
      return;
    }

    const data = await res.json();
    const serverVersion = data.version;
    const storedVersion = localStorage.getItem(VERSION_KEY);

    console.log('[VersionCheck] local:', LOCAL_BUILD_ID, '| server:', serverVersion, '| stored:', storedVersion);

    // If server version differs from what we're running
    if (serverVersion && serverVersion !== LOCAL_BUILD_ID) {
      console.log('[VersionCheck] 🔄 New build detected! Clearing caches and reloading…');
      sessionStorage.setItem(RELOAD_FLAG, '1');
      
      await clearAllCaches();
      await forceUpdateSW();
      
      localStorage.setItem(VERSION_KEY, serverVersion);
      
      // Force hard reload
      window.location.href = window.location.pathname + '?_v=' + Date.now();
    }
  } catch (err) {
    console.warn('[VersionCheck] Check failed:', err);
    // Try fallback
    await checkVersionFallback();
  }
}

/** Fallback: compare script hashes from index.html (original method) */
async function checkVersionFallback() {
  try {
    const res = await fetch('/?_vc=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    if (!res.ok) return;

    const html = await res.text();
    const match = html.match(/src="(\/assets\/[^"]+\.js)"/);
    if (!match) return;

    const serverScriptSrc = match[1];
    const scripts = document.querySelectorAll('script[type="module"][src]');
    let currentScriptSrc: string | null = null;
    for (const s of scripts) {
      const src = s.getAttribute('src') || '';
      if (src.includes('/assets/') && src.endsWith('.js')) {
        currentScriptSrc = src;
        break;
      }
    }

    if (currentScriptSrc && serverScriptSrc !== currentScriptSrc) {
      console.log('[VersionCheck] Fallback: new build detected, reloading…');
      sessionStorage.setItem(RELOAD_FLAG, '1');
      await clearAllCaches();
      await forceUpdateSW();
      window.location.href = window.location.pathname + '?_v=' + Date.now();
    }
  } catch (err) {
    console.warn('[VersionCheck] Fallback check failed:', err);
  }
}

/** Public: force clear all caches and reload (for admin/dev use) */
export async function forceClearAndReload() {
  console.log('[VersionCheck] 🧹 Manual force-clear triggered');
  sessionStorage.setItem(RELOAD_FLAG, '1');
  
  await clearAllCaches();
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
    console.log('[VersionCheck] Unregistered', registrations.length, 'SW(s)');
  }
  
  localStorage.removeItem(VERSION_KEY);
  window.location.href = window.location.pathname + '?_v=' + Date.now();
}

export function useVersionCheck() {
  useEffect(() => {
    // Log diagnostics on mount
    if (!import.meta.env.DEV) {
      console.log('[VersionCheck] 📋 Build:', LOCAL_BUILD_ID);
      console.log('[VersionCheck] 📋 Stored:', localStorage.getItem(VERSION_KEY));
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          console.log('[VersionCheck] 📋 SW controller:', !!navigator.serviceWorker.controller);
          console.log('[VersionCheck] 📋 SW waiting:', !!reg?.waiting);
          console.log('[VersionCheck] 📋 SW installing:', !!reg?.installing);
        });
      }
    }

    // Check immediately on mount
    checkVersion();

    // Check every 60 seconds (prod) 
    const interval = setInterval(checkVersion, 60_000);
    return () => clearInterval(interval);
  }, []);
}
