/**
 * Runtime version check: detects when the deployed build has changed
 * and forces a hard reload to bust the browser cache.
 *
 * How it works:
 * 1. Vite injects __BUILD_ID__ at build time (a unique hash per build).
 * 2. On mount, we re-fetch /index.html with cache: 'no-store' to get the
 *    latest HTML from the server, bypassing browser + CDN cache.
 * 3. We extract the main script src (which contains a Vite hash).
 * 4. If the fetched script src differs from the one in the current document,
 *    a new build is available → we force reload once.
 * 5. A sessionStorage flag prevents infinite reload loops.
 */
import { useEffect } from 'react';

const RELOAD_FLAG = '__app_reloaded_for_update__';

function getCurrentScriptSrc(): string | null {
  const scripts = document.querySelectorAll('script[type="module"][src]');
  for (const s of scripts) {
    const src = s.getAttribute('src') || '';
    // Match Vite's main entry chunk (contains hash in production)
    if (src.includes('/assets/') && src.endsWith('.js')) {
      return src;
    }
  }
  return null;
}

async function checkVersion() {
  // Don't run in dev mode (Vite HMR handles updates)
  if (import.meta.env.DEV) return;

  // Prevent infinite reload loop
  if (sessionStorage.getItem(RELOAD_FLAG)) {
    sessionStorage.removeItem(RELOAD_FLAG);
    return;
  }

  try {
    // Fetch index.html bypassing all caches
    const res = await fetch('/?_vc=' + Date.now(), {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    if (!res.ok) return;

    const html = await res.text();

    // Extract the main script src from the fetched HTML
    const match = html.match(/src="(\/assets\/[^"]+\.js)"/);
    if (!match) return;

    const serverScriptSrc = match[1];
    const currentScriptSrc = getCurrentScriptSrc();

    if (currentScriptSrc && serverScriptSrc !== currentScriptSrc) {
      console.log('[VersionCheck] New build detected, reloading…',
        { current: currentScriptSrc, server: serverScriptSrc });
      sessionStorage.setItem(RELOAD_FLAG, '1');
      // Force hard reload (bypass cache)
      window.location.href = window.location.pathname + '?_v=' + Date.now();
    }
  } catch (err) {
    // Silently fail – user will still see old version, no harm done
    console.warn('[VersionCheck] Check failed:', err);
  }
}

export function useVersionCheck() {
  useEffect(() => {
    // Check immediately on mount
    checkVersion();

    // Also check periodically (every 5 minutes)
    const interval = setInterval(checkVersion, 5 * 60_000);
    return () => clearInterval(interval);
  }, []);
}
