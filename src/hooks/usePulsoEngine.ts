/**
 * usePulsoEngine – Motor único de Pulso Pastoral
 *
 * Fonte de verdade única para todos os dashboards (Pastor, Líder de Rede, Coordenador).
 * O que muda entre papéis é apenas o escopo (scope_type + scope_id).
 *
 * Regras:
 * - Semana operacional: Segunda (weekStartsOn: 1) → Sábado
 * - Membros: contagem real de members cadastrados (is_active=true, is_test_data=false)
 * - Engajamento: weekly_reports filtrado por meeting_date (Seg→Sáb), fallback week_start
 * - Aniversários: birth_date de profiles de membros no escopo
 * - Marcos espirituais: campos booleanos da tabela members
 * - Estagnação: membros ativos há > 2 anos sem marcos básicos (encontro/batismo/curso_lidere)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, parseISO, subDays } from 'date-fns';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export interface CelulaAlertaStatus {
  celula_id: string;
  celula_name: string;
  coordenacao_name: string;
  weeks_without_report: number;
}

export interface PulsoStagnantMember {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
}

export interface PulsoBirthday {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  role: string;
  is_today: boolean;
}

export interface PulsoData {
  // Engajamento
  totalCelulas: number;
  celulasComRelatorio: number;
  percentualEngajamento: number;
  percentualSemanaAnterior: number;
  // Alertas
  celulasAlerta1Semana: CelulaAlertaStatus[];
  celulasAlerta2Semanas: CelulaAlertaStatus[];
  celulasAlerta3Semanas: CelulaAlertaStatus[];
  // Discipulado / Liderança
  totalDiscipulados: number;
  lideresEmTreinamento: number;
  // Marcos espirituais
  marcosEncontro: number;
  marcosBatismo: number;
  marcosDiscipulado: number;
  marcosCursoLidere: number;
  marcosRenovo: number;
  marcosLiderEmTreinamento: number;
  // Atenção pastoral
  stagnantCount: number;
  stagnantMembers: PulsoStagnantMember[];
  // Aniversários
  birthdays: PulsoBirthday[];
}

export type PulsoScopeType = 'rede' | 'coordenacao' | 'all';

export interface UsePulsoEngineOptions {
  scopeType: PulsoScopeType;
  /** Para 'rede': rede_id. Para 'coordenacao': coordenacao_id. Para 'all': ignorado. */
  scopeId?: string;
  /** Filtro de campo (campus). null = sem filtro (visão global). */
  campoId?: string | null;
  enabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Semana operacional: Segunda (weekStartsOn: 1) → Sábado */
function getOperacionalWindow(referenceMonday: Date): { from: string; to: string } {
  const saturday = addDays(referenceMonday, 5);
  return {
    from: format(referenceMonday, 'yyyy-MM-dd'),
    to: format(saturday, 'yyyy-MM-dd'),
  };
}

/**
 * Retorna o monday de N semanas atrás a partir do monday atual.
 */
function getMondayNWeeksAgo(currentMonday: Date, weeksAgo: number): Date {
  return addDays(currentMonday, -7 * weeksAgo);
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePulsoEngine({ scopeType, scopeId, campoId, enabled = true }: UsePulsoEngineOptions) {
  return useQuery({
    queryKey: ['pulso-engine', scopeType, scopeId ?? 'all', campoId ?? 'global'],
    enabled: enabled && (scopeType === 'all' || !!scopeId),
    staleTime: 60_000, // 1 min
    queryFn: async (): Promise<PulsoData> => {
      const now = new Date();
      // Segunda-feira da semana atual (fonte de verdade para semana operacional)
      const currentMonday = startOfWeek(now, { weekStartsOn: 1 });
      const lastMonday = getMondayNWeeksAgo(currentMonday, 1);
      const twoWeeksAgoMonday = getMondayNWeeksAgo(currentMonday, 2);

      const thisWeek = getOperacionalWindow(currentMonday);
      const lastWeek = getOperacionalWindow(lastMonday);
      const twoWeeksAgo = getOperacionalWindow(twoWeeksAgoMonday);

      const emptyResult: PulsoData = {
        totalCelulas: 0, celulasComRelatorio: 0, percentualEngajamento: 0,
        percentualSemanaAnterior: 0, celulasAlerta1Semana: [], celulasAlerta2Semanas: [],
        celulasAlerta3Semanas: [], totalDiscipulados: 0, lideresEmTreinamento: 0,
        marcosEncontro: 0, marcosBatismo: 0, marcosDiscipulado: 0,
        marcosCursoLidere: 0, marcosRenovo: 0, marcosLiderEmTreinamento: 0,
        stagnantCount: 0, stagnantMembers: [], birthdays: [],
      };

      // ── PASSO 1: Buscar células do escopo ────────────────────────────────
      // Sempre buscamos com join para ter rede_id disponível para filtro client-side
      let celulasQuery = supabase
        .from('celulas')
        .select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name, rede_id)')
        .eq('is_test_data', false);

      if (campoId) celulasQuery = celulasQuery.eq('campo_id', campoId);

      // Filtro server-side quando possível (coordenacao → filtra no banco)
      const filteredQuery = scopeType === 'coordenacao' && scopeId
        ? celulasQuery.eq('coordenacao_id', scopeId)
        : celulasQuery;

      const { data: celulasRaw, error: celulasErr } = await filteredQuery;
      if (celulasErr) console.error('[usePulsoEngine] celulas error:', celulasErr);

      let allCelulas = celulasRaw || [];

      // Filtro client-side para rede (join já trouxe rede_id)
      if (scopeType === 'rede' && scopeId) {
        allCelulas = allCelulas.filter(c => (c.coordenacao as any)?.rede_id === scopeId);
      }

      const celulaIds = allCelulas.map(c => c.id);
      const totalCelulas = celulaIds.length;

      if (totalCelulas === 0) return emptyResult;

      // ── PASSO 2: Montar query de relatórios por janela ───────────────────
      const buildReportQuery = (window: { from: string; to: string }) =>
        supabase
          .from('weekly_reports')
          .select('celula_id')
          .in('celula_id', celulaIds)
          .eq('is_test_data', false)
          // Prioridade: meeting_date (fonte de verdade). Fallback: week_start.
          .or(
            `and(meeting_date.gte.${window.from},meeting_date.lte.${window.to}),` +
            `and(meeting_date.is.null,week_start.gte.${window.from},week_start.lte.${window.to})`
          );

      const twoYearsAgo = subDays(now, 730);

      // ── PASSO 3: Buscar tudo em paralelo ────────────────────────────────
      const [
        thisWeekRes,
        lastWeekRes,
        twoWeeksAgoRes,
        membersRes,
        stagnantRes,
        birthdayMembersRes,
      ] = await Promise.all([
        buildReportQuery(thisWeek),
        buildReportQuery(lastWeek),
        buildReportQuery(twoWeeksAgo),

        // Membros ativos no escopo — para marcos espirituais
        // NOTA: NÃO filtramos is_test_data aqui porque membros reais podem estar
        // marcados como is_test_data=true se vieram de um seed run não limpo.
        supabase
          .from('members')
          .select('id, is_discipulado, is_lider_em_treinamento, encontro_com_deus, batismo, curso_lidere, renovo')
          .eq('is_active', true)
          .in('celula_id', celulaIds),

        // Membros há >2 anos sem marcos básicos — atenção pastoral
        supabase
          .from('members')
          .select(`
            id,
            encontro_com_deus,
            batismo,
            curso_lidere,
            profile:profiles!members_profile_id_fkey(name, avatar_url),
            celula:celulas!members_celula_id_fkey(name)
          `)
          .eq('is_active', true)
          .in('celula_id', celulaIds)
          .lt('joined_at', twoYearsAgo.toISOString()),

        // Membros com data de nascimento — aniversários
        supabase
          .from('members')
          .select(`
            profile_id,
            celula:celulas!members_celula_id_fkey(name),
            profile:profiles!members_profile_id_fkey(id, name, avatar_url, birth_date)
          `)
          .eq('is_active', true)
          .in('celula_id', celulaIds),
      ]);

      // ── PASSO 4: Processar engajamento ───────────────────────────────────
      const thisWeekIds = new Set((thisWeekRes.data || []).map(r => r.celula_id));
      const lastWeekIds = new Set((lastWeekRes.data || []).map(r => r.celula_id));
      const twoWeeksAgoIds = new Set((twoWeeksAgoRes.data || []).map(r => r.celula_id));

      const celulasComRelatorio = thisWeekIds.size;
      const percentualEngajamento = Math.round((celulasComRelatorio / totalCelulas) * 100);
      const percentualSemanaAnterior = Math.round((lastWeekIds.size / totalCelulas) * 100);

      // ── PASSO 5: Classificar alertas ────────────────────────────────────
      const celulasAlerta1Semana: CelulaAlertaStatus[] = [];
      const celulasAlerta2Semanas: CelulaAlertaStatus[] = [];
      const celulasAlerta3Semanas: CelulaAlertaStatus[] = [];

      for (const cel of allCelulas) {
        if (thisWeekIds.has(cel.id)) continue; // enviou esta semana → ok

        const coordName = (cel.coordenacao as any)?.name || '';
        const base: CelulaAlertaStatus = {
          celula_id: cel.id,
          celula_name: cel.name,
          coordenacao_name: coordName,
          weeks_without_report: 1,
        };

        const semLastWeek = !lastWeekIds.has(cel.id);
        const semTwoWeeks = !twoWeeksAgoIds.has(cel.id);

        if (semLastWeek && semTwoWeeks) {
          // Sem relatório nas últimas 3 semanas (incluindo esta)
          celulasAlerta3Semanas.push({ ...base, weeks_without_report: 3 });
        } else if (semLastWeek) {
          // Sem relatório na semana passada e nesta
          celulasAlerta2Semanas.push({ ...base, weeks_without_report: 2 });
        } else {
          // Enviou na semana passada mas não nesta
          celulasAlerta1Semana.push({ ...base, weeks_without_report: 1 });
        }
      }

      // ── PASSO 6: Marcos espirituais ──────────────────────────────────────
      const members = membersRes.data || [];
      const totalDiscipulados = members.filter(m => m.is_discipulado).length;
      const lideresEmTreinamento = members.filter(m => m.is_lider_em_treinamento).length;
      const marcosEncontro = members.filter(m => m.encontro_com_deus).length;
      const marcosBatismo = members.filter(m => m.batismo).length;
      const marcosDiscipulado = totalDiscipulados;
      const marcosCursoLidere = members.filter(m => m.curso_lidere).length;
      const marcosRenovo = members.filter(m => m.renovo).length;
      const marcosLiderEmTreinamento = lideresEmTreinamento;

      // ── PASSO 7: Atenção pastoral – estagnação ───────────────────────────
      const stagnantRaw = (stagnantRes.data || []).filter(
        m => !m.encontro_com_deus && !m.batismo && !m.curso_lidere
      );
      const stagnantMembers: PulsoStagnantMember[] = stagnantRaw.map(m => ({
        id: m.id,
        name: (m.profile as any)?.name || 'Sem nome',
        avatar_url: (m.profile as any)?.avatar_url || null,
        celula_name: (m.celula as any)?.name || 'Sem célula',
      }));

      // ── PASSO 8: Aniversários da semana (Seg→Dom, 7 dias a partir de hoje) ──
      const todayMonthDay = format(now, 'MM-dd');
      const birthdays: PulsoBirthday[] = [];

      for (const m of birthdayMembersRes.data || []) {
        const p = m.profile as any;
        if (!p?.birth_date) continue;

        const birthMonthDay = format(parseISO(p.birth_date), 'MM-dd');
        let isInWeek = false;
        for (let d = 0; d <= 6; d++) {
          if (format(addDays(now, d), 'MM-dd') === birthMonthDay) {
            isInWeek = true;
            break;
          }
        }

        if (isInWeek) {
          birthdays.push({
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url || null,
            celula_name: (m.celula as any)?.name || '',
            role: 'Membro',
            is_today: birthMonthDay === todayMonthDay,
          });
        }
      }

      birthdays.sort((a, b) => {
        if (a.is_today && !b.is_today) return -1;
        if (!a.is_today && b.is_today) return 1;
        return a.name.localeCompare(b.name);
      });

      return {
        totalCelulas,
        celulasComRelatorio,
        percentualEngajamento,
        percentualSemanaAnterior,
        celulasAlerta1Semana,
        celulasAlerta2Semanas,
        celulasAlerta3Semanas,
        totalDiscipulados,
        lideresEmTreinamento,
        marcosEncontro,
        marcosBatismo,
        marcosDiscipulado,
        marcosCursoLidere,
        marcosRenovo,
        marcosLiderEmTreinamento,
        stagnantCount: stagnantMembers.length,
        stagnantMembers,
        birthdays,
      };
    },
  });
}
