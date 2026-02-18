import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface RedeEmailReportData {
  // Meta
  redeName: string;
  redeLeader: string;
  periodoInicio: string;
  periodoFim: string;
  geradoEm: string;

  // KPIs
  totalCelulasAtivas: number;
  relatoriosEnviados: number;
  relatoriosPendentes: number;
  percEnvio: number;
  pessoasNasCelulas: number; // cadastro ativo
  discipuladosTotal: number;
  lideresEmTreinamentoTotal: number;
  criancasTotal: number;
  visitantesTotal: number;
  multiplicacoesTotal: number;
  aniversariantesCount: number;

  // Risco
  celulasRisco1: { nome: string; coordenacao: string; supervisor: string; ultimoRelatorio: string | null }[];
  celulasRisco2: { nome: string; coordenacao: string; supervisor: string; ultimoRelatorio: string | null }[];
  celulasRisco3: { nome: string; coordenacao: string; supervisor: string; ultimoRelatorio: string | null }[];

  // Por coordenação (para Excel Aba 3)
  coordenacoes: {
    nome: string;
    casalCoordenador: string;
    totalSupervisores: number;
    totalCelulas: number;
    relatoriosEnviados: number;
    relatoriosPendentes: number;
    percEnvio: number;
    pessoasCadastradas: number;
    discipuladosTotal: number;
    lideresTotal: number;
    criancasTotal: number;
    visitantesTotal: number;
    multiplicacoesTotal: number;
    celulasRisco: number;
  }[];

  // Cells raw (para Excel Aba 5)
  celulas: {
    nome: string;
    id: string;
    coordenacao: string;
    supervisor: string;
    casalLider: string;
    diaSemana: string;
    horario: string;
    endereco: string;
    bairro: string;
    cidade: string;
    instagram1: string;
    instagram2: string;
    instagram3: string;
    membrosCadastrados: number;
    dataCriacao: string;
    status: string;
  }[];

  // Reports raw (para Excel Aba 6)
  relatorios: {
    dataRelatorio: string;
    celulaName: string;
    coordenacaoName: string;
    supervisorName: string;
    casalLider: string;
    membrosInformados: number;
    visitantes: number;
    criancas: number;
    lideresEmTreinamento: number;
    discipulados: number;
    comentario: string;
    enviadoEm: string;
  }[];

  // Aniversariantes (para Excel Aba 8)
  aniversariantes: {
    dataAniversario: string;
    nome: string;
    celulaName: string;
    coordenacaoName: string;
    supervisorName: string;
    telefone: string;
  }[];

  // Multiplicações (para Excel Aba 9)
  multiplicacoes: {
    data: string;
    celulaOrigem: string;
    celulaNova: string;
    coordenacao: string;
    supervisor: string;
    casalLiderNova: string;
    notas: string;
  }[];
}

interface UseRedeEmailReportOptions {
  redeId: string;
  dateFrom: string; // yyyy-MM-dd
  dateTo: string;   // yyyy-MM-dd
  redeName?: string;
  redeLeaderName?: string;
}

export function useRedeEmailReport({ redeId, dateFrom, dateTo, redeName, redeLeaderName }: UseRedeEmailReportOptions) {
  return useQuery({
    queryKey: ['rede-email-report', redeId, dateFrom, dateTo],
    enabled: !!redeId && !!dateFrom && !!dateTo,
    queryFn: async (): Promise<RedeEmailReportData> => {
      // 1. Fetch all celulas in rede with full detail
      const { data: allCelulas } = await supabase
        .from('celulas')
        .select(`
          id, name, meeting_day, meeting_time, address, bairro, cidade,
          instagram_celula, instagram_lider1, instagram_lider2,
          created_at,
          coordenacao:coordenacoes!celulas_coordenacao_id_fkey(
            id, name,
            rede_id,
            leadership_couple:leadership_couples!coordenacoes_leadership_couple_id_fkey(
              spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
              spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
            )
          ),
          supervisor:supervisores!celulas_supervisor_id_fkey(
            leadership_couple:leadership_couples!supervisores_leadership_couple_id_fkey(
              spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
              spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
            )
          ),
          leadership_couple:leadership_couples!celulas_leadership_couple_id_fkey(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          )
        `);

      // Filter by rede
      const celulasInRede = (allCelulas || []).filter(c => (c.coordenacao as any)?.rede_id === redeId);
      const celulaIds = celulasInRede.map(c => c.id);

      if (celulaIds.length === 0) {
        return buildEmptyData(redeName, redeLeaderName, dateFrom, dateTo);
      }

      // 2. Fetch reports for period
      const [reportsRes, membersRes, multiplicacoesRes] = await Promise.all([
        supabase.from('weekly_reports')
          .select('id, celula_id, week_start, members_present, visitors, children, leaders_in_training, discipleships, notes, created_at, meeting_date')
          .gte('week_start', dateFrom)
          .lte('week_start', dateTo)
          .in('celula_id', celulaIds),
        supabase.from('members')
          .select('id, celula_id, is_active, is_discipulado, is_lider_em_treinamento, profile:profiles!members_profile_id_fkey(name, birth_date, avatar_url)')
          .in('celula_id', celulaIds),
        supabase.from('multiplicacoes')
          .select(`
            id, data_multiplicacao, notes,
            celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(id, name),
            celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(id, name)
          `)
          .in('celula_origem_id', celulaIds)
          .gte('data_multiplicacao', dateFrom)
          .lte('data_multiplicacao', dateTo),
      ]);

      const reports = reportsRes.data || [];
      const allMembers = membersRes.data || [];
      const activeMembers = allMembers.filter(m => m.is_active);
      const multiplicacoes = multiplicacoesRes.data || [];

      // 3. Alertas (células sem envio)
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const lastWeekStart = subDays(thisWeekStart, 7);
      const twoWeeksAgo = subDays(thisWeekStart, 14);

      const [tw, lw, tww] = await Promise.all([
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(thisWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(lastWeekStart, 'yyyy-MM-dd')).lt('week_start', format(thisWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
        supabase.from('weekly_reports').select('celula_id').gte('week_start', format(twoWeeksAgo, 'yyyy-MM-dd')).lt('week_start', format(lastWeekStart, 'yyyy-MM-dd')).in('celula_id', celulaIds),
      ]);

      const twIds = new Set((tw.data || []).map(r => r.celula_id));
      const lwIds = new Set((lw.data || []).map(r => r.celula_id));
      const twwIds = new Set((tww.data || []).map(r => r.celula_id));

      const celulasRisco1: RedeEmailReportData['celulasRisco1'] = [];
      const celulasRisco2: RedeEmailReportData['celulasRisco2'] = [];
      const celulasRisco3: RedeEmailReportData['celulasRisco3'] = [];

      for (const cel of celulasInRede) {
        if (twIds.has(cel.id)) continue;
        const sup = cel.supervisor as any;
        const supCouple = sup?.leadership_couple;
        const supervisorName = supCouple?.spouse1?.name && supCouple?.spouse2?.name
          ? `${supCouple.spouse1.name} & ${supCouple.spouse2.name}`
          : supCouple?.spouse1?.name || supCouple?.spouse2?.name || '—';
        const coordName = (cel.coordenacao as any)?.name || '—';
        const entry = { nome: cel.name, coordenacao: coordName, supervisor: supervisorName, ultimoRelatorio: null };
        if (!lwIds.has(cel.id) && !twwIds.has(cel.id)) celulasRisco3.push(entry);
        else if (!lwIds.has(cel.id)) celulasRisco2.push(entry);
        else celulasRisco1.push(entry);
      }

      // 4. Aniversariantes (próximos 7 dias)
      const today = new Date();
      const weekDaysMD: string[] = [];
      for (let i = 0; i < 7; i++) weekDaysMD.push(format(new Date(today.getTime() + i * 86400000), 'MM-dd'));

      const aniversariantes: RedeEmailReportData['aniversariantes'] = [];
      for (const m of activeMembers) {
        const profile = m.profile as any;
        if (!profile?.birth_date) continue;
        const bdMD = profile.birth_date.slice(5); // MM-DD from YYYY-MM-DD
        if (weekDaysMD.includes(bdMD)) {
          const cel = celulasInRede.find(c => c.id === m.celula_id);
          const coordName = (cel?.coordenacao as any)?.name || '—';
          const sup = (cel?.supervisor as any);
          const supCouple = sup?.leadership_couple;
          const supervisorName = supCouple?.spouse1?.name && supCouple?.spouse2?.name
            ? `${supCouple.spouse1.name} & ${supCouple.spouse2.name}`
            : supCouple?.spouse1?.name || supCouple?.spouse2?.name || '—';
          aniversariantes.push({
            dataAniversario: profile.birth_date.slice(5).split('-').reverse().join('/'),
            nome: profile.name,
            celulaName: cel?.name || '—',
            coordenacaoName: coordName,
            supervisorName,
            telefone: '—',
          });
        }
      }

      // 5. Helper: coordenação stats
      const coordMap: Record<string, typeof celulasInRede> = {};
      for (const c of celulasInRede) {
        const coordId = (c.coordenacao as any)?.id || 'sem_coord';
        if (!coordMap[coordId]) coordMap[coordId] = [];
        coordMap[coordId].push(c);
      }

      const celulaIdsInPeriod = new Set(reports.map(r => r.celula_id));
      const coordenacoesList: RedeEmailReportData['coordenacoes'] = Object.entries(coordMap).map(([coordId, cels]) => {
        const coord = cels[0].coordenacao as any;
        const couple = coord?.leadership_couple;
        const casalNome = couple?.spouse1?.name && couple?.spouse2?.name
          ? `${couple.spouse1.name} & ${couple.spouse2.name}`
          : couple?.spouse1?.name || couple?.spouse2?.name || '—';
        const celIds = cels.map(c => c.id);
        const coordReports = reports.filter(r => celIds.includes(r.celula_id));
        const coordMembers = activeMembers.filter(m => celIds.includes(m.celula_id));
        const enviados = celIds.filter(id => celulaIdsInPeriod.has(id)).length;
        const risco = celIds.filter(id => !twIds.has(id)).length;
        return {
          nome: coord?.name || '—',
          casalCoordenador: casalNome,
          totalSupervisores: 0,
          totalCelulas: cels.length,
          relatoriosEnviados: enviados,
          relatoriosPendentes: cels.length - enviados,
          percEnvio: cels.length > 0 ? Math.round((enviados / cels.length) * 100) : 0,
          pessoasCadastradas: coordMembers.length,
          discipuladosTotal: coordMembers.filter(m => m.is_discipulado).length,
          lideresTotal: coordMembers.filter(m => m.is_lider_em_treinamento).length,
          criancasTotal: coordReports.reduce((s, r) => s + r.children, 0),
          visitantesTotal: coordReports.reduce((s, r) => s + r.visitors, 0),
          multiplicacoesTotal: multiplicacoes.filter(m => {
            const dest = m.celula_destino as any;
            return celIds.includes((dest)?.id || '');
          }).length,
          celulasRisco: risco,
        };
      });

      // 6. Celulas list (Aba 5)
      const celulasExport: RedeEmailReportData['celulas'] = celulasInRede.map(c => {
        const coordName = (c.coordenacao as any)?.name || '—';
        const sup = (c.supervisor as any);
        const supCouple = sup?.leadership_couple;
        const supervisorName = supCouple?.spouse1?.name && supCouple?.spouse2?.name
          ? `${supCouple.spouse1.name} & ${supCouple.spouse2.name}`
          : supCouple?.spouse1?.name || supCouple?.spouse2?.name || '—';
        const lc = (c.leadership_couple as any);
        const casalLider = lc?.spouse1?.name && lc?.spouse2?.name
          ? `${lc.spouse1.name} & ${lc.spouse2.name}`
          : lc?.spouse1?.name || lc?.spouse2?.name || '—';
        const membCount = activeMembers.filter(m => m.celula_id === c.id).length;
        return {
          nome: c.name,
          id: c.id,
          coordenacao: coordName,
          supervisor: supervisorName,
          casalLider,
          diaSemana: c.meeting_day || '—',
          horario: c.meeting_time ? String(c.meeting_time).slice(0, 5) : '—',
          endereco: c.address || '—',
          bairro: c.bairro || '—',
          cidade: c.cidade || '—',
          instagram1: c.instagram_lider1 || '—',
          instagram2: c.instagram_lider2 || '—',
          instagram3: c.instagram_celula || '—',
          membrosCadastrados: membCount,
          dataCriacao: format(new Date(c.created_at), 'dd/MM/yyyy'),
          status: 'ativa',
        };
      });

      // 7. Reports list (Aba 6)
      const relatoriosExport: RedeEmailReportData['relatorios'] = reports.map(r => {
        const cel = celulasInRede.find(c => c.id === r.celula_id);
        const coordName = (cel?.coordenacao as any)?.name || '—';
        const sup = (cel?.supervisor as any);
        const supCouple = sup?.leadership_couple;
        const supervisorName = supCouple?.spouse1?.name && supCouple?.spouse2?.name
          ? `${supCouple.spouse1.name} & ${supCouple.spouse2.name}`
          : supCouple?.spouse1?.name || supCouple?.spouse2?.name || '—';
        const lc = (cel?.leadership_couple as any);
        const casalLider = lc?.spouse1?.name && lc?.spouse2?.name
          ? `${lc.spouse1.name} & ${lc.spouse2.name}`
          : lc?.spouse1?.name || lc?.spouse2?.name || '—';
        return {
          dataRelatorio: r.meeting_date || r.week_start,
          celulaName: cel?.name || '—',
          coordenacaoName: coordName,
          supervisorName,
          casalLider,
          membrosInformados: r.members_present,
          visitantes: r.visitors,
          criancas: r.children,
          lideresEmTreinamento: r.leaders_in_training,
          discipulados: r.discipleships,
          comentario: r.notes || '—',
          enviadoEm: format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
        };
      });

      // 8. Multiplicações (Aba 9)
      const multiplicacoesExport: RedeEmailReportData['multiplicacoes'] = multiplicacoes.map(m => {
        const destId = (m.celula_destino as any)?.id;
        const destCel = celulasInRede.find(c => c.id === destId);
        const coordName = (destCel?.coordenacao as any)?.name || '—';
        const sup = (destCel?.supervisor as any);
        const supCouple = sup?.leadership_couple;
        const supervisorName = supCouple?.spouse1?.name && supCouple?.spouse2?.name
          ? `${supCouple.spouse1.name} & ${supCouple.spouse2.name}`
          : supCouple?.spouse1?.name || supCouple?.spouse2?.name || '—';
        const lc = (destCel?.leadership_couple as any);
        const casalLider = lc?.spouse1?.name && lc?.spouse2?.name
          ? `${lc.spouse1.name} & ${lc.spouse2.name}`
          : lc?.spouse1?.name || lc?.spouse2?.name || '—';
        return {
          data: format(new Date(m.data_multiplicacao), 'dd/MM/yyyy'),
          celulaOrigem: (m.celula_origem as any)?.name || '—',
          celulaNova: (m.celula_destino as any)?.name || '—',
          coordenacao: coordName,
          supervisor: supervisorName,
          casalLiderNova: casalLider,
          notas: m.notes || '—',
        };
      });

      // 9. Global totals
      const totalRelEnviados = celulaIds.filter(id => celulaIdsInPeriod.has(id)).length;

      return {
        redeName: redeName || 'Rede Amor a 2',
        redeLeader: redeLeaderName || '—',
        periodoInicio: format(new Date(dateFrom), 'dd/MM/yyyy', { locale: ptBR }),
        periodoFim: format(new Date(dateTo), 'dd/MM/yyyy', { locale: ptBR }),
        geradoEm: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        totalCelulasAtivas: celulaIds.length,
        relatoriosEnviados: totalRelEnviados,
        relatoriosPendentes: celulaIds.length - totalRelEnviados,
        percEnvio: celulaIds.length > 0 ? Math.round((totalRelEnviados / celulaIds.length) * 100) : 0,
        pessoasNasCelulas: activeMembers.length,
        discipuladosTotal: activeMembers.filter(m => m.is_discipulado).length,
        lideresEmTreinamentoTotal: activeMembers.filter(m => m.is_lider_em_treinamento).length,
        criancasTotal: reports.reduce((s, r) => s + r.children, 0),
        visitantesTotal: reports.reduce((s, r) => s + r.visitors, 0),
        multiplicacoesTotal: multiplicacoes.length,
        aniversariantesCount: aniversariantes.length,
        celulasRisco1,
        celulasRisco2,
        celulasRisco3,
        coordenacoes: coordenacoesList,
        celulas: celulasExport,
        relatorios: relatoriosExport,
        aniversariantes,
        multiplicacoes: multiplicacoesExport,
      };
    },
  });
}

function buildEmptyData(redeName?: string, redeLeader?: string, dateFrom?: string, dateTo?: string): RedeEmailReportData {
  const now = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  return {
    redeName: redeName || 'Rede Amor a 2', redeLeader: redeLeader || '—',
    periodoInicio: dateFrom ? format(new Date(dateFrom), 'dd/MM/yyyy', { locale: ptBR }) : '—',
    periodoFim: dateTo ? format(new Date(dateTo), 'dd/MM/yyyy', { locale: ptBR }) : '—',
    geradoEm: now,
    totalCelulasAtivas: 0, relatoriosEnviados: 0, relatoriosPendentes: 0, percEnvio: 0,
    pessoasNasCelulas: 0, discipuladosTotal: 0, lideresEmTreinamentoTotal: 0,
    criancasTotal: 0, visitantesTotal: 0, multiplicacoesTotal: 0, aniversariantesCount: 0,
    celulasRisco1: [], celulasRisco2: [], celulasRisco3: [],
    coordenacoes: [], celulas: [], relatorios: [], aniversariantes: [], multiplicacoes: [],
  };
}
