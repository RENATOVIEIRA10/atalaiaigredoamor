import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { CelulaReportStatus } from '@/hooks/usePulsoPastoral';

export interface StagnantMemberScoped {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
}

export interface ScopedBirthday {
  id: string;
  name: string;
  avatar_url: string | null;
  celula_name: string;
  role: string;
  is_today: boolean;
}

export interface PulsoRedeData {
  totalCelulas: number;
  celulasComRelatorio: number;
  percentualEngajamento: number;
  percentualSemanaAnterior: number;
  celulasAlerta1Semana: CelulaReportStatus[];
  celulasAlerta2Semanas: CelulaReportStatus[];
  celulasAlerta3Semanas: CelulaReportStatus[];
  totalDiscipulados: number;
  lideresEmTreinamento: number;
  // Marcos espirituais
  marcosEncontro: number;
  marcosBatismo: number;
  marcosDiscipulado: number;
  marcosCursoLidere: number;
  marcosRenovo: number;
  marcosLiderEmTreinamento: number;
  // Estagnação
  stagnantCount: number;
  stagnantMembers: StagnantMemberScoped[];
  // Aniversários
  birthdays: ScopedBirthday[];
}

interface UsePulsoRedeOptions {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

function getOperacionalWindow(date: Date): { from: string; to: string } {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  const saturday = addDays(monday, 5);
  return {
    from: format(monday, 'yyyy-MM-dd'),
    to: format(saturday, 'yyyy-MM-dd'),
  };
}

export function usePulsoRede({ scopeType, scopeId }: UsePulsoRedeOptions) {
  return useQuery({
    queryKey: ['pulso-rede', scopeType, scopeId],
    enabled: !!scopeId,
    queryFn: async (): Promise<PulsoRedeData> => {
      const now = new Date();
      const thisWeek = getOperacionalWindow(now);
      const lastWeek = getOperacionalWindow(addDays(startOfWeek(now, { weekStartsOn: 1 }), -7));
      const twoWeeksAgo = getOperacionalWindow(addDays(startOfWeek(now, { weekStartsOn: 1 }), -14));

      // 1. Get celulas in scope
      let celulaQuery = supabase
        .from('celulas')
        .select('id, name, coordenacao_id, coordenacao:coordenacoes!celulas_coordenacao_id_fkey(name, rede_id)')
        .eq('is_test_data', false);

      if (scopeType === 'coordenacao') {
        celulaQuery = celulaQuery.eq('coordenacao_id', scopeId);
      }

      const celulasRes = await celulaQuery;
      let allCelulas = celulasRes.data || [];

      if (scopeType === 'rede') {
        allCelulas = allCelulas.filter(c => (c.coordenacao as any)?.rede_id === scopeId);
      }

      const celulaIds = allCelulas.map(c => c.id);
      const totalCelulas = celulaIds.length;

      const empty: PulsoRedeData = {
        totalCelulas: 0, celulasComRelatorio: 0, percentualEngajamento: 0,
        percentualSemanaAnterior: 0, celulasAlerta1Semana: [], celulasAlerta2Semanas: [],
        celulasAlerta3Semanas: [], totalDiscipulados: 0, lideresEmTreinamento: 0,
        marcosEncontro: 0, marcosBatismo: 0, marcosDiscipulado: 0,
        marcosCursoLidere: 0, marcosRenovo: 0, marcosLiderEmTreinamento: 0,
        stagnantCount: 0, stagnantMembers: [], birthdays: [],
      };

      if (totalCelulas === 0) return empty;

      // 2. Build report query helper
      const buildReportQuery = (window: { from: string; to: string }) =>
        supabase.from('weekly_reports')
          .select('celula_id')
          .in('celula_id', celulaIds)
          .eq('is_test_data', false)
          .or(
            `and(meeting_date.gte.${window.from},meeting_date.lte.${window.to}),` +
            `and(meeting_date.is.null,week_start.gte.${window.from},week_start.lte.${window.to})`
          );

      const twoYearsAgo = addDays(now, -730);

      // 3. Fetch all in parallel
      const [
        thisWeekReports,
        lastWeekReports,
        twoWeekReports,
        membersRes,
        stagnantRes,
        profilesRes,
      ] = await Promise.all([
        buildReportQuery(thisWeek),
        buildReportQuery(lastWeek),
        buildReportQuery(twoWeeksAgo),
        supabase.from('members')
          .select('id, is_discipulado, is_lider_em_treinamento, encontro_com_deus, batismo, curso_lidere, renovo')
          .eq('is_active', true)
          .eq('is_test_data', false)
          .in('celula_id', celulaIds),
        supabase.from('members')
          .select(`
            id,
            joined_at,
            encontro_com_deus,
            batismo,
            curso_lidere,
            profile:profiles!members_profile_id_fkey(name, avatar_url),
            celula:celulas!members_celula_id_fkey(name)
          `)
          .eq('is_active', true)
          .eq('is_test_data', false)
          .in('celula_id', celulaIds)
          .lt('joined_at', twoYearsAgo.toISOString()),
        supabase.from('members')
          .select(`
            profile_id,
            celula:celulas!members_celula_id_fkey(name),
            profile:profiles!members_profile_id_fkey(id, name, avatar_url, birth_date)
          `)
          .eq('is_active', true)
          .eq('is_test_data', false)
          .in('celula_id', celulaIds),
      ]);

      // --- Engajamento ---
      const thisWeekIds = new Set((thisWeekReports.data || []).map(r => r.celula_id));
      const lastWeekIds = new Set((lastWeekReports.data || []).map(r => r.celula_id));
      const twoWeekIds = new Set((twoWeekReports.data || []).map(r => r.celula_id));

      const celulasComRelatorio = thisWeekIds.size;
      const percentualEngajamento = totalCelulas > 0 ? Math.round((celulasComRelatorio / totalCelulas) * 100) : 0;
      const percentualSemanaAnterior = totalCelulas > 0 ? Math.round((lastWeekIds.size / totalCelulas) * 100) : 0;

      // --- Alertas ---
      const celulasAlerta1Semana: CelulaReportStatus[] = [];
      const celulasAlerta2Semanas: CelulaReportStatus[] = [];
      const celulasAlerta3Semanas: CelulaReportStatus[] = [];

      for (const cel of allCelulas) {
        if (thisWeekIds.has(cel.id)) continue;
        const coordName = (cel.coordenacao as any)?.name || '';
        const status: CelulaReportStatus = {
          celula_id: cel.id, celula_name: cel.name,
          coordenacao_name: coordName, weeks_without_report: 1,
        };
        if (!lastWeekIds.has(cel.id) && !twoWeekIds.has(cel.id)) {
          status.weeks_without_report = 3;
          celulasAlerta3Semanas.push(status);
        } else if (!lastWeekIds.has(cel.id)) {
          status.weeks_without_report = 2;
          celulasAlerta2Semanas.push(status);
        } else {
          celulasAlerta1Semana.push(status);
        }
      }

      // --- Marcos espirituais ---
      const members = membersRes.data || [];
      const totalDiscipulados = members.filter(m => m.is_discipulado).length;
      const lideresEmTreinamento = members.filter(m => m.is_lider_em_treinamento).length;
      const marcosEncontro = members.filter(m => m.encontro_com_deus).length;
      const marcosBatismo = members.filter(m => m.batismo).length;
      const marcosDiscipulado = members.filter(m => m.is_discipulado).length;
      const marcosCursoLidere = members.filter(m => m.curso_lidere).length;
      const marcosRenovo = members.filter(m => m.renovo).length;
      const marcosLiderEmTreinamento = members.filter(m => m.is_lider_em_treinamento).length;

      // --- Estagnação espiritual ---
      const stagnantRaw = (stagnantRes.data || []).filter(m =>
        !m.encontro_com_deus && !m.batismo && !m.curso_lidere
      );
      const stagnantMembers: StagnantMemberScoped[] = stagnantRaw.map(m => ({
        id: m.id,
        name: (m.profile as any)?.name || 'Sem nome',
        avatar_url: (m.profile as any)?.avatar_url || null,
        celula_name: (m.celula as any)?.name || 'Sem célula',
      }));

      // --- Aniversários da semana ---
      const today = now;
      const todayMonthDay = format(today, 'MM-dd');
      const birthdays: ScopedBirthday[] = [];

      for (const m of profilesRes.data || []) {
        const p = m.profile as any;
        if (!p?.birth_date) continue;
        const birthMonthDay = format(parseISO(p.birth_date), 'MM-dd');
        let isInWeek = false;
        for (let d = 0; d <= 6; d++) {
          if (format(addDays(today, d), 'MM-dd') === birthMonthDay) { isInWeek = true; break; }
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
        totalCelulas, celulasComRelatorio, percentualEngajamento, percentualSemanaAnterior,
        celulasAlerta1Semana, celulasAlerta2Semanas, celulasAlerta3Semanas,
        totalDiscipulados, lideresEmTreinamento,
        marcosEncontro, marcosBatismo, marcosDiscipulado,
        marcosCursoLidere, marcosRenovo, marcosLiderEmTreinamento,
        stagnantCount: stagnantMembers.length, stagnantMembers,
        birthdays,
      };
    },
  });
}
