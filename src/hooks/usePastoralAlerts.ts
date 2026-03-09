import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { differenceInDays, subWeeks } from 'date-fns';

export interface PastoralAlert {
  id: string;
  type: 'nova_vida_sem_celula' | 'celula_sem_reuniao' | 'aniversario_lider' | 'rede_estagnada' | 'membro_estagnado';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  entityId: string;
  entityName: string;
  daysCount?: number;
}

interface UsePastoralAlertsOptions {
  scopeType?: 'rede' | 'coordenacao' | 'celula' | 'all';
  scopeId?: string | null;
}

/**
 * Hook que detecta alertas pastorais automáticos baseados em regras de negócio:
 * - Nova vida sem célula há 7+ dias
 * - Célula sem reunião há 3+ semanas
 * - Aniversário de líder (próximos 7 dias)
 * - Rede estagnada (sem conversões em 60 dias)
 * - Membro estagnado (2+ anos sem marcos espirituais)
 */
export function usePastoralAlerts({ scopeType = 'all', scopeId }: UsePastoralAlertsOptions = {}) {
  const { campoId, isDemoActive, seedRunId, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['pastoral-alerts', scopeType, scopeId, ...queryKeyExtra],
    queryFn: async (): Promise<PastoralAlert[]> => {
      const alerts: PastoralAlert[] = [];
      const today = new Date();

      // ═══════════════════════════════════════════════════════════
      // 1️⃣ NOVAS VIDAS SEM CÉLULA HÁ 7+ DIAS
      // ═══════════════════════════════════════════════════════════
      let vidasQuery = supabase
        .from('novas_vidas')
        .select('id, nome, created_at, assigned_cell_id')
        .eq('status', 'nova')
        .is('assigned_cell_id', null);

      if (campoId) vidasQuery = vidasQuery.eq('campo_id', campoId);
      const { data: novasVidas } = await vidasQuery;

      (novasVidas || []).forEach(vida => {
        const daysSinceCreation = differenceInDays(today, new Date(vida.created_at));
        if (daysSinceCreation >= 7) {
          alerts.push({
            id: `vida_${vida.id}`,
            type: 'nova_vida_sem_celula',
            severity: daysSinceCreation >= 14 ? 'high' : 'medium',
            title: `${vida.nome} aguarda célula há ${daysSinceCreation} dias`,
            description: 'Nova vida sem encaminhamento precisa de acolhimento urgente',
            actionLabel: 'Encaminhar agora',
            actionUrl: '/recomeco',
            entityId: vida.id,
            entityName: vida.nome,
            daysCount: daysSinceCreation,
          });
        }
      });

      // ═══════════════════════════════════════════════════════════
      // 2️⃣ CÉLULAS SEM REUNIÃO HÁ 3+ SEMANAS
      // ═══════════════════════════════════════════════════════════
      let celulasQuery = supabase
        .from('celulas')
        .select('id, name, coordenacao:coordenacoes(name)');

      if (campoId) celulasQuery = celulasQuery.eq('campo_id', campoId);
      if (scopeType === 'coordenacao' && scopeId) celulasQuery = celulasQuery.eq('coordenacao_id', scopeId);
      
      const { data: celulas } = await celulasQuery;

      if (celulas && celulas.length > 0) {
        const celulaIds = celulas.map(c => c.id);
        const threeWeeksAgo = subWeeks(today, 3);

        let reportsQuery = supabase
          .from('weekly_reports')
          .select('celula_id, created_at')
          .in('celula_id', celulaIds)
          .gte('created_at', threeWeeksAgo.toISOString());
        const { data: reports } = await reportsQuery;

        const reportsMap = new Set((reports || []).map(r => r.celula_id));

        celulas.forEach((cel: any) => {
          if (!reportsMap.has(cel.id)) {
            // Check last report date
            supabase
              .from('weekly_reports')
              .select('created_at')
              .eq('celula_id', cel.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .then(({ data: lastReport }) => {
                const lastReportDate = lastReport?.[0]?.created_at;
                const daysSinceLastReport = lastReportDate
                  ? differenceInDays(today, new Date(lastReportDate))
                  : 999;

                if (daysSinceLastReport >= 21) {
                  alerts.push({
                    id: `celula_${cel.id}`,
                    type: 'celula_sem_reuniao',
                    severity: daysSinceLastReport >= 42 ? 'high' : 'medium',
                    title: `${cel.name} sem reunião há ${Math.floor(daysSinceLastReport / 7)} semanas`,
                    description: `Coordenação ${cel.coordenacao?.name || ''} - Célula precisa de apoio pastoral`,
                    actionLabel: 'Ver célula',
                    actionUrl: `/celulas?celula=${cel.id}`,
                    entityId: cel.id,
                    entityName: cel.name,
                    daysCount: daysSinceLastReport,
                  });
                }
              });
          }
        });
      }

      // ═══════════════════════════════════════════════════════════
      // 3️⃣ ANIVERSÁRIOS DE LÍDERES (PRÓXIMOS 7 DIAS)
      // ═══════════════════════════════════════════════════════════
      let leadersQuery = supabase
        .from('profiles')
        .select(`
          id,
          name,
          birth_date,
          celulas_leader:celulas!celulas_leader_id_fkey(id, name),
          coordenacoes_leader:coordenacoes!coordenacoes_leader_id_fkey(id, name),
          redes_leader:redes!redes_leader_id_fkey(id, name)
        `)
        .not('birth_date', 'is', null);

      const { data: leaders } = await leadersQuery;

      (leaders || []).forEach((leader: any) => {
        if (!leader.birth_date) return;

        const birthDate = new Date(leader.birth_date);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntilBirthday = differenceInDays(thisYearBirthday, today);

        if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
          const leaderships = [
            ...(leader.celulas_leader || []).map((c: any) => `Líder da célula ${c.name}`),
            ...(leader.coordenacoes_leader || []).map((c: any) => `Coordenador de ${c.name}`),
            ...(leader.redes_leader || []).map((r: any) => `Líder da rede ${r.name}`),
          ];

          if (leaderships.length > 0) {
            alerts.push({
              id: `birthday_${leader.id}`,
              type: 'aniversario_lider',
              severity: 'low',
              title: `Aniversário de ${leader.name} em ${daysUntilBirthday} dias`,
              description: leaderships[0],
              actionLabel: 'Ver perfil',
              actionUrl: `/perfil/${leader.id}`,
              entityId: leader.id,
              entityName: leader.name,
              daysCount: daysUntilBirthday,
            });
          }
        }
      });

      // ═══════════════════════════════════════════════════════════
      // 4️⃣ MEMBROS ESTAGNADOS (2+ ANOS SEM MARCOS ESPIRITUAIS)
      // ═══════════════════════════════════════════════════════════
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(today.getFullYear() - 2);

      let membersQuery = supabase
        .from('members')
        .select(`
          id,
          joined_at,
          batismo,
          encontro_com_deus,
          curso_lidere,
          is_active,
          profile:profiles(name),
          celula:celulas(name, coordenacao:coordenacoes(name))
        `)
        .eq('is_active', true)
        .lte('joined_at', twoYearsAgo.toISOString())
        .or('batismo.is.null,batismo.eq.false')
        .or('encontro_com_deus.is.null,encontro_com_deus.eq.false')
        .or('curso_lidere.is.null,curso_lidere.eq.false');

      if (campoId) membersQuery = membersQuery.eq('campo_id', campoId);

      const { data: stagMembers } = await membersQuery;

      (stagMembers || []).slice(0, 10).forEach((member: any) => {
        const yearsSinceJoined = differenceInDays(today, new Date(member.joined_at)) / 365;
        alerts.push({
          id: `stag_${member.id}`,
          type: 'membro_estagnado',
          severity: 'medium',
          title: `${member.profile?.name || 'Membro'} há ${Math.floor(yearsSinceJoined)} anos sem marcos`,
          description: `Célula ${member.celula?.name || ''} - Precisa de acompanhamento espiritual`,
          actionLabel: 'Ver membro',
          actionUrl: `/membros/${member.id}`,
          entityId: member.id,
          entityName: member.profile?.name || 'Membro',
          daysCount: Math.floor(yearsSinceJoined * 365),
        });
      });

      // Sort by severity: high > medium > low
      const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      return alerts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!campoId || scopeType === 'all',
  });
}
