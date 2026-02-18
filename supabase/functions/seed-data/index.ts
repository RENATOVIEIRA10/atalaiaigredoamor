import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ─── Data Helpers ───
const PT_FIRST_NAMES = ['Ana','Maria','João','Pedro','Lucas','Gabriel','Mariana','Julia','Felipe','Rodrigo','Camila','Beatriz','Rafael','Thiago','Larissa','Paula','Carlos','Eduardo','Fernanda','Isabela','Diego','Gustavo','Amanda','Leticia','Bruno','Renata','Daniel','Patricia','Andre','Tatiana','Alexandre','Vanessa','Roberto','Claudia','Marcelo','Monica','Leandro','Adriana','Fabio','Silvia'];
const PT_LAST_NAMES = ['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Ferreira','Rodrigues','Almeida','Nascimento','Gomes','Martins','Araujo','Carvalho','Melo','Ribeiro','Barbosa','Nunes','Moura'];

function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateName(): string {
  return `${randItem(PT_FIRST_NAMES)} ${randItem(PT_LAST_NAMES)}`;
}

function generateBirthDate(minAge: number, maxAge: number): string {
  const year = new Date().getFullYear() - randInt(minAge, maxAge);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateJoinedChurchAt(): string {
  const year = randInt(2010, 2025);
  const month = String(randInt(1, 12)).padStart(2, '0');
  const day = String(randInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatePhone(): string {
  return `(${randInt(11, 99)}) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`;
}

function getMonday(d: Date): Date {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  dt.setDate(diff);
  return dt;
}

function dateToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeeksInPeriod(fromStr: string, toStr: string): string[] {
  const from = new Date(fromStr + 'T12:00:00Z');
  const to = new Date(toStr + 'T12:00:00Z');
  const weeks: string[] = [];
  let current = getMonday(from);
  while (current <= to) {
    weeks.push(dateToString(current));
    current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  return weeks;
}

const NOTES_POOL = [
  'Reunião abençoada, muita presença de Deus.',
  'Célula com visitantes novos, ótimo acolhimento.',
  'Estudamos sobre fé e gratidão.',
  'Tempo de oração intenso.',
  'Novos membros participaram pela primeira vez.',
  'Momento de louvor especial.',
  'Discutimos os valores do Reino.',
  'Célula cheia de energia e alegria.',
  'Testemunhos marcantes compartilhados.',
  'Foco em discipulado e crescimento pessoal.',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, seed_run_id, period_from, period_to } = body;

    if (!action || !seed_run_id) {
      return new Response(JSON.stringify({ error: 'Missing action or seed_run_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_members ───
    if (action === 'seed_members') {
      const { data: celulas, error: celulasErr } = await supabase
        .from('celulas')
        .select('id, coordenacao_id')
        .eq('is_test_data', false);

      if (celulasErr) throw celulasErr;

      let totalCreated = 0;
      const MEMBERS_PER_CELULA = 7;
      const MARCOS = ['encontro_com_deus', 'batismo', 'encontro_de_casais', 'curso_lidere', 'renovo'];

      for (const celula of (celulas || [])) {
        for (let i = 0; i < MEMBERS_PER_CELULA; i++) {
          // Create profile
          const userId = crypto.randomUUID();
          const joinedAt = generateJoinedChurchAt();
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              name: generateName(),
              birth_date: generateBirthDate(18, 65),
              joined_church_at: joinedAt,
              email: `test_${userId.slice(0, 8)}@seed.local`,
              is_test_data: true,
              seed_run_id,
            })
            .select('id')
            .single();

          if (profileErr || !profile) continue;

          // Random spiritual milestones (2 to all)
          const numMarcos = randInt(2, MARCOS.length);
          const selectedMarcos = [...MARCOS].sort(() => Math.random() - 0.5).slice(0, numMarcos);
          const marcosObj: Record<string, boolean> = {};
          for (const m of selectedMarcos) marcosObj[m] = true;

          await supabase.from('members').insert({
            profile_id: profile.id,
            celula_id: celula.id,
            joined_at: joinedAt,
            is_active: true,
            is_test_data: true,
            seed_run_id,
            ...marcosObj,
          });

          totalCreated++;
        }
      }

      // Update seed run totals
      const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
      const totals = existingRun?.totals || {};
      await supabase.from('seed_runs').update({
        totals: { ...totals, members: totalCreated },
        status: 'done'
      }).eq('id', seed_run_id);

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_reports ───
    if (action === 'seed_reports') {
      if (!period_from || !period_to) {
        return new Response(JSON.stringify({ error: 'Missing period_from or period_to' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: celulas } = await supabase
        .from('celulas')
        .select('id')
        .eq('is_test_data', false);

      const weeks = getWeeksInPeriod(period_from, period_to);
      let totalCreated = 0;

      for (const celula of (celulas || [])) {
        for (const weekStart of weeks) {
          // Get a meeting date within the week (Mon-Sun)
          const weekDate = new Date(weekStart + 'T12:00:00Z');
          const meetingDayOffset = randInt(0, 5);
          const meetingDate = new Date(weekDate.getTime() + meetingDayOffset * 24 * 60 * 60 * 1000);

          const { error } = await supabase.from('weekly_reports').insert({
            celula_id: celula.id,
            week_start: weekStart,
            meeting_date: dateToString(meetingDate),
            members_present: randInt(4, 18),
            visitors: randInt(0, 6),
            children: randInt(0, 5),
            leaders_in_training: randInt(0, 4),
            discipleships: randInt(0, 7),
            notes: randItem(NOTES_POOL),
            is_test_data: true,
            seed_run_id,
          });

          if (!error) totalCreated++;
        }
      }

      const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
      const totals = existingRun?.totals || {};
      await supabase.from('seed_runs').update({
        totals: { ...totals, reports: totalCreated, period_from, period_to },
        status: 'done'
      }).eq('id', seed_run_id);

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_supervisoes ───
    if (action === 'seed_supervisoes') {
      if (!period_from || !period_to) {
        return new Response(JSON.stringify({ error: 'Missing period_from or period_to' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: supervisores } = await supabase
        .from('supervisores')
        .select('id, coordenacao_id');

      const { data: allCelulas } = await supabase
        .from('celulas')
        .select('id, coordenacao_id')
        .eq('is_test_data', false);

      let totalCreated = 0;
      const fromDate = new Date(period_from + 'T12:00:00Z');
      const toDate = new Date(period_to + 'T12:00:00Z');
      const rangeDays = Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)));

      for (const sup of (supervisores || [])) {
        const myCelulas = (allCelulas || []).filter(c => c.coordenacao_id === sup.coordenacao_id);
        const selectedCelulas = myCelulas.sort(() => Math.random() - 0.5).slice(0, 2);

        for (const celula of selectedCelulas) {
          const dayOffset = randInt(0, rangeDays);
          const supDate = new Date(fromDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
          const startH = randInt(18, 20);
          const endH = startH + 1;

          const { error } = await supabase.from('supervisoes').insert({
            supervisor_id: sup.id,
            celula_id: celula.id,
            data_supervisao: dateToString(supDate),
            horario_inicio: `${String(startH).padStart(2,'0')}:00`,
            horario_termino: `${String(endH).padStart(2,'0')}:00`,
            celula_realizada: Math.random() > 0.15,
            louvor: Math.random() > 0.3,
            licao: Math.random() > 0.3,
            oracao_inicial: Math.random() > 0.2,
            oracao_final: Math.random() > 0.2,
            pontualidade: Math.random() > 0.4,
            pontos_positivos: randItem(['Boa dinâmica de grupo', 'Excelente liderança', 'Acolhimento caloroso', 'Oração fervorosa']),
            pontos_alinhar: randItem(['Melhorar pontualidade', 'Mais atividades práticas', 'Envolver mais membros novos', null]),
            is_test_data: true,
            seed_run_id,
          });

          if (!error) totalCreated++;
        }
      }

      const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
      const totals = existingRun?.totals || {};
      await supabase.from('seed_runs').update({
        totals: { ...totals, supervisoes: totalCreated },
        status: 'done'
      }).eq('id', seed_run_id);

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_multiplicacoes ───
    if (action === 'seed_multiplicacoes') {
      if (!period_from || !period_to) {
        return new Response(JSON.stringify({ error: 'Missing period_from or period_to' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, coordenacao_id, supervisor_id')
        .eq('is_test_data', false);

      if (!celulas || celulas.length < 2) {
        return new Response(JSON.stringify({ success: true, created: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check existing destinies to avoid unique constraint violations
      const { data: existingMults } = await supabase
        .from('multiplicacoes')
        .select('celula_destino_id');
      const usedDestinos = new Set((existingMults || []).map(m => m.celula_destino_id));

      const numOrigens = Math.max(1, Math.floor(celulas.length * 0.2));
      const origens = [...celulas].sort(() => Math.random() - 0.5).slice(0, numOrigens);
      
      const fromDate = new Date(period_from + 'T12:00:00Z');
      const toDate = new Date(period_to + 'T12:00:00Z');
      const rangeDays = Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)));
      
      let totalCreated = 0;

      for (const origem of origens) {
        // Create a new test celula as destino
        const { data: newCelula, error: celulaErr } = await supabase
          .from('celulas')
          .insert({
            name: `[Seed] Célula Nova ${Math.floor(Math.random() * 9000 + 1000)}`,
            coordenacao_id: origem.coordenacao_id,
            supervisor_id: origem.supervisor_id,
            is_test_data: true,
            seed_run_id,
          })
          .select('id')
          .single();

        if (celulaErr || !newCelula) continue;
        if (usedDestinos.has(newCelula.id)) continue;

        const dayOffset = randInt(0, rangeDays);
        const multDate = new Date(fromDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

        const { error: multErr } = await supabase.from('multiplicacoes').insert({
          celula_origem_id: origem.id,
          celula_destino_id: newCelula.id,
          data_multiplicacao: dateToString(multDate),
          notes: `Multiplicação gerada via seed run ${seed_run_id.slice(0, 8)}`,
          is_test_data: true,
          seed_run_id,
        });

        if (!multErr) {
          totalCreated++;
          usedDestinos.add(newCelula.id);
        }
      }

      const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
      const totals = existingRun?.totals || {};
      await supabase.from('seed_runs').update({
        totals: { ...totals, multiplicacoes: totalCreated },
        status: 'done'
      }).eq('id', seed_run_id);

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: cleanup ───
    if (action === 'cleanup') {
      const { data: cleanSeedRun } = body;
      const targetId = cleanSeedRun || seed_run_id;

      // Delete in FK-safe order
      await supabase.from('weekly_reports').delete().eq('seed_run_id', targetId).eq('is_test_data', true);
      await supabase.from('supervisoes').delete().eq('seed_run_id', targetId).eq('is_test_data', true);
      await supabase.from('multiplicacoes').delete().eq('seed_run_id', targetId).eq('is_test_data', true);
      
      // Get test member ids to delete profiles too
      const { data: testMembers } = await supabase
        .from('members')
        .select('id, profile_id')
        .eq('seed_run_id', targetId)
        .eq('is_test_data', true);
      
      await supabase.from('members').delete().eq('seed_run_id', targetId).eq('is_test_data', true);
      
      // Delete test celulas (destinos created in multiplicacoes)
      await supabase.from('celulas').delete().eq('seed_run_id', targetId).eq('is_test_data', true);
      
      // Delete test profiles
      if (testMembers && testMembers.length > 0) {
        const profileIds = testMembers.map(m => m.profile_id);
        await supabase.from('profiles').delete().in('id', profileIds).eq('is_test_data', true);
      }
      
      // Also delete any profiles directly tagged
      await supabase.from('profiles').delete().eq('seed_run_id', targetId).eq('is_test_data', true);

      // Mark seed run as cleaned
      await supabase.from('seed_runs').update({
        status: 'done',
        cleaned_at: new Date().toISOString(),
        notes: `Limpo em ${new Date().toLocaleString('pt-BR')}`,
      }).eq('id', targetId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('seed-data error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
