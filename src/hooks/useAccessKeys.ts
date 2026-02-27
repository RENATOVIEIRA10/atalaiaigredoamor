import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccessKey {
  id: string;
  scope_type: string;
  scope_id: string | null;
  code: string;
  active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  failed_attempts: number;
  created_at: string;
  // Joined data
  entity_name?: string;
}

export function useValidateAccessCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      // Normalize code
      const normalizedCode = code.trim();

      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .eq('code', normalizedCode)
        .eq('active', true)
        .single();

      if (error || !data) {
        // Try case-insensitive for admin code
        const { data: adminData, error: adminError } = await supabase
          .from('access_keys')
          .select('*')
          .ilike('code', normalizedCode)
          .eq('active', true)
          .single();

        if (adminError || !adminData) {
          throw new Error('Código inválido');
        }

        // Check failed attempts (block after 5)
        if (adminData.failed_attempts >= 5) {
          throw new Error('Código bloqueado por tentativas excessivas. Contate o administrador.');
        }

        // Update last_used_at
        await supabase
          .from('access_keys')
          .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
          .eq('id', adminData.id);

        return adminData;
      }

      // Check failed attempts
      if (data.failed_attempts >= 5) {
        throw new Error('Código bloqueado por tentativas excessivas. Contate o administrador.');
      }

      // Update last_used_at and reset attempts
      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', data.id);

      return data;
    },
  });
}

export function useIncrementFailedAttempts() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await supabase
        .from('access_keys')
        .select('id, failed_attempts')
        .eq('code', code.trim())
        .eq('active', true)
        .single();

      // Silently fail - don't reveal if code exists
      if (!data) return;

      await supabase
        .from('access_keys')
        .update({ failed_attempts: (data.failed_attempts || 0) + 1 })
        .eq('id', data.id);
    },
  });
}

export function useAccessKeys() {
  return useQuery({
    queryKey: ['access_keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_keys')
        .select('*')
        .order('scope_type')
        .order('created_at');

      if (error) throw error;

      // Ministry-level scope labels (no scope_id needed)
      const ministryLabels: Record<string, string> = {
        recomeco_cadastro: 'Recomeço (Cadastro)',
        central_celulas: 'Central de Células',
        lider_recomeco_central: 'Líder Recomeço + Central',
        lider_batismo: 'Líder do Batismo',
        lider_aclamacao: 'Líder da Aclamação',
        operador_recomeco: 'Operador Recomeço',
        operador_central: 'Operador Central',
        demo_guiada: 'Demo Guiada',
        leitura_pastoral: 'Leitura Pastoral',
      };

      // Enrich with entity names
      const enriched: AccessKey[] = [];
      for (const key of data) {
        let entityName = '';
        if (key.scope_type === 'admin') {
          entityName = 'Administrador';
        } else if (ministryLabels[key.scope_type]) {
          entityName = ministryLabels[key.scope_type];
        } else if (key.scope_id) {
          if (key.scope_type === 'celula') {
            const { data: cel } = await supabase.from('celulas').select('name').eq('id', key.scope_id).single();
            entityName = cel?.name || 'Célula desconhecida';
          } else if (key.scope_type === 'supervisor') {
            const { data: sup } = await supabase
              .from('supervisores')
              .select('profile:profiles!supervisores_profile_id_fkey(name), leadership_couple:leadership_couples(spouse1:profiles!leadership_couples_spouse1_id_fkey(name), spouse2:profiles!leadership_couples_spouse2_id_fkey(name))')
              .eq('id', key.scope_id)
              .single();
            if (sup?.leadership_couple) {
              const lc = sup.leadership_couple as any;
              entityName = `${lc.spouse1?.name || ''} & ${lc.spouse2?.name || ''}`;
            } else {
              entityName = (sup?.profile as any)?.name || 'Supervisor';
            }
          } else if (key.scope_type === 'coordenacao') {
            const { data: coord } = await supabase.from('coordenacoes').select('name').eq('id', key.scope_id).single();
            entityName = coord?.name || 'Coordenação desconhecida';
          } else if (key.scope_type === 'rede') {
            const { data: rede } = await supabase.from('redes').select('name').eq('id', key.scope_id).single();
            entityName = rede?.name || 'Rede desconhecida';
          }
        }
        enriched.push({ ...key, entity_name: entityName });
      }

      return enriched;
    },
  });
}

export function useRegenerateAccessCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (keyId: string) => {
      // Generate new code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let newCode = 'redeamor-';
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Deactivate old code
      await supabase
        .from('access_keys')
        .update({ active: false })
        .eq('id', keyId);

      // Get old key details
      const { data: oldKey } = await supabase
        .from('access_keys')
        .select('scope_type, scope_id')
        .eq('id', keyId)
        .single();

      if (!oldKey) throw new Error('Código não encontrado');

      // Create new key
      const { error } = await supabase
        .from('access_keys')
        .insert({
          scope_type: oldKey.scope_type,
          scope_id: oldKey.scope_id,
          code: newCode,
          active: true,
        });

      if (error) throw error;
      return newCode;
    },
    onSuccess: (newCode) => {
      queryClient.invalidateQueries({ queryKey: ['access_keys'] });
      toast({ title: 'Código regenerado!', description: `Novo código: ${newCode}` });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}

export function useToggleAccessKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('access_keys')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access_keys'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}
