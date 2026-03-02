/**
 * Version Gate: forces sign-out and redirect to /auth whenever
 * the deployed build changes. Works on Desktop, Mobile, and PWA.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare const __APP_BUILD_ID__: string;

const BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev';
const VERSION_KEY = 'app_version_seen';
const SESSION_KEY = 'rede_amor_session';

export function useVersionGate() {
  const navigate = useNavigate();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // Skip in dev mode
    if (import.meta.env.DEV) return;

    const stored = localStorage.getItem(VERSION_KEY);

    // First visit ever — just store and continue
    if (!stored) {
      localStorage.setItem(VERSION_KEY, BUILD_ID);
      return;
    }

    // Same version — nothing to do
    if (stored === BUILD_ID) return;

    // === VERSION MISMATCH — force logout ===
    console.log('[VersionGate] Build changed:', stored, '→', BUILD_ID, '— forcing sign-out');

    (async () => {
      try {
        // 1. Sign out from Supabase
        await supabase.auth.signOut().catch(() => {});

        // 2. Clear app-specific localStorage keys
        const keysToRemove = [SESSION_KEY, 'lastRoute', 'lastScope', 'access_code_cache'];
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // 3. Clear sessionStorage
        sessionStorage.clear();

        // 4. Update stored version
        localStorage.setItem(VERSION_KEY, BUILD_ID);

        // 5. Show toast and redirect
        toast.info('Atualização aplicada. Por segurança, faça login novamente.');

        // 6. Hard redirect to /auth
        window.location.replace('/auth');
      } catch (err) {
        console.error('[VersionGate] Error during forced logout:', err);
        localStorage.setItem(VERSION_KEY, BUILD_ID);
        window.location.replace('/auth');
      }
    })();
  }, [navigate]);
}
