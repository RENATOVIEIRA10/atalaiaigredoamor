import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';

export function usePolicyAcceptance(accessKeyId: string | null) {
  const [accepted, setAccepted] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    if (!accessKeyId) {
      setAccepted(null);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const { data } = await supabase
          .from('policy_acceptances')
          .select('id')
          .eq('access_key_id', accessKeyId!)
          .eq('policy_version', POLICY_VERSION)
          .maybeSingle();

        if (!cancelled) {
          setAccepted(!!data);
        }
      } catch {
        if (!cancelled) setAccepted(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [accessKeyId]);

  return accepted;
}
