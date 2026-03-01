import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCampo } from '@/contexts/CampoContext';

export const PIPELINE_STATUSES = [
  'nova', 'em_triagem', 'encaminhada', 'recebida_pela_celula',
  'contatada', 'sem_resposta', 'agendada', 'visitou',
  'integrada', 'convertida_membro', 'nao_convertida', 'reatribuir',
] as const;

export type PipelineStatus = typeof PIPELINE_STATUSES[number];

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nova: { label: 'Nova', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  em_triagem: { label: 'Em Triagem', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  encaminhada: { label: 'Encaminhada', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  recebida_pela_celula: { label: 'Recebida', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  contatada: { label: 'Contatada', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  sem_resposta: { label: 'Sem Resposta', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
  agendada: { label: 'Agendada', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  visitou: { label: 'Visitou', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  integrada: { label: 'Integrada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  convertida_membro: { label: 'Membro', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  nao_convertida: { label: 'Não Convertida', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  reatribuir: { label: 'Reatribuir', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
};

export interface NovaVida {
  id: string;
  nome: string;
  whatsapp: string | null;
  bairro: string | null;
  cidade: string | null;
  estado_civil: string | null;
  faixa_etaria: string | null;
  observacao: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  assigned_to_user_id: string | null;
  assigned_cell_id: string | null;
}

export interface NovaVidaInsert {
  nome: string;
  whatsapp?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado_civil?: string | null;
  faixa_etaria?: string | null;
  observacao?: string | null;
}

export function useNovasVidas(campoId?: string | null) {
  return useQuery({
    queryKey: ['novas_vidas', campoId],
    queryFn: async () => {
      let q = supabase
        .from('novas_vidas')
        .select('*')
        .order('created_at', { ascending: false });
      if (campoId) q = q.eq('campo_id', campoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as NovaVida[];
    },
  });
}

export function useNovasVidasByCelula(celulaId: string) {
  return useQuery({
    queryKey: ['novas_vidas', 'celula', celulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novas_vidas')
        .select('*')
        .eq('assigned_cell_id', celulaId)
        .not('status', 'in', '("nova","em_triagem")')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as NovaVida[];
    },
    enabled: !!celulaId,
  });
}

export function useNovasVidasEvents(vidaId?: string) {
  return useQuery({
    queryKey: ['novas_vidas_events', vidaId],
    queryFn: async () => {
      let q = supabase
        .from('novas_vidas_events')
        .select('*')
        .order('created_at', { ascending: false });
      if (vidaId) q = q.eq('vida_id', vidaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateNovaVida() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { activeCampoId } = useCampo();

  return useMutation({
    mutationFn: async (nv: NovaVidaInsert & { campo_id?: string }) => {
      // Resolve campo_id: explicit param > context > fetch from user_access_links
      let campoId = nv.campo_id || activeCampoId;

      if (!campoId) {
        // Last resort: fetch from user_access_links
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: links } = await supabase
            .from('user_access_links')
            .select('campo_id')
            .eq('user_id', user.id)
            .eq('active', true)
            .not('campo_id', 'is', null)
            .limit(1);
          campoId = links?.[0]?.campo_id ?? null;
        }
      }

      if (!campoId) {
        throw new Error('Seu acesso não está vinculado a um campus. Fale com o administrador.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('novas_vidas')
        .insert({ ...nv, campo_id: campoId, created_by_user_id: user?.id ?? null } as any)
        .select()
        .single();
      if (error) throw error;

      if (user && data) {
        await supabase.from('novas_vidas_events' as any).insert({
          vida_id: data.id,
          event_type: 'cadastro',
          actor_user_id: user.id,
          payload: { nome: nv.nome },
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Nova vida cadastrada com sucesso!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao cadastrar', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateNovaVida() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<NovaVida> & { id: string }) => {
      const { error } = await supabase
        .from('novas_vidas')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      toast({ title: 'Atualizado com sucesso!' });
    },
    onError: (e) => {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    },
  });
}

export function useChangeNovaVidaStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      vidaId, newStatus, notes, actorRole, extraData,
    }: {
      vidaId: string;
      newStatus: PipelineStatus;
      notes?: string;
      actorRole?: string;
      extraData?: Record<string, any>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get current status
      const { data: current } = await supabase.from('novas_vidas').select('status').eq('id', vidaId).single();
      const oldStatus = current?.status || 'unknown';

      // Update novas_vidas
      const updateData: any = { status: newStatus, ...extraData };
      const { error } = await supabase.from('novas_vidas').update(updateData).eq('id', vidaId);
      if (error) throw error;

      // Sync encaminhamentos_recomeco status for upper dashboard visibility
      const encStatusMap: Record<string, string> = {
        'recebida_pela_celula': 'recebido',
        'contatada': 'contatado',
        'sem_resposta': 'sem_resposta',
        'agendada': 'contatado',
        'visitou': 'contatado',
        'integrada': 'integrado',
        'convertida_membro': 'convertido',
        'nao_convertida': 'nao_convertida',
        'reatribuir': 'devolvido',
      };
      const encStatus = encStatusMap[newStatus];
      if (encStatus) {
        const encUpdate: any = { status: encStatus };
        if (newStatus === 'contatada') encUpdate.contatado_at = new Date().toISOString();
        if (newStatus === 'integrada') encUpdate.integrado_at = new Date().toISOString();
        if (newStatus === 'convertida_membro') encUpdate.promovido_membro_at = new Date().toISOString();
        await supabase
          .from('encaminhamentos_recomeco')
          .update(encUpdate)
          .eq('nova_vida_id', vidaId);
      }

      // Create audit event
      await supabase.from('novas_vidas_events' as any).insert({
        vida_id: vidaId,
        event_type: `status_${newStatus}`,
        actor_user_id: user.id,
        payload: {
          old_status: oldStatus,
          new_status: newStatus,
          actor_role: actorRole || 'unknown',
          ...(notes ? { notes } : {}),
          ...(extraData || {}),
        },
      });

      return { vidaId, newStatus };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['novas_vidas'] });
      qc.invalidateQueries({ queryKey: ['novas_vidas_events'] });
      qc.invalidateQueries({ queryKey: ['encaminhamentos'] });
      qc.invalidateQueries({ queryKey: ['recomeco-funnel-all'] });
      const label = STATUS_LABELS[vars.newStatus]?.label || vars.newStatus;
      toast({ title: `Status atualizado: ${label}` });
    },
    onError: (e) => {
      toast({ title: 'Erro ao atualizar status', description: e.message, variant: 'destructive' });
    },
  });
}
