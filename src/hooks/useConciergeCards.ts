import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { getCurrentWeekStart } from '@/hooks/useWeeklyReports';
import { AlertTriangle, ClipboardCheck, Heart, Users, Droplets, BookOpen, Eye, TrendingUp, type LucideIcon } from 'lucide-react';

export interface ConciergeCard {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  priority: number; // lower = higher priority
}

export function useConciergeCards() {
  const { scopeId, scopeType, selectedRole } = useRole();
  const { activeCampoId } = useCampo();
  const campoId = activeCampoId;

  return useQuery({
    queryKey: ['concierge-cards', selectedRole, scopeId, campoId],
    queryFn: async () => {
      const cards: ConciergeCard[] = [];
      const weekStart = getCurrentWeekStart();

      // ── 1. Novas Vidas pendentes (all roles except pure cell leader) ──
      if (campoId) {
        const { count: novasVidasPendentes } = await supabase
          .from('novas_vidas')
          .select('id', { count: 'exact', head: true })
          .eq('campo_id', campoId)
          .in('status', ['nova', 'em_triagem']);

        if (novasVidasPendentes && novasVidasPendentes > 0) {
          cards.push({
            id: 'novas-vidas-pendentes',
            icon: AlertTriangle,
            iconColor: 'text-amber-500',
            title: `${novasVidasPendentes} nova${novasVidasPendentes > 1 ? 's' : ''} vida${novasVidasPendentes > 1 ? 's' : ''} aguardando célula`,
            description: 'Encaminhe para uma célula próxima',
            actionLabel: 'Encaminhar agora',
            actionPath: '/recomeco',
            priority: 1,
          });
        }
      }

      // ── 2. Relatório semanal pendente (cell leader / supervisor scope) ──
      if (scopeType === 'celula' && scopeId) {
        const { data: existingReport } = await supabase
          .from('weekly_reports')
          .select('id')
          .eq('celula_id', scopeId)
          .eq('week_start', weekStart)
          .maybeSingle();

        if (!existingReport) {
          cards.push({
            id: 'relatorio-pendente',
            icon: ClipboardCheck,
            iconColor: 'text-blue-500',
            title: 'Relatório semanal pendente',
            description: 'Registre a reunião desta semana',
            actionLabel: 'Registrar reunião',
            actionPath: '/dashboard?tab=acoes',
            priority: 2,
          });
        }
      }

      // ── 3. Células sem relatório recente (coordenador / rede / pastor) ──
      if (['coordenacao', 'rede', 'admin', 'pastor', 'pastor_senior_global', 'pastor_de_campo'].includes(scopeType || '')) {
        let celulaIds: string[] = [];

        if (scopeType === 'coordenacao' && scopeId) {
          const { data } = await supabase.from('celulas').select('id').eq('coordenacao_id', scopeId);
          celulaIds = (data || []).map(c => c.id);
        } else if (scopeType === 'rede' && scopeId) {
          const { data: coords } = await supabase.from('coordenacoes').select('id').eq('rede_id', scopeId);
          if (coords?.length) {
            const { data } = await supabase.from('celulas').select('id').in('coordenacao_id', coords.map(c => c.id));
            celulaIds = (data || []).map(c => c.id);
          }
        } else if (campoId) {
          const { data } = await supabase.from('celulas').select('id').eq('campo_id', campoId);
          celulaIds = (data || []).map(c => c.id);
        }

        if (celulaIds.length > 0) {
          const { data: reportsThisWeek } = await supabase
            .from('weekly_reports')
            .select('celula_id')
            .eq('week_start', weekStart)
            .in('celula_id', celulaIds.slice(0, 100));

          const reportedIds = new Set((reportsThisWeek || []).map(r => r.celula_id));
          const missing = celulaIds.filter(id => !reportedIds.has(id)).length;

          if (missing > 0) {
            cards.push({
              id: 'celulas-sem-relatorio',
              icon: Eye,
              iconColor: 'text-orange-500',
              title: `${missing} célula${missing > 1 ? 's' : ''} sem relatório esta semana`,
              description: 'Acompanhe as células pendentes',
              actionLabel: 'Ver células',
              actionPath: '/dashboard',
              priority: 3,
            });
          }
        }
      }

      // ── 4. Membros para discipulado ──
      if (scopeType === 'celula' && scopeId) {
        const { count: membrosParaDisc } = await supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('celula_id', scopeId)
          .eq('is_active', true)
          .eq('is_discipulado', false)
          .eq('batismo', true);

        if (membrosParaDisc && membrosParaDisc > 0) {
          cards.push({
            id: 'membros-discipulado',
            icon: BookOpen,
            iconColor: 'text-emerald-500',
            title: `${membrosParaDisc} membro${membrosParaDisc > 1 ? 's' : ''} pronto${membrosParaDisc > 1 ? 's' : ''} para discipulado`,
            description: 'Batizados que ainda não estão em discipulado',
            actionLabel: 'Iniciar discipulado',
            actionPath: '/dashboard?tab=acoes',
            priority: 4,
          });
        }
      }

      // ── 5. Encaminhamentos aguardando contato (cell leader) ──
      if (scopeType === 'celula' && scopeId) {
        const { count: aguardandoContato } = await supabase
          .from('novas_vidas')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_cell_id', scopeId)
          .in('status', ['recebida_pela_celula', 'encaminhada']);

        if (aguardandoContato && aguardandoContato > 0) {
          cards.push({
            id: 'vidas-aguardando-contato',
            icon: Heart,
            iconColor: 'text-rose-500',
            title: `${aguardandoContato} nova${aguardandoContato > 1 ? 's' : ''} vida${aguardandoContato > 1 ? 's' : ''} aguardando contato`,
            description: 'Faça o primeiro contato',
            actionLabel: 'Falar com nova vida',
            actionPath: '/dashboard?tab=novas-vidas',
            priority: 1,
          });
        }
      }

      // ── 6. Summary cards for pastor/global ──
      if (['pastor', 'pastor_senior_global', 'pastor_de_campo'].includes(scopeType || '') && campoId) {
        const { count: totalNovasVidas } = await supabase
          .from('novas_vidas')
          .select('id', { count: 'exact', head: true })
          .eq('campo_id', campoId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

        if (totalNovasVidas && totalNovasVidas > 0) {
          cards.push({
            id: 'novas-vidas-mes',
            icon: TrendingUp,
            iconColor: 'text-primary',
            title: `${totalNovasVidas} novas vidas no mês`,
            description: 'O Reino está crescendo!',
            actionLabel: 'Ver conversões',
            actionPath: '/dashboard',
            priority: 5,
          });
        }
      }

      return cards.sort((a, b) => a.priority - b.priority).slice(0, 5);
    },
    staleTime: 60_000,
  });
}
