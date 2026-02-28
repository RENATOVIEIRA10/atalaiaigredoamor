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

const BAIRROS_OLINDA = ['Rio Doce','Jardim Atlântico','Casa Caiada','Bairro Novo','Peixinhos','Ouro Preto','Fragoso','Salgadinho','Amparo','Carmo'];
const BAIRROS_PAULISTA = ['Maranguape I','Maranguape II','Janga','Pau Amarelo','Jardim Paulista','Centro de Paulista','Mirueira','Arthur Lundgren I','Arthur Lundgren II','Nobre','Vila Torres Galvão','Timbó'];
const BAIRROS_ABREU_LIMA = ['Centro','Caetés I','Caetés II','Caetés III','Desterro','Timbó','Planalto'];
const ALL_BAIRROS = [
  ...BAIRROS_OLINDA.map(b => ({ bairro: b, cidade: 'Olinda' })),
  ...BAIRROS_PAULISTA.map(b => ({ bairro: b, cidade: 'Paulista' })),
  ...BAIRROS_ABREU_LIMA.map(b => ({ bairro: b, cidade: 'Abreu e Lima' })),
];

const RUAS_OLINDA = ['Rua São Bento','Rua do Sol','Av. Presidente Kennedy','Rua Saldanha Marinho','Rua do Amparo','Trav. da Misericórdia','Rua Bernardo Vieira de Melo','Rua 13 de Maio','Rua Sigismundo Gonçalves','Av. Pan Nordestina'];
const RUAS_PAULISTA = ['Av. Marechal Floriano Peixoto','Rua Aurora','Rua Manoel Borba','Av. João Paulo II','Rua Dr. Cláudio José Gueiros Leite','Rua Alfredo Lisboa','Rua Pará','Rua Ceará','Rua da Matriz','Av. Brasil'];
const RUAS_ABREU_LIMA = ['Av. Belmino Correia','Rua do Comércio','Rua da Paz','Rua São José','Av. Presidente Médici','Rua Esperança','Rua Nova'];

function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateName(): string { return `${randItem(PT_FIRST_NAMES)} ${randItem(PT_LAST_NAMES)}`; }

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

function generateWhatsApp(): string {
  const num = String(randInt(10000000, 99999999));
  return `(81) 9${num.slice(0,4)}-${num.slice(4)}`;
}

function generateAddress(cidade: string): { rua: string; numero: string } {
  const ruas = cidade === 'Olinda' ? RUAS_OLINDA : cidade === 'Abreu e Lima' ? RUAS_ABREU_LIMA : RUAS_PAULISTA;
  return { rua: randItem(ruas), numero: String(randInt(10, 2500)) };
}

function getBairrosForCidade(cidade: string) {
  if (cidade === 'Olinda') return BAIRROS_OLINDA;
  if (cidade === 'Abreu e Lima') return BAIRROS_ABREU_LIMA;
  return BAIRROS_PAULISTA;
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

const MARCOS = ['encontro_com_deus', 'batismo', 'encontro_de_casais', 'curso_lidere', 'renovo'];
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)'];
const FAIXAS_ETARIAS = ['18-25', '26-35', '36-45', '46-60', '60+'];

const VIZINHOS: Record<string, string[]> = {
  'Rio Doce': ['Jardim Atlântico', 'Casa Caiada'],
  'Jardim Atlântico': ['Rio Doce', 'Casa Caiada', 'Bairro Novo'],
  'Casa Caiada': ['Rio Doce', 'Jardim Atlântico', 'Bairro Novo'],
  'Bairro Novo': ['Jardim Atlântico', 'Casa Caiada', 'Ouro Preto'],
  'Peixinhos': ['Ouro Preto', 'Bairro Novo'],
  'Ouro Preto': ['Peixinhos', 'Bairro Novo', 'Fragoso'],
  'Fragoso': ['Ouro Preto', 'Salgadinho'],
  'Salgadinho': ['Fragoso', 'Amparo'],
  'Amparo': ['Salgadinho', 'Carmo'],
  'Carmo': ['Amparo', 'Salgadinho'],
  'Maranguape I': ['Maranguape II', 'Janga'],
  'Maranguape II': ['Maranguape I', 'Janga', 'Pau Amarelo'],
  'Janga': ['Maranguape I', 'Maranguape II', 'Pau Amarelo'],
  'Pau Amarelo': ['Janga', 'Maranguape II', 'Jardim Paulista'],
  'Jardim Paulista': ['Pau Amarelo', 'Centro de Paulista'],
  'Centro de Paulista': ['Jardim Paulista', 'Pau Amarelo', 'Mirueira'],
  'Mirueira': ['Centro de Paulista', 'Arthur Lundgren I'],
  'Arthur Lundgren I': ['Mirueira', 'Arthur Lundgren II'],
  'Arthur Lundgren II': ['Arthur Lundgren I', 'Nobre'],
  'Nobre': ['Arthur Lundgren II', 'Vila Torres Galvão'],
  'Vila Torres Galvão': ['Nobre', 'Timbó'],
  'Timbó': ['Vila Torres Galvão', 'Nobre'],
  'Centro': ['Caetés I', 'Desterro'],
  'Caetés I': ['Centro', 'Caetés II'],
  'Caetés II': ['Caetés I', 'Caetés III'],
  'Caetés III': ['Caetés II', 'Planalto'],
  'Desterro': ['Centro', 'Planalto'],
  'Planalto': ['Desterro', 'Caetés III'],
};

const MEETING_DAYS = ['Segunda', 'Terça', 'Quinta', 'Sexta', 'Sábado'];
const MEETING_TIMES = ['19:00', '19:30', '20:00', '20:30'];

const COORD_NAMES_POOL = ['Fogo', 'Raio', 'Trovão', 'Centelha', 'Faísca', 'Turbo', 'Nitro', 'Sprint', 'Boost', 'Flash', 'Ascensão', 'Elevação', 'Topo', 'Cume', 'Zênite'];
const CELULA_PREFIXES_POOL = ['Impacto', 'Explosão', 'Chama', 'Vigor', 'Potência', 'Brilho', 'Coragem', 'Ousadia', 'Conquista', 'Vitória', 'Avanço', 'Força', 'Fé Viva', 'Radical', 'Intenso', 'Propósito', 'Missão', 'Meta', 'Alvo', 'Foco'];

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ─── Totals helper: merges into existing totals ───
async function updateTotals(supabase: any, seed_run_id: string, newTotals: Record<string, unknown>, status?: string) {
  const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
  const totals = (existingRun?.totals as Record<string, unknown>) || {};
  const update: any = { totals: { ...totals, ...newTotals } };
  if (status) update.status = status;
  await supabase.from('seed_runs').update(update).eq('id', seed_run_id);
}

// ─── Per-campus summary helper ───
async function updateCampusSummary(supabase: any, seed_run_id: string, campoId: string, campoNome: string, moduleName: string, count: number) {
  const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
  const totals = (existingRun?.totals as Record<string, any>) || {};
  const perCampus = totals.per_campus || {};
  const campusEntry = perCampus[campoId] || { nome: campoNome };
  campusEntry[moduleName] = (campusEntry[moduleName] || 0) + count;
  perCampus[campoId] = campusEntry;
  totals.per_campus = perCampus;
  await supabase.from('seed_runs').update({ totals }).eq('id', seed_run_id);
}

// ─── Resolve campus_ids from job config ───
interface JobConfig {
  campos: string[];   // explicit IDs or ["ALL"]
  redes: string[];
  period: string;
  modules: string[];
  advanced: {
    volumeNovasVidas: number;
    taxaConversao: number;
    membrosPerCelula: number;
    distribuicaoIdade: Record<string, number>;
    bairros: string[];
    tipoCelula: string[];
  };
}

async function resolveJobCampusIds(supabase: any, config: JobConfig): Promise<{ id: string; nome: string; cidade: string | null }[]> {
  if (!config.campos || config.campos.length === 0) {
    throw new Error('campus_ids é obrigatório. Selecione ao menos um campus.');
  }

  if (config.campos.length === 1 && config.campos[0] === 'ALL') {
    const { data, error } = await supabase.from('campos').select('id, nome, cidade').eq('ativo', true).order('nome');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Nenhum campus ativo encontrado.');
    return data;
  }

  const { data, error } = await supabase.from('campos').select('id, nome, cidade').in('id', config.campos).eq('ativo', true);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Nenhum campus válido encontrado para os IDs fornecidos.');
  return data;
}

function getPeriodDates(period: string): { from: string; to: string } {
  const today = new Date();
  const months: Record<string, number> = { '1m': 1, '2m': 2, '3m': 3, 'bimestre': 2, 'trimestre': 3 };
  const m = months[period] || 3;
  const from = new Date(today);
  from.setMonth(from.getMonth() - m);
  return { from: dateToString(from), to: dateToString(today) };
}

// ===========================
// MAIN HANDLER
// ===========================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, seed_run_id } = body;

    if (!action || !seed_run_id) {
      return new Response(JSON.stringify({ error: 'Missing action or seed_run_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Load job config from seed_runs table ───
    const { data: jobRow, error: jobErr } = await supabase.from('seed_runs').select('*').eq('id', seed_run_id).single();
    if (jobErr || !jobRow) {
      return new Response(JSON.stringify({ error: `Job não encontrado: ${seed_run_id}` }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const config: JobConfig = jobRow.config || {};
    if (!config.advanced) config.advanced = { volumeNovasVidas: 80, taxaConversao: 60, membrosPerCelula: 7, distribuicaoIdade: {}, bairros: [], tipoCelula: ['mista'] };
    if (!config.modules) config.modules = [];
    if (!config.campos) config.campos = [];

    const membersPerCelula = config.advanced.membrosPerCelula ?? 7;
    const volumeNovasVidas = config.advanced.volumeNovasVidas ?? 80;

    // Mark as running
    await supabase.from('seed_runs').update({ status: 'running' }).eq('id', seed_run_id);

    console.log(`Seed Run ${seed_run_id} → action: ${action}, campus_ids: ${JSON.stringify(config.campos)}`);

    // ─── CLEANUP ───
    if (action === 'cleanup') {
      const targetId = seed_run_id;
      // Delete in FK-safe order
      await supabase.from('event_registrations').delete().eq('campo_id', targetId); // won't match, but safe
      await supabase.from('encaminhamentos_recomeco').delete().eq('encaminhado_por', 'Seed Run');
      await supabase.from('discipulado_encontros').delete().eq('seed_run_id', targetId);
      await supabase.from('roteiros_celula').delete().eq('seed_run_id', targetId);
      await supabase.from('weekly_reports').delete().eq('seed_run_id', targetId);
      await supabase.from('supervisoes').delete().eq('seed_run_id', targetId);
      await supabase.from('multiplicacoes').delete().eq('seed_run_id', targetId);

      const { data: testMembers } = await supabase
        .from('members').select('id, profile_id')
        .eq('seed_run_id', targetId);

      await supabase.from('members').delete().eq('seed_run_id', targetId);
      await supabase.from('celulas').delete().eq('seed_run_id', targetId);
      await supabase.from('supervisores').delete().eq('seed_run_id', targetId);
      await supabase.from('coordenacoes').delete().eq('seed_run_id', targetId);
      await supabase.from('redes').delete().eq('seed_run_id', targetId);

      // Delete test profiles
      if (testMembers && testMembers.length > 0) {
        const profileIds = testMembers.map((m: any) => m.profile_id);
        for (const batch of chunk(profileIds, 100)) {
          await supabase.from('profiles').delete().in('id', batch).eq('is_test_data', true);
        }
      }
      await supabase.from('profiles').delete().eq('seed_run_id', targetId);

      // Delete novas_vidas seeded
      await supabase.from('novas_vidas').delete().eq('seed_run_id', targetId);

      // Delete access keys from test redes
      const { data: testRedes } = await supabase.from('redes').select('id').eq('seed_run_id', targetId);
      if (testRedes) {
        for (const r of testRedes) {
          await supabase.from('access_keys').delete().eq('rede_id', r.id);
        }
      }

      await supabase.from('seed_runs').update({
        status: 'done',
        cleaned_at: new Date().toISOString(),
        notes: `Limpo em ${new Date().toLocaleString('pt-BR')}`,
      }).eq('id', targetId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Resolve campus list (GUARDRAIL: fail if empty) ───
    let campusList: { id: string; nome: string; cidade: string | null }[];
    try {
      campusList = await resolveJobCampusIds(supabase, config);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from('seed_runs').update({ status: 'failed', notes: msg }).eq('id', seed_run_id);
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Seed Run ${seed_run_id} → Executando em ${campusList.length} campus: ${campusList.map(c => c.nome).join(', ')}`);

    const period = getPeriodDates(config.period || '3m');

    // ─── ACTION: seed_hierarchy ───
    if (action === 'seed_hierarchy') {
      const REDE_NAMES = ['Impulse', 'Acelere', 'UP'];
      const COORDS_PER_REDE = 4;
      const SUPERVISORS_PER_COORD = 2;
      const CELLS_PER_COORD = 12;

      let grandTotal = 0;

      for (const campus of campusList) {
        console.log(`  Executando campus ${campus.nome} (${campus.id})`);
        let totalRedes = 0, totalCoords = 0, totalSupervisors = 0, totalCells = 0, totalAccessKeys = 0;

        // Filter redes to create: if config.redes has values, only create those names
        const redesToCreate = config.redes?.length
          ? REDE_NAMES.filter((_n, i) => config.redes.includes(REDE_NAMES[i]) || config.redes.length === 0)
          : REDE_NAMES;

        for (const redeName of (redesToCreate.length > 0 ? redesToCreate : REDE_NAMES)) {
          const slug = `${redeName.toLowerCase().replace(/\s+/g, '-')}-${campus.id.slice(0,8)}`;
          const { data: newRede, error: redeErr } = await supabase.from('redes')
            .insert({ name: `${redeName} (${campus.nome})`, slug, ativa: true, is_test_data: true, seed_run_id, campo_id: campus.id })
            .select('id').single();
          if (redeErr) { console.error('rede insert error:', redeErr); continue; }
          const redeId = newRede.id;
          totalRedes++;

          // Create rede leader couple
          const rLeader1UserId = crypto.randomUUID();
          const rLeader2UserId = crypto.randomUUID();
          const { data: rProfiles } = await supabase.from('profiles').insert([
            { user_id: rLeader1UserId, name: generateName(), is_test_data: true, seed_run_id },
            { user_id: rLeader2UserId, name: generateName(), is_test_data: true, seed_run_id },
          ]).select('id');

          if (rProfiles && rProfiles.length === 2) {
            const { data: rCouple } = await supabase.from('leadership_couples')
              .insert({ spouse1_id: rProfiles[0].id, spouse2_id: rProfiles[1].id })
              .select('id').single();
            if (rCouple) {
              await supabase.from('redes').update({ leadership_couple_id: rCouple.id, leader_id: rProfiles[0].id }).eq('id', redeId);
              await supabase.from('access_keys').insert({
                code: `${slug}_rede_${randInt(1000,9999)}`,
                scope_type: 'rede', scope_id: redeId, rede_id: redeId, campo_id: campus.id, active: true,
              });
              totalAccessKeys++;
            }
          }

          let cellIdx = 0;
          const campusBairros = ALL_BAIRROS.filter(b => !campus.cidade || b.cidade === campus.cidade);
          const bairrosToUse = campusBairros.length > 0 ? campusBairros : ALL_BAIRROS;

          for (let ci = 0; ci < COORDS_PER_REDE; ci++) {
            const coordName = `Coord. ${COORD_NAMES_POOL[(totalCoords + ci) % COORD_NAMES_POOL.length]}`;

            const cL1 = crypto.randomUUID();
            const cL2 = crypto.randomUUID();
            const { data: cProfiles } = await supabase.from('profiles').insert([
              { user_id: cL1, name: generateName(), is_test_data: true, seed_run_id },
              { user_id: cL2, name: generateName(), is_test_data: true, seed_run_id },
            ]).select('id');

            let coordLeadershipCoupleId = null;
            let coordLeaderId = null;
            if (cProfiles && cProfiles.length === 2) {
              const { data: cCouple } = await supabase.from('leadership_couples')
                .insert({ spouse1_id: cProfiles[0].id, spouse2_id: cProfiles[1].id })
                .select('id').single();
              if (cCouple) { coordLeadershipCoupleId = cCouple.id; coordLeaderId = cProfiles[0].id; }
            }

            const { data: newCoord, error: coordErr } = await supabase.from('coordenacoes')
              .insert({
                name: coordName, rede_id: redeId,
                leadership_couple_id: coordLeadershipCoupleId,
                leader_id: coordLeaderId,
                is_test_data: true, seed_run_id, campo_id: campus.id,
              })
              .select('id').single();
            if (coordErr || !newCoord) { console.error('coord error:', coordErr); continue; }
            totalCoords++;

            await supabase.from('access_keys').insert({
              code: `${slug}_coord${ci+1}_${randInt(1000,9999)}`,
              scope_type: 'coordenacao', scope_id: newCoord.id, rede_id: redeId, campo_id: campus.id, active: true,
            });
            totalAccessKeys++;

            // Create supervisors
            const supervisorIds: string[] = [];
            for (let si = 0; si < SUPERVISORS_PER_COORD; si++) {
              const sL1 = crypto.randomUUID();
              const sL2 = crypto.randomUUID();
              const { data: sProfiles } = await supabase.from('profiles').insert([
                { user_id: sL1, name: generateName(), is_test_data: true, seed_run_id },
                { user_id: sL2, name: generateName(), is_test_data: true, seed_run_id },
              ]).select('id');

              let supCoupleId = null;
              const supProfileId = sProfiles?.[0]?.id;
              if (sProfiles && sProfiles.length === 2) {
                const { data: sCouple } = await supabase.from('leadership_couples')
                  .insert({ spouse1_id: sProfiles[0].id, spouse2_id: sProfiles[1].id })
                  .select('id').single();
                if (sCouple) supCoupleId = sCouple.id;
              }

              if (supProfileId) {
                const { data: newSup } = await supabase.from('supervisores')
                  .insert({
                    profile_id: supProfileId, coordenacao_id: newCoord.id, rede_id: redeId,
                    leadership_couple_id: supCoupleId,
                    is_test_data: true, seed_run_id, campo_id: campus.id,
                  })
                  .select('id').single();
                if (newSup) {
                  supervisorIds.push(newSup.id);
                  totalSupervisors++;
                  await supabase.from('access_keys').insert({
                    code: `${slug}_sup${ci+1}${si+1}_${randInt(1000,9999)}`,
                    scope_type: 'supervisor', scope_id: newSup.id, rede_id: redeId, campo_id: campus.id, active: true,
                  });
                  totalAccessKeys++;
                }
              }
            }

            // Create cells
            for (let ki = 0; ki < CELLS_PER_COORD; ki++) {
              const loc = bairrosToUse[(cellIdx + ki) % bairrosToUse.length];
              const addr = generateAddress(loc.cidade);
              const prefix = CELULA_PREFIXES_POOL[cellIdx % CELULA_PREFIXES_POOL.length];
              const cellName = `${prefix} ${loc.bairro.split(' ')[0]}`;
              const supervisorId = supervisorIds.length > 0 ? supervisorIds[ki % supervisorIds.length] : null;

              const clL1 = crypto.randomUUID();
              const clL2 = crypto.randomUUID();
              const { data: clProfiles } = await supabase.from('profiles').insert([
                { user_id: clL1, name: generateName(), is_test_data: true, seed_run_id },
                { user_id: clL2, name: generateName(), is_test_data: true, seed_run_id },
              ]).select('id');

              let cellCoupleId = null;
              let cellLeaderId = null;
              if (clProfiles && clProfiles.length === 2) {
                const { data: clCouple } = await supabase.from('leadership_couples')
                  .insert({ spouse1_id: clProfiles[0].id, spouse2_id: clProfiles[1].id })
                  .select('id').single();
                if (clCouple) { cellCoupleId = clCouple.id; cellLeaderId = clProfiles[0].id; }
              }

              const { data: newCell } = await supabase.from('celulas')
                .insert({
                  name: cellName,
                  coordenacao_id: newCoord.id, rede_id: redeId,
                  supervisor_id: supervisorId,
                  leadership_couple_id: cellCoupleId, leader_id: cellLeaderId,
                  bairro: loc.bairro, cidade: loc.cidade,
                  address: `${addr.rua}, ${addr.numero} - ${loc.bairro}`,
                  meeting_day: randItem(MEETING_DAYS),
                  meeting_time: randItem(MEETING_TIMES),
                  is_test_data: true, seed_run_id, campo_id: campus.id,
                })
                .select('id').single();

              if (newCell) {
                totalCells++;
                await supabase.from('access_keys').insert({
                  code: `${slug}_cel${totalCells}_${randInt(1000,9999)}`,
                  scope_type: 'celula', scope_id: newCell.id, rede_id: redeId, campo_id: campus.id, active: true,
                });
                totalAccessKeys++;
              }
              cellIdx++;
            }
          }
        }

        grandTotal += totalCells;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'hierarchy_redes', totalRedes);
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'hierarchy_coordenacoes', totalCoords);
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'hierarchy_celulas', totalCells);
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'hierarchy_supervisores', totalSupervisors);
      }

      await updateTotals(supabase, seed_run_id, { hierarchy_total: grandTotal });

      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_members ───
    if (action === 'seed_members') {
      let grandTotal = 0;

      for (const campus of campusList) {
        console.log(`  seed_members → campus ${campus.nome}`);
        const { data: celulas, error: celulasErr } = await supabase
          .from('celulas').select('id, coordenacao_id, bairro, cidade, rede_id, campo_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        if (celulasErr || !celulas || celulas.length === 0) continue;

        const campusBairros = ALL_BAIRROS.filter(b => !campus.cidade || b.cidade === campus.cidade);
        const bairrosToUse = campusBairros.length > 0 ? campusBairros : ALL_BAIRROS;

        const profilesToInsert: any[] = [];
        const membersMeta: { celulaId: string; redeId: string | null; campoId: string; joinedAt: string; whatsapp: string }[] = [];

        for (const celula of celulas) {
          // Assign bairro if missing
          if (!celula.bairro || !celula.cidade) {
            const loc = randItem(bairrosToUse);
            await supabase.from('celulas').update({ bairro: loc.bairro, cidade: loc.cidade }).eq('id', celula.id);
            celula.bairro = loc.bairro;
            celula.cidade = loc.cidade;
          }

          for (let i = 0; i < membersPerCelula; i++) {
            const userId = crypto.randomUUID();
            const joinedAt = generateJoinedChurchAt();
            profilesToInsert.push({
              user_id: userId,
              name: generateName(),
              birth_date: generateBirthDate(18, 65),
              joined_church_at: joinedAt,
              email: `test_${userId.slice(0, 8)}@seed.local`,
              is_test_data: true,
              seed_run_id,
            });
            membersMeta.push({ celulaId: celula.id, redeId: celula.rede_id, campoId: campus.id, joinedAt, whatsapp: generateWhatsApp() });
          }
        }

        let campusCreated = 0;
        const profileBatches = chunk(profilesToInsert, 50);
        const memberBatches: object[] = [];

        for (let b = 0; b < profileBatches.length; b++) {
          const batch = profileBatches[b];
          const { data: insertedProfiles, error: profileErr } = await supabase
            .from('profiles').insert(batch).select('id');
          if (profileErr || !insertedProfiles) continue;

          const metaBatch = membersMeta.slice(b * 50, b * 50 + insertedProfiles.length);
          for (let i = 0; i < insertedProfiles.length; i++) {
            const profile = insertedProfiles[i];
            const meta = metaBatch[i];
            const numMarcos = randInt(2, MARCOS.length);
            const selectedMarcos = [...MARCOS].sort(() => Math.random() - 0.5).slice(0, numMarcos);
            const marcosObj: Record<string, boolean> = {};
            for (const m of selectedMarcos) marcosObj[m] = true;

            memberBatches.push({
              profile_id: profile.id,
              celula_id: meta.celulaId,
              rede_id: meta.redeId || null,
              campo_id: meta.campoId,
              joined_at: meta.joinedAt,
              whatsapp: meta.whatsapp,
              is_active: true,
              is_test_data: true,
              seed_run_id,
              is_lider_em_treinamento: Math.random() > 0.85,
              is_discipulado: Math.random() > 0.7,
              ...marcosObj,
            });
            campusCreated++;
          }
        }

        for (const batch of chunk(memberBatches, 50)) {
          await supabase.from('members').insert(batch);
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'members', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { members: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_reports ───
    if (action === 'seed_reports') {
      let grandTotal = 0;
      const weeks = getWeeksInPeriod(period.from, period.to);

      for (const campus of campusList) {
        console.log(`  seed_reports → campus ${campus.nome}`);
        const { data: celulas } = await supabase
          .from('celulas').select('id, rede_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        const reportsToInsert: any[] = [];
        for (const celula of (celulas || [])) {
          for (const weekStart of weeks) {
            const weekDate = new Date(weekStart + 'T12:00:00Z');
            const meetingDayOffset = randInt(0, 5);
            const meetingDate = new Date(weekDate.getTime() + meetingDayOffset * 24 * 60 * 60 * 1000);
            const derivedWeekStart = dateToString(getMonday(meetingDate));

            reportsToInsert.push({
              celula_id: celula.id,
              rede_id: celula.rede_id || null,
              campo_id: campus.id,
              week_start: derivedWeekStart,
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
          }
        }

        let campusCreated = 0;
        for (const batch of chunk(reportsToInsert, 100)) {
          const { error } = await supabase.from('weekly_reports').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'reports', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { reports: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_supervisoes ───
    if (action === 'seed_supervisoes') {
      let grandTotal = 0;
      const fromDate = new Date(period.from + 'T12:00:00Z');
      const toDate = new Date(period.to + 'T12:00:00Z');
      const rangeDays = Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)));

      for (const campus of campusList) {
        console.log(`  seed_supervisoes → campus ${campus.nome}`);
        const { data: supervisores } = await supabase
          .from('supervisores').select('id, coordenacao_id, rede_id, campo_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        const { data: allCelulas } = await supabase
          .from('celulas').select('id, coordenacao_id, rede_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        const supervisoesToInsert: any[] = [];
        for (const sup of (supervisores || [])) {
          const myCelulas = (allCelulas || []).filter(c => c.coordenacao_id === sup.coordenacao_id);
          const selectedCelulas = myCelulas.sort(() => Math.random() - 0.5).slice(0, Math.min(3, myCelulas.length));

          for (const celula of selectedCelulas) {
            const dayOffset = randInt(0, rangeDays);
            const supDate = new Date(fromDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
            const startH = randInt(18, 20);

            supervisoesToInsert.push({
              supervisor_id: sup.id,
              celula_id: celula.id,
              rede_id: sup.rede_id || celula.rede_id || null,
              campo_id: campus.id,
              data_supervisao: dateToString(supDate),
              horario_inicio: `${String(startH).padStart(2,'0')}:00`,
              horario_termino: `${String(startH + 1).padStart(2,'0')}:00`,
              celula_realizada: Math.random() > 0.15,
              louvor: Math.random() > 0.3,
              licao: Math.random() > 0.3,
              oracao_inicial: Math.random() > 0.2,
              oracao_final: Math.random() > 0.2,
              quebra_gelo: Math.random() > 0.3,
              pontualidade: Math.random() > 0.4,
              comunhao: Math.random() > 0.3,
              dinamica: Math.random() > 0.5,
              avisos: Math.random() > 0.3,
              selfie: Math.random() > 0.4,
              cadeira_amor: Math.random() > 0.5,
              apresentacao_visitantes: Math.random() > 0.4,
              momento_visao_triade: Math.random() > 0.5,
              organizacao: Math.random() > 0.3,
              interatividade: Math.random() > 0.4,
              pontos_positivos: randItem(['Boa dinâmica de grupo', 'Excelente liderança', 'Acolhimento caloroso', 'Oração fervorosa', 'Louvor vibrante']),
              pontos_alinhar: randItem(['Melhorar pontualidade', 'Mais atividades práticas', 'Envolver mais membros novos', 'Intensificar discipulado', null]),
              is_test_data: true,
              seed_run_id,
            });
          }
        }

        let campusCreated = 0;
        for (const batch of chunk(supervisoesToInsert, 50)) {
          const { error } = await supabase.from('supervisoes').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'supervisoes', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { supervisoes: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_multiplicacoes ───
    if (action === 'seed_multiplicacoes') {
      let grandTotal = 0;
      const fromDate = new Date(period.from + 'T12:00:00Z');
      const toDate = new Date(period.to + 'T12:00:00Z');
      const rangeDays = Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)));

      const { data: existingMults } = await supabase.from('multiplicacoes').select('celula_destino_id');
      const usedDestinos = new Set((existingMults || []).map((m: any) => m.celula_destino_id));

      for (const campus of campusList) {
        console.log(`  seed_multiplicacoes → campus ${campus.nome}`);
        const { data: celulas } = await supabase
          .from('celulas').select('id, coordenacao_id, supervisor_id, rede_id, bairro, cidade')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        if (!celulas || celulas.length < 2) continue;

        const numOrigens = Math.max(1, Math.floor(celulas.length * 0.15));
        const origens = [...celulas].sort(() => Math.random() - 0.5).slice(0, numOrigens);

        const campusBairros = ALL_BAIRROS.filter(b => !campus.cidade || b.cidade === campus.cidade);
        const bairrosToUse = campusBairros.length > 0 ? campusBairros : ALL_BAIRROS;

        const newCelulasData = origens.map(origem => {
          const loc = randItem(bairrosToUse);
          return {
            name: `[Seed] Célula Nova ${Math.floor(Math.random() * 9000 + 1000)}`,
            coordenacao_id: origem.coordenacao_id,
            supervisor_id: origem.supervisor_id,
            rede_id: origem.rede_id,
            campo_id: campus.id,
            bairro: loc.bairro,
            cidade: loc.cidade,
            is_test_data: true,
            seed_run_id,
          };
        });

        const { data: newCelulas, error: celulaErr } = await supabase.from('celulas').insert(newCelulasData).select('id');
        if (celulaErr || !newCelulas) continue;

        const multsToInsert = [];
        for (let i = 0; i < origens.length; i++) {
          const newCelula = newCelulas[i];
          if (!newCelula || usedDestinos.has(newCelula.id)) continue;

          const dayOffset = randInt(0, rangeDays);
          const multDate = new Date(fromDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

          multsToInsert.push({
            celula_origem_id: origens[i].id,
            celula_destino_id: newCelula.id,
            rede_id: origens[i].rede_id || null,
            campo_id: campus.id,
            data_multiplicacao: dateToString(multDate),
            notes: `Multiplicação gerada via seed run ${seed_run_id.slice(0, 8)}`,
            is_test_data: true,
            seed_run_id,
          });
          usedDestinos.add(newCelula.id);
        }

        let campusCreated = 0;
        if (multsToInsert.length > 0) {
          const { error: multErr } = await supabase.from('multiplicacoes').insert(multsToInsert);
          if (!multErr) campusCreated = multsToInsert.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'multiplicacoes', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { multiplicacoes: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_novas_vidas ───
    if (action === 'seed_novas_vidas') {
      let grandTotal = 0;
      const vidasPerCampus = Math.ceil(volumeNovasVidas / campusList.length);

      for (const campus of campusList) {
        console.log(`  seed_novas_vidas → campus ${campus.nome}`);
        const campusBairros = ALL_BAIRROS.filter(b => !campus.cidade || b.cidade === campus.cidade);
        const bairrosToUse = campusBairros.length > 0 ? campusBairros : ALL_BAIRROS;

        const novasVidas = [];
        for (let i = 0; i < vidasPerCampus; i++) {
          const loc = randItem(bairrosToUse);
          novasVidas.push({
            nome: generateName(),
            whatsapp: generateWhatsApp(),
            bairro: loc.bairro,
            cidade: loc.cidade,
            campo_id: campus.id,
            estado_civil: randItem(ESTADOS_CIVIS),
            faixa_etaria: randItem(FAIXAS_ETARIAS),
            seed_run_id,
            observacao: randItem([
              'Veio pelo evento de evangelização',
              'Indicado por um membro',
              'Procurou a igreja espontaneamente',
              'Participou do Recomeço',
              'Vizinho de um membro da célula',
              null,
            ]),
            status: 'nova',
          });
        }

        let campusCreated = 0;
        for (const batch of chunk(novasVidas, 50)) {
          const { error } = await supabase.from('novas_vidas').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'novas_vidas', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { novas_vidas: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_encaminhamentos ───
    if (action === 'seed_encaminhamentos') {
      let grandTotal = 0;

      for (const campus of campusList) {
        console.log(`  seed_encaminhamentos → campus ${campus.nome}`);
        const { data: novasVidas } = await supabase
          .from('novas_vidas').select('id, bairro, cidade')
          .eq('campo_id', campus.id)
          .eq('status', 'nova');

        if (!novasVidas || novasVidas.length === 0) continue;

        const { data: celulas } = await supabase
          .from('celulas').select('id, bairro, cidade, rede_id')
          .eq('campo_id', campus.id);

        if (!celulas || celulas.length === 0) continue;

        const encaminhamentos: any[] = [];
        const statusOptions = ['pendente', 'pendente', 'contatado', 'contatado', 'integrado'];

        for (const nv of novasVidas) {
          let targetCelula = null;
          const sameBairro = celulas.filter(c => c.bairro === nv.bairro);
          if (sameBairro.length > 0) targetCelula = randItem(sameBairro);

          if (!targetCelula && nv.bairro) {
            const neighbors = VIZINHOS[nv.bairro] || [];
            const neighborCelulas = celulas.filter(c => neighbors.includes(c.bairro || ''));
            if (neighborCelulas.length > 0) targetCelula = randItem(neighborCelulas);
          }
          if (!targetCelula) {
            const sameCity = celulas.filter(c => c.cidade === nv.cidade);
            if (sameCity.length > 0) targetCelula = randItem(sameCity);
          }
          if (!targetCelula) targetCelula = randItem(celulas);

          const status = randItem(statusOptions);
          const now = new Date();
          const daysAgo = randInt(1, 30);
          const encDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

          encaminhamentos.push({
            nova_vida_id: nv.id,
            celula_id: targetCelula.id,
            rede_id: targetCelula.rede_id || null,
            campo_id: campus.id,
            status,
            encaminhado_por: 'Seed Run',
            notas: status === 'integrado' ? 'Já participou de 3+ reuniões' : status === 'contatado' ? 'Líder entrou em contato via WhatsApp' : null,
            contatado_at: status !== 'pendente' ? encDate.toISOString() : null,
            integrado_at: status === 'integrado' ? new Date(encDate.getTime() + randInt(3, 14) * 24 * 60 * 60 * 1000).toISOString() : null,
          });
        }

        let campusCreated = 0;
        for (const batch of chunk(encaminhamentos, 50)) {
          const { error } = await supabase.from('encaminhamentos_recomeco').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        const encaminhadasIds = encaminhamentos.map(e => e.nova_vida_id);
        for (const batch of chunk(encaminhadasIds, 100)) {
          await supabase.from('novas_vidas').update({ status: 'encaminhada' }).in('id', batch);
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'encaminhamentos', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { encaminhamentos: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_discipulado ───
    if (action === 'seed_discipulado') {
      let grandTotal = 0;
      const fromDate = new Date(period.from + 'T12:00:00Z');
      const toDate = new Date(period.to + 'T12:00:00Z');
      const monthsDiff = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

      for (const campus of campusList) {
        console.log(`  seed_discipulado → campus ${campus.nome}`);
        const { data: celulas } = await supabase
          .from('celulas').select('id, coordenacao_id, rede_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        const encontrosToInsert: any[] = [];
        for (const cel of (celulas || [])) {
          for (let m = 0; m < monthsDiff; m++) {
            const encontroDate = new Date(fromDate.getTime() + (m * 30 + randInt(5, 25)) * 24 * 60 * 60 * 1000);
            if (encontroDate > toDate) break;
            encontrosToInsert.push({
              celula_id: cel.id,
              coordenacao_id: cel.coordenacao_id,
              rede_id: cel.rede_id,
              campo_id: campus.id,
              nivel: 'celula',
              data_encontro: dateToString(encontroDate),
              realizado: Math.random() > 0.15,
              observacao: randItem(['Encontro produtivo', 'Boa participação', 'Tema sobre santidade', 'Oração intensa', null]),
            });
          }
        }

        let campusCreated = 0;
        for (const batch of chunk(encontrosToInsert, 50)) {
          const { error } = await supabase.from('discipulado_encontros').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'discipulado', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { discipulado: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_roteiro ───
    if (action === 'seed_roteiro') {
      let grandTotal = 0;
      const weeks = getWeeksInPeriod(period.from, period.to);

      for (const campus of campusList) {
        console.log(`  seed_roteiro → campus ${campus.nome}`);
        const { data: celulas } = await supabase
          .from('celulas').select('id, rede_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        const roteirosToInsert: any[] = [];
        for (const cel of (celulas || [])) {
          for (const weekStart of weeks.slice(0, 4)) {
            const meetingDate = new Date(new Date(weekStart + 'T12:00:00Z').getTime() + randInt(1, 5) * 24 * 60 * 60 * 1000);
            roteirosToInsert.push({
              celula_id: cel.id,
              rede_id: cel.rede_id,
              campo_id: campus.id,
              seed_run_id,
              semana_inicio: weekStart,
              data_reuniao: dateToString(meetingDate),
              status: randItem(['rascunho', 'finalizado', 'finalizado']),
            });
          }
        }

        let campusCreated = 0;
        for (const batch of chunk(roteirosToInsert, 50)) {
          const { error } = await supabase.from('roteiros_celula').insert(batch);
          if (!error) campusCreated += batch.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'roteiros', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { roteiros: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_batismo ───
    if (action === 'seed_batismo') {
      let grandTotal = 0;

      for (const campus of campusList) {
        console.log(`  seed_batismo → campus ${campus.nome}`);
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + randInt(7, 60));

        const { data: event, error: evErr } = await supabase.from('events_spiritual').insert({
          title: `Batismo ${campus.nome} ${dateToString(eventDate)}`,
          type: 'batismo',
          event_date: dateToString(eventDate),
          is_active: true,
          campo_id: campus.id,
        }).select('id').single();
        if (evErr || !event) continue;

        const { data: members } = await supabase
          .from('members').select('id, profile_id, celula_id, rede_id, campo_id')
          .eq('campo_id', campus.id)
          .eq('is_active', true)
          .limit(20);

        const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', (members || []).map(m => m.profile_id));
        const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

        const registrations = (members || []).slice(0, randInt(5, 15)).map(m => ({
          event_id: event.id,
          full_name: profileMap.get(m.profile_id) || 'Membro',
          person_type: 'membro',
          membro_id: m.id,
          celula_id: m.celula_id,
          rede_id: m.rede_id,
          campo_id: campus.id,
          status: 'inscrito',
        }));

        let campusCreated = 0;
        if (registrations.length > 0) {
          const { error } = await supabase.from('event_registrations').insert(registrations);
          if (!error) campusCreated = registrations.length;
        }

        grandTotal += campusCreated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'batismo', campusCreated);
      }

      await updateTotals(supabase, seed_run_id, { batismo_registrations: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_aniversarios ───
    if (action === 'seed_aniversarios') {
      let grandTotal = 0;

      for (const campus of campusList) {
        console.log(`  seed_aniversarios → campus ${campus.nome}`);
        const { data: members } = await supabase
          .from('members').select('profile_id')
          .eq('campo_id', campus.id)
          .or(`is_test_data.is.null,is_test_data.eq.false,seed_run_id.eq.${seed_run_id}`);

        let campusUpdated = 0;
        for (const batch of chunk((members || []), 50)) {
          for (const m of batch) {
            const birthDate = generateBirthDate(18, 65);
            await supabase.from('profiles').update({ birth_date: birthDate }).eq('id', m.profile_id);
            campusUpdated++;
          }
        }

        grandTotal += campusUpdated;
        await updateCampusSummary(supabase, seed_run_id, campus.id, campus.nome, 'aniversarios', campusUpdated);
      }

      await updateTotals(supabase, seed_run_id, { aniversarios_updated: grandTotal });
      return new Response(JSON.stringify({ success: true, created: grandTotal }), {
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
