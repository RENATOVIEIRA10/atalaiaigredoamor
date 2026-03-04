/**
 * usePulsoEngine – Motor único de Pulso Pastoral
 *
 * Fonte de verdade única para todos os dashboards (Pastor, Líder de Rede, Coordenador).
 * O que muda entre papéis é apenas o escopo (scope_type + scope_id).
 *
 * Regras:
 * - Semana operacional: Segunda (weekStartsOn: 1) → Sábado
 * - Membros: contagem real de members cadastrados (is_active=true)
 * - Engajamento: weekly_reports filtrado por meeting_date (Seg→Sáb), fallback week_start
 * - Marcos espirituais: campos booleanos da tabela members
 * - Estagnação: membros ativos há > 2 anos sem marcos básicos
 *
 * IMPORTANTE: Usa paginação para suportar visão global (>1000 rows).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, parseISO, subDays } from 'date-fns';
import { useDemoScope } from './useDemoScope';
import { fetchAllRows, batchedInQuery } from '@/lib/supabasePagination';

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
  totalCelulas: number;
  celulasComRelatorio: number;
  percentualEngajamento: number;
  percentualSemanaAnterior: number;
  celulasAlerta1Semana: CelulaAlertaStatus[];
  celulasAlerta2Semanas: CelulaAlertaStatus[];
  celulasAlerta3Semanas: CelulaAlertaStatus[];
  totalDiscipulados: number;
  lideresEmTreinamento: number;
  marcosEncontro: number;
  marcosBatismo: number;
  marcosDiscipulado: number;
  marcosCursoLidere: number;
  marcosRenovo: number;
  marcosLiderEmTreinamento: number;
  stagnantCount: number;
  stagnantMembers: PulsoStagnantMember[];
  birthdays: PulsoBirthday[];
}

export type PulsoScopeType = 'rede' | 'coordenacao' | 'all';

export interface UsePulsoEngineOptions {
  scopeType: PulsoScopeType;
  scopeId?: string;
  campoId?: string | null;
  enabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOperacionalWindow(referenceMonday: Date): { from: string; to: string } {
  const saturday = addDays(referenceMonday, 5);
  return {
    from: format(referenceMonday, 'yyyy-MM-dd'),
    to: format(saturday, 'yyyy-MM-dd'),
  };
}

function getMondayNWeeksAgo(currentMonday: Date, weeksAgo: number): Date {
  return addDays(currentMonday, -7 * weeksAgo);
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePulsoEngine({ scopeType, scopeId, campoId, enabled = true }: UsePulsoEngineOptions) {
  const { isDemoActive, queryKeyExtra } = useDemoScope();

  return useQuery({
    queryKey: ['pulso-engine', scopeType, scopeId ?? 'all', campoId ?? 'global', ...queryKeyExtra],
    enabled: enabled && (scopeType === 'all' || !!scopeId),
    staleTime: 60_000,
    queryFn: async (): Promise<PulsoData> => {
      const now = new Date();
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

      // ── PASSO 1: Buscar TODAS as células do escopo (paginado) ─────────
      const celulasFilters = (q: any) => {
        if (campoId) q = q.eq('campo_id', campoId);
        if (scopeType === 'coordenacao' && scopeId) q = q.eq('coordenacao_id', scopeId);
        // Use direct rede_id column for rede scope (single source of truth, set by trigger)
        if (scopeType === 'rede' && scopeId) q = q.eq('rede_id', scopeId);
        return q;
      };

      const allCelulas = await fetchAllRows(
        'celulas',
        'id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name, rede_id)',
        celulasFilters
      );

      const celulaIds = allCelulas.map((c: any) => c.id);
      const totalCelulas = celulaIds.length;

      if (totalCelulas === 0) return emptyResult;

      // ── PASSO 2: Relatórios por janela (batched .in()) ─────────────────
      const buildReportBatch = (window: { from: string; to: string }) => {
        return batchedInQuery(
          'weekly_reports',
          'celula_id',
          'celula_id',
          celulaIds,
          (q: any) => q.or(
            `and(meeting_date.gte.${window.from},meeting_date.lte.${window.to}),` +
            `and(meeting_date.is.null,week_start.gte.${window.from},week_start.lte.${window.to})`
          )
        );
      };

      const twoYearsAgo = subDays(now, 730);

      // ── PASSO 3: Buscar tudo em paralelo (tudo paginado/batched) ──────
      const [
        thisWeekData,
        lastWeekData,
        twoWeeksAgoData,
        membersData,
        stagnantData,
        birthdayData,
      ] = await Promise.all([
        buildReportBatch(thisWeek),
        buildReportBatch(lastWeek),
        buildReportBatch(twoWeeksAgo),

        // Membros ativos (paginado via batched .in())
        batchedInQuery(
          'members',
          'id, is_discipulado, is_lider_em_treinamento, encontro_com_deus, batismo, curso_lidere, renovo',
          'celula_id',
          celulaIds,
          (q: any) => q.eq('is_active', true)
        ),

        // Membros estagnados (paginado)
        batchedInQuery(
          'members',
          'id, encontro_com_deus, batismo, curso_lidere, profile:profiles!members_profile_id_fkey(name, avatar_url), celula:celulas!members_celula_id_fkey(name)',
          'celula_id',
          celulaIds,
          (q: any) => q.eq('is_active', true).lt('joined_at', twoYearsAgo.toISOString())
        ),

        // Aniversários
        batchedInQuery(
          'members',
          'profile_id, celula:celulas!members_celula_id_fkey(name), profile:profiles!members_profile_id_fkey(id, name, avatar_url, birth_date)',
          'celula_id',
          celulaIds,
          (q: any) => q.eq('is_active', true)
        ),
      ]);

      // ── PASSO 4: Processar engajamento ───────────────────────────────────
      const thisWeekIds = new Set(thisWeekData.map((r: any) => r.celula_id));
      const lastWeekIds = new Set(lastWeekData.map((r: any) => r.celula_id));
      const twoWeeksAgoIds = new Set(twoWeeksAgoData.map((r: any) => r.celula_id));

      const celulasComRelatorio = thisWeekIds.size;
      const percentualEngajamento = Math.round((celulasComRelatorio / totalCelulas) * 100);
      const percentualSemanaAnterior = Math.round((lastWeekIds.size / totalCelulas) * 100);

      // ── PASSO 5: Classificar alertas ────────────────────────────────────
      const celulasAlerta1Semana: CelulaAlertaStatus[] = [];
      const celulasAlerta2Semanas: CelulaAlertaStatus[] = [];
      const celulasAlerta3Semanas: CelulaAlertaStatus[] = [];

      for (const cel of allCelulas) {
        if (thisWeekIds.has((cel as any).id)) continue;

        const coordName = (cel as any).coordenacao?.name || '';
        const base: CelulaAlertaStatus = {
          celula_id: (cel as any).id,
          celula_name: (cel as any).name,
          coordenacao_name: coordName,
          weeks_without_report: 1,
        };

        const semLastWeek = !lastWeekIds.has((cel as any).id);
        const semTwoWeeks = !twoWeeksAgoIds.has((cel as any).id);

        if (semLastWeek && semTwoWeeks) {
          celulasAlerta3Semanas.push({ ...base, weeks_without_report: 3 });
        } else if (semLastWeek) {
          celulasAlerta2Semanas.push({ ...base, weeks_without_report: 2 });
        } else {
          celulasAlerta1Semana.push({ ...base, weeks_without_report: 1 });
        }
      }

      // ── PASSO 6: Marcos espirituais ──────────────────────────────────────
      const members = membersData;
      const totalDiscipulados = members.filter((m: any) => m.is_discipulado).length;
      const lideresEmTreinamento = members.filter((m: any) => m.is_lider_em_treinamento).length;
      const marcosEncontro = members.filter((m: any) => m.encontro_com_deus).length;
      const marcosBatismo = members.filter((m: any) => m.batismo).length;
      const marcosDiscipulado = totalDiscipulados;
      const marcosCursoLidere = members.filter((m: any) => m.curso_lidere).length;
      const marcosRenovo = members.filter((m: any) => m.renovo).length;
      const marcosLiderEmTreinamento = lideresEmTreinamento;

      // ── PASSO 7: Estagnação ───────────────────────────────────────────────
      const stagnantRaw = stagnantData.filter(
        (m: any) => !m.encontro_com_deus && !m.batismo && !m.curso_lidere
      );
      const stagnantMembers: PulsoStagnantMember[] = stagnantRaw.map((m: any) => ({
        id: m.id,
        name: m.profile?.name || 'Sem nome',
        avatar_url: m.profile?.avatar_url || null,
        celula_name: m.celula?.name || 'Sem célula',
      }));

      // ── PASSO 8: Aniversários da semana ──────────────────────────────────
      const todayMonthDay = format(now, 'MM-dd');
      const birthdays: PulsoBirthday[] = [];

      for (const m of birthdayData) {
        const p = (m as any).profile;
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
            celula_name: (m as any).celula?.name || '',
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
