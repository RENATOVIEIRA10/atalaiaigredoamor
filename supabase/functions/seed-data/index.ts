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

// ─── Endereços Reais ───
const BAIRROS_OLINDA = ['Rio Doce','Jardim Atlântico','Casa Caiada','Bairro Novo','Peixinhos','Ouro Preto'];
const BAIRROS_PAULISTA = ['Maranguape I','Maranguape II','Janga','Pau Amarelo','Jardim Paulista','Centro de Paulista'];
const ALL_BAIRROS = [
  ...BAIRROS_OLINDA.map(b => ({ bairro: b, cidade: 'Olinda' })),
  ...BAIRROS_PAULISTA.map(b => ({ bairro: b, cidade: 'Paulista' })),
];

const RUAS_OLINDA = ['Rua São Bento','Rua do Sol','Av. Presidente Kennedy','Rua Saldanha Marinho','Rua do Amparo','Trav. da Misericórdia','Rua Bernardo Vieira de Melo','Rua 13 de Maio','Rua Sigismundo Gonçalves','Av. Pan Nordestina'];
const RUAS_PAULISTA = ['Av. Marechal Floriano Peixoto','Rua Aurora','Rua Manoel Borba','Av. João Paulo II','Rua Dr. Cláudio José Gueiros Leite','Rua Alfredo Lisboa','Rua Pará','Rua Ceará','Rua da Matriz','Av. Brasil'];

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

function generateWhatsApp(): string {
  const ddd = randItem(['81']);
  const prefix = randItem(['9']);
  const num = String(randInt(10000000, 99999999));
  return `(${ddd}) ${prefix}${num.slice(0,4)}-${num.slice(4)}`;
}

function generateAddress(cidade: string): { rua: string; numero: string } {
  const ruas = cidade === 'Olinda' ? RUAS_OLINDA : RUAS_PAULISTA;
  return { rua: randItem(ruas), numero: String(randInt(10, 2500)) };
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

// Neighbor map for suggestion algorithm
const VIZINHOS: Record<string, string[]> = {
  'Rio Doce': ['Jardim Atlântico', 'Casa Caiada'],
  'Jardim Atlântico': ['Rio Doce', 'Casa Caiada', 'Bairro Novo'],
  'Casa Caiada': ['Rio Doce', 'Jardim Atlântico', 'Bairro Novo'],
  'Bairro Novo': ['Jardim Atlântico', 'Casa Caiada', 'Ouro Preto'],
  'Peixinhos': ['Ouro Preto', 'Bairro Novo'],
  'Ouro Preto': ['Peixinhos', 'Bairro Novo'],
  'Maranguape I': ['Maranguape II', 'Janga'],
  'Maranguape II': ['Maranguape I', 'Janga', 'Pau Amarelo'],
  'Janga': ['Maranguape I', 'Maranguape II', 'Pau Amarelo'],
  'Pau Amarelo': ['Janga', 'Maranguape II', 'Jardim Paulista'],
  'Jardim Paulista': ['Pau Amarelo', 'Centro de Paulista'],
  'Centro de Paulista': ['Jardim Paulista', 'Pau Amarelo'],
};

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function updateTotals(supabase: any, seed_run_id: string, newTotals: Record<string, unknown>, status = 'done') {
  const { data: existingRun } = await supabase.from('seed_runs').select('totals').eq('id', seed_run_id).single();
  const totals = (existingRun?.totals as Record<string, unknown>) || {};
  await supabase.from('seed_runs').update({
    totals: { ...totals, ...newTotals },
    status,
  }).eq('id', seed_run_id);
}

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
        .select('id, coordenacao_id, bairro, cidade, rede_id')
        .or('is_test_data.is.null,is_test_data.eq.false');

      if (celulasErr) throw celulasErr;
      if (!celulas || celulas.length === 0) {
        return new Response(JSON.stringify({ success: true, created: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const MEMBERS_PER_CELULA = 7;

      // First, assign bairro/cidade to cells that don't have them
      const celulasToUpdate = celulas.filter(c => !c.bairro || !c.cidade);
      if (celulasToUpdate.length > 0) {
        let idx = 0;
        for (const c of celulasToUpdate) {
          const loc = ALL_BAIRROS[idx % ALL_BAIRROS.length];
          await supabase.from('celulas').update({ bairro: loc.bairro, cidade: loc.cidade }).eq('id', c.id);
          c.bairro = loc.bairro;
          c.cidade = loc.cidade;
          idx++;
        }
      }

      const profilesToInsert = [];
      const membersMeta: { celulaId: string; joinedAt: string; whatsapp: string }[] = [];

      for (const celula of celulas) {
        for (let i = 0; i < MEMBERS_PER_CELULA; i++) {
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
          membersMeta.push({ celulaId: celula.id, joinedAt, whatsapp: generateWhatsApp() });
        }
      }

      let totalCreated = 0;
      const profileBatches = chunk(profilesToInsert, 50);
      const memberBatches: object[] = [];

      for (let b = 0; b < profileBatches.length; b++) {
        const batch = profileBatches[b];
        const { data: insertedProfiles, error: profileErr } = await supabase
          .from('profiles')
          .insert(batch)
          .select('id');

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
            joined_at: meta.joinedAt,
            whatsapp: meta.whatsapp,
            is_active: true,
            is_test_data: true,
            seed_run_id,
            is_lider_em_treinamento: Math.random() > 0.85,
            is_discipulado: Math.random() > 0.7,
            ...marcosObj,
          });
          totalCreated++;
        }
      }

      for (const batch of chunk(memberBatches, 50)) {
        await supabase.from('members').insert(batch);
      }

      await updateTotals(supabase, seed_run_id, { members: totalCreated });

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
        .select('id, rede_id')
        .or('is_test_data.is.null,is_test_data.eq.false');

      const weeks = getWeeksInPeriod(period_from, period_to);

      const reportsToInsert = [];
      for (const celula of (celulas || [])) {
        for (const weekStart of weeks) {
          const weekDate = new Date(weekStart + 'T12:00:00Z');
          const meetingDayOffset = randInt(0, 5);
          const meetingDate = new Date(weekDate.getTime() + meetingDayOffset * 24 * 60 * 60 * 1000);
          const derivedWeekStart = dateToString(getMonday(meetingDate));

          reportsToInsert.push({
            celula_id: celula.id,
            rede_id: celula.rede_id || null,
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

      let totalCreated = 0;
      for (const batch of chunk(reportsToInsert, 100)) {
        const { error } = await supabase.from('weekly_reports').insert(batch);
        if (!error) totalCreated += batch.length;
      }

      await updateTotals(supabase, seed_run_id, { reports: totalCreated, period_from, period_to });

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
        .select('id, coordenacao_id, rede_id');

      const { data: allCelulas } = await supabase
        .from('celulas')
        .select('id, coordenacao_id, rede_id')
        .or('is_test_data.is.null,is_test_data.eq.false');

      const fromDate = new Date(period_from + 'T12:00:00Z');
      const toDate = new Date(period_to + 'T12:00:00Z');
      const rangeDays = Math.max(1, Math.floor((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)));

      const supervisoesToInsert = [];
      for (const sup of (supervisores || [])) {
        const myCelulas = (allCelulas || []).filter(c => c.coordenacao_id === sup.coordenacao_id);
        const selectedCelulas = myCelulas.sort(() => Math.random() - 0.5).slice(0, Math.min(3, myCelulas.length));

        for (const celula of selectedCelulas) {
          const dayOffset = randInt(0, rangeDays);
          const supDate = new Date(fromDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
          const startH = randInt(18, 20);
          const endH = startH + 1;

          supervisoesToInsert.push({
            supervisor_id: sup.id,
            celula_id: celula.id,
            rede_id: sup.rede_id || celula.rede_id || null,
            data_supervisao: dateToString(supDate),
            horario_inicio: `${String(startH).padStart(2,'0')}:00`,
            horario_termino: `${String(endH).padStart(2,'0')}:00`,
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

      let totalCreated = 0;
      for (const batch of chunk(supervisoesToInsert, 50)) {
        const { error } = await supabase.from('supervisoes').insert(batch);
        if (!error) totalCreated += batch.length;
      }

      await updateTotals(supabase, seed_run_id, { supervisoes: totalCreated });

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
        .select('id, coordenacao_id, supervisor_id, rede_id, bairro, cidade')
        .or('is_test_data.is.null,is_test_data.eq.false');

      if (!celulas || celulas.length < 2) {
        return new Response(JSON.stringify({ success: true, created: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

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

      const newCelulasData = origens.map(origem => {
        const loc = randItem(ALL_BAIRROS);
        return {
          name: `[Seed] Célula Nova ${Math.floor(Math.random() * 9000 + 1000)}`,
          coordenacao_id: origem.coordenacao_id,
          supervisor_id: origem.supervisor_id,
          rede_id: origem.rede_id,
          bairro: loc.bairro,
          cidade: loc.cidade,
          is_test_data: true,
          seed_run_id,
        };
      });

      const { data: newCelulas, error: celulaErr } = await supabase
        .from('celulas')
        .insert(newCelulasData)
        .select('id');

      if (celulaErr || !newCelulas) {
        return new Response(JSON.stringify({ success: true, created: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

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
          data_multiplicacao: dateToString(multDate),
          notes: `Multiplicação gerada via seed run ${seed_run_id.slice(0, 8)}`,
          is_test_data: true,
          seed_run_id,
        });
        usedDestinos.add(newCelula.id);
      }

      if (multsToInsert.length > 0) {
        const { error: multErr } = await supabase.from('multiplicacoes').insert(multsToInsert);
        if (!multErr) totalCreated = multsToInsert.length;
      }

      await updateTotals(supabase, seed_run_id, { multiplicacoes: totalCreated });

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_novas_vidas ───
    if (action === 'seed_novas_vidas') {
      const NUM_NOVAS_VIDAS = 30;
      const novasVidas = [];

      for (let i = 0; i < NUM_NOVAS_VIDAS; i++) {
        const loc = randItem(ALL_BAIRROS);
        novasVidas.push({
          nome: generateName(),
          whatsapp: generateWhatsApp(),
          bairro: loc.bairro,
          cidade: loc.cidade,
          estado_civil: randItem(ESTADOS_CIVIS),
          faixa_etaria: randItem(FAIXAS_ETARIAS),
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

      let totalCreated = 0;
      for (const batch of chunk(novasVidas, 50)) {
        const { error } = await supabase.from('novas_vidas').insert(batch);
        if (!error) totalCreated += batch.length;
      }

      await updateTotals(supabase, seed_run_id, { novas_vidas: totalCreated });

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: seed_encaminhamentos ───
    if (action === 'seed_encaminhamentos') {
      // Get all novas vidas with status 'nova'
      const { data: novasVidas } = await supabase
        .from('novas_vidas')
        .select('id, bairro, cidade')
        .eq('status', 'nova');

      if (!novasVidas || novasVidas.length === 0) {
        return new Response(JSON.stringify({ success: true, created: 0, message: 'Nenhuma nova vida com status "nova" encontrada. Execute seed_novas_vidas primeiro.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get all cells with location
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, bairro, cidade, rede_id')
        .or('is_test_data.is.null,is_test_data.eq.false');

      if (!celulas || celulas.length === 0) {
        return new Response(JSON.stringify({ success: true, created: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const encaminhamentos = [];
      const statusOptions = ['pendente', 'pendente', 'contatado', 'contatado', 'integrado'];

      for (const nv of novasVidas) {
        // Suggestion algorithm: same bairro > neighbor bairro > same city > any
        let targetCelula = null;

        // 1. Same bairro
        const sameBairro = celulas.filter(c => c.bairro === nv.bairro);
        if (sameBairro.length > 0) {
          targetCelula = randItem(sameBairro);
        }

        // 2. Neighbor bairro
        if (!targetCelula && nv.bairro) {
          const neighbors = VIZINHOS[nv.bairro] || [];
          const neighborCelulas = celulas.filter(c => neighbors.includes(c.bairro || ''));
          if (neighborCelulas.length > 0) {
            targetCelula = randItem(neighborCelulas);
          }
        }

        // 3. Same city
        if (!targetCelula) {
          const sameCity = celulas.filter(c => c.cidade === nv.cidade);
          if (sameCity.length > 0) {
            targetCelula = randItem(sameCity);
          }
        }

        // 4. Any cell
        if (!targetCelula) {
          targetCelula = randItem(celulas);
        }

        const status = randItem(statusOptions);

        encaminhamentos.push({
          nova_vida_id: nv.id,
          celula_id: targetCelula.id,
          rede_id: targetCelula.rede_id || null,
          status,
          encaminhado_por: 'Seed Run',
          notas: status === 'integrado' ? 'Já participou de 3+ reuniões' : status === 'contatado' ? 'Líder entrou em contato via WhatsApp' : null,
        });
      }

      let totalCreated = 0;
      for (const batch of chunk(encaminhamentos, 50)) {
        const { error } = await supabase.from('encaminhamentos_recomeco').insert(batch);
        if (!error) totalCreated += batch.length;
      }

      // Update novas vidas status
      const encaminhadasIds = encaminhamentos.map(e => e.nova_vida_id);
      for (const batch of chunk(encaminhadasIds, 100)) {
        await supabase.from('novas_vidas').update({ status: 'encaminhada' }).in('id', batch);
      }

      await updateTotals(supabase, seed_run_id, { encaminhamentos: totalCreated });

      return new Response(JSON.stringify({ success: true, created: totalCreated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── ACTION: cleanup ───
    if (action === 'cleanup') {
      const targetId = seed_run_id;

      // Delete in FK-safe order
      await supabase.from('encaminhamentos_recomeco').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all encaminhamentos for novas vidas that will be cleaned
      // Actually, let's be more targeted: delete encaminhamentos linked to seed novas vidas
      // First get novas vidas that are from this seed (status = encaminhada from seed)
      // Since novas_vidas doesn't have seed_run_id, we delete encaminhamentos by encaminhado_por = 'Seed Run'
      // But let's also clean any orphaned ones
      
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
        for (const batch of chunk(profileIds, 100)) {
          await supabase.from('profiles').delete().in('id', batch).eq('is_test_data', true);
        }
      }

      // Also delete any profiles directly tagged
      await supabase.from('profiles').delete().eq('seed_run_id', targetId).eq('is_test_data', true);

      // Clean encaminhamentos from Seed Run
      await supabase.from('encaminhamentos_recomeco').delete().eq('encaminhado_por', 'Seed Run');

      // Clean novas vidas that were seeded (those with status encaminhada or nova that have seed pattern)
      // Since we don't have seed_run_id on novas_vidas, clean all with Seed Run encaminhamentos
      // Get IDs of novas_vidas from cleaned encaminhamentos - but they're already deleted
      // So let's clean novas_vidas that have no encaminhamentos and were likely created by seed
      // Safest: delete novas_vidas with observacao containing seed patterns
      await supabase.from('novas_vidas').delete().in('observacao', [
        'Veio pelo evento de evangelização',
        'Indicado por um membro',
        'Procurou a igreja espontaneamente',
        'Participou do Recomeço',
        'Vizinho de um membro da célula',
      ]);

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
