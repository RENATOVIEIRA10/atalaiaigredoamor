import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserAccessLink {
  id: string;
  user_id: string;
  access_key_id: string;
  scope_type: string;
  scope_id: string | null;
  rede_id: string | null;
  label: string;
  active: boolean;
  created_at: string;
}

export function useUserAccessLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<UserAccessLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    if (!user) { setLinks([]); setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_access_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (!error && data) setLinks(data as UserAccessLink[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const upsertLink = useCallback(async (accessKey: {
    id: string;
    scope_type: string;
    scope_id: string | null;
    rede_id: string | null;
  }, label: string) => {
    if (!user) return;
    // Upsert based on unique (user_id, access_key_id)
    const { error } = await supabase
      .from('user_access_links')
      .upsert({
        user_id: user.id,
        access_key_id: accessKey.id,
        scope_type: accessKey.scope_type,
        scope_id: accessKey.scope_id,
        rede_id: accessKey.rede_id,
        label,
        active: true,
      }, { onConflict: 'user_id,access_key_id' });
    if (!error) await fetchLinks();
  }, [user, fetchLinks]);

  const removeLink = useCallback(async (linkId: string) => {
    if (!user) return;
    await supabase
      .from('user_access_links')
      .update({ active: false })
      .eq('id', linkId)
      .eq('user_id', user.id);
    await fetchLinks();
  }, [user, fetchLinks]);

  return { links, isLoading, fetchLinks, upsertLink, removeLink };
}
