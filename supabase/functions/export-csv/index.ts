import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ];
  return '\uFEFF' + lines.join('\n'); // UTF-8 BOM
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'membros';
    const includeTestData = url.searchParams.get('include_test') === 'true';
    const seedRunId = url.searchParams.get('seed_run_id');
    // Scope filters
    const coordenacaoId = url.searchParams.get('coordenacao_id');
    const redeId = url.searchParams.get('rede_id');

    // Build celulas filter by scope
    let scopeCelulaIds: string[] | null = null;

    if (coordenacaoId) {
      const { data } = await supabase.from('celulas').select('id').eq('coordenacao_id', coordenacaoId);
      scopeCelulaIds = (data || []).map(c => c.id);
    } else if (redeId) {
      const { data: coords } = await supabase.from('coordenacoes').select('id').eq('rede_id', redeId);
      const coordIds = (coords || []).map(c => c.id);
      const { data } = await supabase.from('celulas').select('id').in('coordenacao_id', coordIds);
      scopeCelulaIds = (data || []).map(c => c.id);
    }

    let csvData = '';
    let filename = type;

    // ─── MEMBROS ───
    if (type === 'membros') {
      let query = supabase
        .from('members')
        .select(`
          id, joined_at, is_active, is_lider_em_treinamento, is_discipulado,
          encontro_com_deus, batismo, encontro_de_casais, curso_lidere, renovo,
          is_test_data, seed_run_id,
          profile:profiles(name, birth_date, email, joined_church_at),
          celula:celulas(name, coordenacao:coordenacoes(name, rede:redes(name)))
        `);

      if (!includeTestData) query = query.eq('is_test_data', false);
      if (seedRunId) query = query.eq('seed_run_id', seedRunId);
      if (scopeCelulaIds) query = query.in('celula_id', scopeCelulaIds);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((m: any) => ({
        nome: m.profile?.name || '',
        email: m.profile?.email || '',
        data_nascimento: m.profile?.birth_date || '',
        data_entrada_igreja: m.profile?.joined_church_at || '',
        data_entrada_celula: m.joined_at?.split('T')[0] || '',
        celula: m.celula?.name || '',
        coordenacao: m.celula?.coordenacao?.name || '',
        rede: m.celula?.coordenacao?.rede?.name || '',
        ativo: m.is_active ? 'Sim' : 'Não',
        lider_treinamento: m.is_lider_em_treinamento ? 'Sim' : 'Não',
        discipulado: m.is_discipulado ? 'Sim' : 'Não',
        encontro_com_deus: m.encontro_com_deus ? 'Sim' : 'Não',
        batismo: m.batismo ? 'Sim' : 'Não',
        encontro_de_casais: m.encontro_de_casais ? 'Sim' : 'Não',
        curso_lidere: m.curso_lidere ? 'Sim' : 'Não',
        renovo: m.renovo ? 'Sim' : 'Não',
        dado_teste: m.is_test_data ? 'Sim' : 'Não',
      }));

      csvData = toCSV(rows);
      filename = 'membros';
    }

    // ─── RELATÓRIOS SEMANAIS ───
    else if (type === 'relatorios') {
      let query = supabase
        .from('weekly_reports')
        .select(`
          id, week_start, meeting_date, members_present, visitors, children,
          leaders_in_training, discipleships, notes, created_at, is_test_data, seed_run_id,
          celula:celulas(name, coordenacao:coordenacoes(name, rede:redes(name))),
          created_by_profile:profiles!weekly_reports_created_by_fkey(name)
        `)
        .order('week_start', { ascending: false });

      if (!includeTestData) query = query.eq('is_test_data', false);
      if (seedRunId) query = query.eq('seed_run_id', seedRunId);
      if (scopeCelulaIds) query = query.in('celula_id', scopeCelulaIds);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        data_semana: r.week_start || '',
        data_reuniao: r.meeting_date || '',
        celula: r.celula?.name || '',
        coordenacao: r.celula?.coordenacao?.name || '',
        rede: r.celula?.coordenacao?.rede?.name || '',
        membros_presentes: r.members_present,
        visitantes: r.visitors,
        criancas: r.children,
        lideres_treinamento: r.leaders_in_training,
        discipulados: r.discipleships,
        total: r.members_present + r.visitors + r.children + r.leaders_in_training + r.discipleships,
        observacoes: r.notes || '',
        enviado_em: r.created_at?.split('T')[0] || '',
        enviado_por: r.created_by_profile?.name || '',
        dado_teste: r.is_test_data ? 'Sim' : 'Não',
      }));

      csvData = toCSV(rows);
      filename = 'relatorios_semanais';
    }

    // ─── CÉLULAS ───
    else if (type === 'celulas') {
      let query = supabase
        .from('celulas')
        .select(`
          id, name, address, bairro, cidade, meeting_day, meeting_time,
          instagram_celula, instagram_lider1, instagram_lider2,
          created_at, is_test_data, seed_run_id,
          coordenacao:coordenacoes(name, rede:redes(name)),
          leadership_couple:leadership_couples(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          )
        `);

      if (!includeTestData) query = query.eq('is_test_data', false);
      if (seedRunId) query = query.eq('seed_run_id', seedRunId);
      if (coordenacaoId) query = query.eq('coordenacao_id', coordenacaoId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((c: any) => ({
        nome_celula: c.name || '',
        coordenacao: c.coordenacao?.name || '',
        rede: c.coordenacao?.rede?.name || '',
        casal_lider: c.leadership_couple
          ? `${c.leadership_couple.spouse1?.name || ''} & ${c.leadership_couple.spouse2?.name || ''}`
          : '',
        dia_semana: c.meeting_day || '',
        horario: c.meeting_time || '',
        endereco: c.address || '',
        bairro: c.bairro || '',
        cidade: c.cidade || '',
        instagram_celula: c.instagram_celula || '',
        instagram_lider1: c.instagram_lider1 || '',
        instagram_lider2: c.instagram_lider2 || '',
        data_criacao: c.created_at?.split('T')[0] || '',
        dado_teste: c.is_test_data ? 'Sim' : 'Não',
      }));

      csvData = toCSV(rows);
      filename = 'celulas';
    }

    // ─── COORDENAÇÕES ───
    else if (type === 'coordenacoes') {
      const { data, error } = await supabase
        .from('coordenacoes')
        .select(`
          id, name, created_at,
          rede:redes(name),
          leadership_couple:leadership_couples(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          )
        `);

      if (error) throw error;

      const rows = (data || []).map((c: any) => ({
        nome_coordenacao: c.name || '',
        rede: c.rede?.name || '',
        casal_coordenador: c.leadership_couple
          ? `${c.leadership_couple.spouse1?.name || ''} & ${c.leadership_couple.spouse2?.name || ''}`
          : '',
        data_criacao: c.created_at?.split('T')[0] || '',
      }));

      csvData = toCSV(rows);
      filename = 'coordenacoes';
    }

    // ─── PENDÊNCIAS ───
    else if (type === 'pendencias') {
      const { data: celulas } = await supabase
        .from('celulas')
        .select(`id, name, coordenacao:coordenacoes(name, rede:redes(name)), leadership_couple:leadership_couples(
          spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
          spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
        )`)
        .eq('is_test_data', false);

      const { data: recentReports } = await supabase
        .from('weekly_reports')
        .select('celula_id, week_start')
        .eq('is_test_data', false)
        .gte('week_start', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('week_start', { ascending: false });

      const lastReportByCelula = new Map<string, string>();
      for (const r of (recentReports || [])) {
        if (!lastReportByCelula.has(r.celula_id)) {
          lastReportByCelula.set(r.celula_id, r.week_start);
        }
      }

      const today = new Date();
      const rows = (celulas || [])
        .filter(c => scopeCelulaIds ? scopeCelulaIds.includes(c.id) : true)
        .map((c: any) => {
          const lastReport = lastReportByCelula.get(c.id);
          const weeksSince = lastReport
            ? Math.floor((today.getTime() - new Date(lastReport + 'T12:00:00Z').getTime()) / (7 * 24 * 60 * 60 * 1000))
            : 99;
          const nivel = weeksSince >= 3 ? '3_mais' : weeksSince === 2 ? '2_semanas' : weeksSince === 1 ? '1_semana' : 'em_dia';

          return {
            celula: c.name || '',
            coordenacao: c.coordenacao?.name || '',
            rede: c.coordenacao?.rede?.name || '',
            casal_lider: c.leadership_couple
              ? `${c.leadership_couple.spouse1?.name || ''} & ${c.leadership_couple.spouse2?.name || ''}`
              : '',
            ultimo_relatorio: lastReport || 'Nunca',
            semanas_sem_enviar: weeksSince === 99 ? 'Nunca enviou' : String(weeksSince),
            nivel_risco: nivel,
            acao_sugerida: nivel === '3_mais' ? 'Contato urgente com líder' : nivel === '2_semanas' ? 'Verificar situação' : nivel === '1_semana' ? 'Lembrete gentil' : '',
          };
        })
        .filter(r => r.nivel_risco !== 'em_dia');

      csvData = toCSV(rows);
      filename = 'pendencias';
    }

    // ─── ANIVERSARIANTES ───
    else if (type === 'aniversariantes') {
      const today = new Date();
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const in7MMDD = `${String(in7Days.getMonth() + 1).padStart(2, '0')}-${String(in7Days.getDate()).padStart(2, '0')}`;

      let membersQuery = supabase
        .from('members')
        .select(`
          id, celula_id,
          profile:profiles(name, birth_date),
          celula:celulas(name, coordenacao:coordenacoes(name))
        `)
        .eq('is_active', true)
        .eq('is_test_data', false)
        .not('profile.birth_date', 'is', null);

      if (scopeCelulaIds) membersQuery = membersQuery.in('celula_id', scopeCelulaIds);

      const { data, error } = await membersQuery;
      if (error) throw error;

      const rows = (data || [])
        .filter((m: any) => {
          if (!m.profile?.birth_date) return false;
          const bd = m.profile.birth_date;
          const mmdd = bd.slice(5, 10); // MM-DD
          if (todayMMDD <= in7MMDD) {
            return mmdd >= todayMMDD && mmdd <= in7MMDD;
          } else {
            return mmdd >= todayMMDD || mmdd <= in7MMDD;
          }
        })
        .map((m: any) => ({
          data_aniversario: m.profile?.birth_date?.slice(5) || '',
          nome: m.profile?.name || '',
          celula: m.celula?.name || '',
          coordenacao: m.celula?.coordenacao?.name || '',
        }))
        .sort((a, b) => a.data_aniversario.localeCompare(b.data_aniversario));

      csvData = toCSV(rows);
      filename = 'aniversariantes';
    }

    // ─── SUPERVISÕES ───
    else if (type === 'supervisoes') {
      let query = supabase
        .from('supervisoes')
        .select(`
          id, data_supervisao, horario_inicio, horario_termino, celula_realizada,
          louvor, licao, oracao_inicial, oracao_final, pontualidade,
          pontos_positivos, pontos_alinhar, motivo_cancelamento,
          is_test_data, seed_run_id,
          celula:celulas(name, coordenacao:coordenacoes(name)),
          supervisor:supervisores(profile:profiles(name))
        `)
        .order('data_supervisao', { ascending: false });

      if (!includeTestData) query = query.eq('is_test_data', false);
      if (seedRunId) query = query.eq('seed_run_id', seedRunId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || [])
        .filter((s: any) => scopeCelulaIds ? scopeCelulaIds.includes(s.celula_id) : true)
        .map((s: any) => ({
          data: s.data_supervisao || '',
          hora_inicio: s.horario_inicio || '',
          hora_termino: s.horario_termino || '',
          celula: s.celula?.name || '',
          coordenacao: s.celula?.coordenacao?.name || '',
          supervisor: s.supervisor?.profile?.name || '',
          celula_realizada: s.celula_realizada ? 'Sim' : 'Não',
          louvor: s.louvor ? 'Sim' : 'Não',
          licao: s.licao ? 'Sim' : 'Não',
          oracao_inicial: s.oracao_inicial ? 'Sim' : 'Não',
          oracao_final: s.oracao_final ? 'Sim' : 'Não',
          pontualidade: s.pontualidade ? 'Sim' : 'Não',
          pontos_positivos: s.pontos_positivos || '',
          pontos_alinhar: s.pontos_alinhar || '',
          motivo_cancelamento: s.motivo_cancelamento || '',
          dado_teste: s.is_test_data ? 'Sim' : 'Não',
        }));

      csvData = toCSV(rows);
      filename = 'supervisoes';
    }

    // ─── MULTIPLICAÇÕES ───
    else if (type === 'multiplicacoes') {
      let query = supabase
        .from('multiplicacoes')
        .select(`
          id, data_multiplicacao, notes, is_test_data, seed_run_id,
          celula_origem:celulas!multiplicacoes_celula_origem_id_fkey(name, coordenacao:coordenacoes(name)),
          celula_destino:celulas!multiplicacoes_celula_destino_id_fkey(name, leadership_couple:leadership_couples(
            spouse1:profiles!leadership_couples_spouse1_id_fkey(name),
            spouse2:profiles!leadership_couples_spouse2_id_fkey(name)
          ))
        `)
        .order('data_multiplicacao', { ascending: false });

      if (!includeTestData) query = query.eq('is_test_data', false);
      if (seedRunId) query = query.eq('seed_run_id', seedRunId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map((m: any) => ({
        data_multiplicacao: m.data_multiplicacao || '',
        celula_origem: m.celula_origem?.name || '',
        coordenacao: m.celula_origem?.coordenacao?.name || '',
        celula_nova: m.celula_destino?.name || '',
        casal_lider_nova: m.celula_destino?.leadership_couple
          ? `${m.celula_destino.leadership_couple.spouse1?.name || ''} & ${m.celula_destino.leadership_couple.spouse2?.name || ''}`
          : '',
        notas: m.notes || '',
        dado_teste: m.is_test_data ? 'Sim' : 'Não',
      }));

      csvData = toCSV(rows);
      filename = 'multiplicacoes';
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${dateStr}.csv`;

    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fullFilename}"`,
      }
    });

  } catch (err) {
    console.error('export-csv error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
