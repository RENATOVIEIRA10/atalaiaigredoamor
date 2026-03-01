import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

export interface CampusValidationRow {
  campo_id: string;
  campo_nome: string;
  celulas: number;
  membros: number;
  relatorios_2sem: number;
  relatorios_mes: number;
  novas_vidas_nova: number;
  novas_vidas_contatado: number;
  novas_vidas_agendado: number;
  novas_vidas_integrado: number;
  novas_vidas_membro: number;
  supervisoes_bimestre: number;
  disc_encontros: number;
  disc_presencas: number;
  event_registrations: number;
}

export interface ValidationResult {
  rows: CampusValidationRow[];
  globalTotals: CampusValidationRow;
  sumTotals: CampusValidationRow;
  isConsistent: boolean;
}

export function useGlobalValidation() {
  return useQuery({
    queryKey: ['global-validation'],
    staleTime: 120_000,
    queryFn: async (): Promise<ValidationResult> => {
      // Fetch all active campuses
      const { data: campos } = await supabase
        .from('campos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (!campos || campos.length === 0) {
        const empty = makeEmptyRow('', 'N/A');
        return { rows: [], globalTotals: empty, sumTotals: empty, isConsistent: true };
      }

      const now = new Date();
      const twoWeeksAgo = format(subDays(now, 14), 'yyyy-MM-dd');
      const monthAgo = format(subDays(now, 30), 'yyyy-MM-dd');
      const bimestreStart = format(subDays(now, 60), 'yyyy-MM-dd');

      // Build per-campus rows using count queries (no pagination needed)
      const rows: CampusValidationRow[] = [];

      for (const campo of campos) {
        const cid = campo.id;
        const [
          celulas, membros, rel2sem, relMes,
          nvNova, nvContatado, nvAgendado, nvIntegrado, nvMembro,
          supervisoes, discEnc, discPres, eventRegs,
        ] = await Promise.all([
          countQuery('celulas', (q) => q.eq('campo_id', cid)),
          countQuery('members', (q) => q.eq('campo_id', cid).eq('is_active', true)),
          countQuery('weekly_reports', (q) => q.eq('campo_id', cid).gte('week_start', twoWeeksAgo)),
          countQuery('weekly_reports', (q) => q.eq('campo_id', cid).gte('week_start', monthAgo)),
          countQuery('novas_vidas', (q) => q.eq('campo_id', cid).eq('status', 'nova')),
          countQuery('novas_vidas', (q) => q.eq('campo_id', cid).eq('status', 'contatado')),
          countQuery('novas_vidas', (q) => q.eq('campo_id', cid).eq('status', 'agendado')),
          countQuery('novas_vidas', (q) => q.eq('campo_id', cid).eq('status', 'integrado')),
          countQuery('novas_vidas', (q) => q.eq('campo_id', cid).eq('status', 'membro')),
          countQuery('supervisoes', (q) => q.eq('campo_id', cid).gte('data_supervisao', bimestreStart)),
          countQuery('discipulado_encontros', (q) => q.eq('campo_id', cid)),
          countQuery('discipulado_presencas', (q) => q.eq('campo_id', cid)),
          countQuery('event_registrations', (q) => q.eq('campo_id', cid)),
        ]);

        rows.push({
          campo_id: cid,
          campo_nome: campo.nome,
          celulas, membros, relatorios_2sem: rel2sem, relatorios_mes: relMes,
          novas_vidas_nova: nvNova, novas_vidas_contatado: nvContatado,
          novas_vidas_agendado: nvAgendado, novas_vidas_integrado: nvIntegrado,
          novas_vidas_membro: nvMembro,
          supervisoes_bimestre: supervisoes,
          disc_encontros: discEnc, disc_presencas: discPres,
          event_registrations: eventRegs,
        });
      }

      // Sum totals from per-campus
      const sumTotals = rows.reduce((acc, r) => {
        acc.celulas += r.celulas;
        acc.membros += r.membros;
        acc.relatorios_2sem += r.relatorios_2sem;
        acc.relatorios_mes += r.relatorios_mes;
        acc.novas_vidas_nova += r.novas_vidas_nova;
        acc.novas_vidas_contatado += r.novas_vidas_contatado;
        acc.novas_vidas_agendado += r.novas_vidas_agendado;
        acc.novas_vidas_integrado += r.novas_vidas_integrado;
        acc.novas_vidas_membro += r.novas_vidas_membro;
        acc.supervisoes_bimestre += r.supervisoes_bimestre;
        acc.disc_encontros += r.disc_encontros;
        acc.disc_presencas += r.disc_presencas;
        acc.event_registrations += r.event_registrations;
        return acc;
      }, makeEmptyRow('__sum__', 'SOMA DOS CAMPUS'));

      // Global totals (no campo filter)
      const [
        gCelulas, gMembros, gRel2sem, gRelMes,
        gNvNova, gNvContatado, gNvAgendado, gNvIntegrado, gNvMembro,
        gSupervisoes, gDiscEnc, gDiscPres, gEventRegs,
      ] = await Promise.all([
        countQuery('celulas'),
        countQuery('members', (q) => q.eq('is_active', true)),
        countQuery('weekly_reports', (q) => q.gte('week_start', twoWeeksAgo)),
        countQuery('weekly_reports', (q) => q.gte('week_start', monthAgo)),
        countQuery('novas_vidas', (q) => q.eq('status', 'nova')),
        countQuery('novas_vidas', (q) => q.eq('status', 'contatado')),
        countQuery('novas_vidas', (q) => q.eq('status', 'agendado')),
        countQuery('novas_vidas', (q) => q.eq('status', 'integrado')),
        countQuery('novas_vidas', (q) => q.eq('status', 'membro')),
        countQuery('supervisoes', (q) => q.gte('data_supervisao', bimestreStart)),
        countQuery('discipulado_encontros'),
        countQuery('discipulado_presencas'),
        countQuery('event_registrations'),
      ]);

      const globalTotals: CampusValidationRow = {
        campo_id: '__global__',
        campo_nome: 'TOTAL GLOBAL',
        celulas: gCelulas, membros: gMembros,
        relatorios_2sem: gRel2sem, relatorios_mes: gRelMes,
        novas_vidas_nova: gNvNova, novas_vidas_contatado: gNvContatado,
        novas_vidas_agendado: gNvAgendado, novas_vidas_integrado: gNvIntegrado,
        novas_vidas_membro: gNvMembro,
        supervisoes_bimestre: gSupervisoes,
        disc_encontros: gDiscEnc, disc_presencas: gDiscPres,
        event_registrations: gEventRegs,
      };

      // Consistency check
      const isConsistent = 
        globalTotals.celulas === sumTotals.celulas &&
        globalTotals.membros === sumTotals.membros &&
        globalTotals.relatorios_2sem === sumTotals.relatorios_2sem &&
        globalTotals.relatorios_mes === sumTotals.relatorios_mes &&
        globalTotals.supervisoes_bimestre === sumTotals.supervisoes_bimestre &&
        globalTotals.disc_encontros === sumTotals.disc_encontros &&
        globalTotals.event_registrations === sumTotals.event_registrations;

      return { rows, globalTotals, sumTotals, isConsistent };
    },
  });
}

function makeEmptyRow(id: string, nome: string): CampusValidationRow {
  return {
    campo_id: id, campo_nome: nome,
    celulas: 0, membros: 0, relatorios_2sem: 0, relatorios_mes: 0,
    novas_vidas_nova: 0, novas_vidas_contatado: 0, novas_vidas_agendado: 0,
    novas_vidas_integrado: 0, novas_vidas_membro: 0,
    supervisoes_bimestre: 0, disc_encontros: 0, disc_presencas: 0,
    event_registrations: 0,
  };
}

async function countQuery(table: string, filters?: (q: any) => any): Promise<number> {
  let q = (supabase.from as any)(table).select('id', { count: 'exact', head: true });
  if (filters) q = filters(q);
  const { count } = await q;
  return count || 0;
}
