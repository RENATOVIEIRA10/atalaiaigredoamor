import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AuditProfile {
  user_id: string;
  name: string;
  email: string | null;
}

/**
 * Fetches profiles for a set of user_ids to resolve names for audit display.
 * Returns a map of user_id → { name, email }.
 */
export function useAuditProfiles(userIds: (string | null | undefined)[]) {
  const uniqueIds = useMemo(() => {
    const ids = userIds.filter((id): id is string => !!id);
    return [...new Set(ids)];
  }, [userIds]);

  return useQuery({
    queryKey: ['audit_profiles', uniqueIds.sort().join(',')],
    queryFn: async () => {
      if (!uniqueIds.length) return new Map<string, AuditProfile>();
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', uniqueIds);
      if (error) throw error;
      const map = new Map<string, AuditProfile>();
      (data || []).forEach(p => map.set(p.user_id, p));
      return map;
    },
    enabled: uniqueIds.length > 0,
    staleTime: 60_000,
  });
}

/**
 * Returns the current user's profile name.
 */
export function useMyProfileName() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ['my_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.name || null;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
  return data;
}
