import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// All demo modules in execution order
const DEMO_MODULES = [
  { action: 'seed_hierarchy', label: 'Hierarquia' },
  { action: 'seed_members', label: 'Membros' },
  { action: 'seed_reports', label: 'Relatórios' },
  { action: 'seed_supervisoes', label: 'Supervisões' },
  { action: 'seed_multiplicacoes', label: 'Multiplicações' },
  { action: 'seed_novas_vidas', label: 'Novas Vidas' },
  { action: 'seed_encaminhamentos', label: 'Encaminhamentos' },
  { action: 'seed_discipulado', label: 'Discipulado' },
  { action: 'seed_roteiro', label: 'Roteiro' },
  { action: 'seed_batismo', label: 'Batismo' },
  { action: 'seed_aniversarios', label: 'Aniversários' },
];

function makeCorrelationId(): string {
  return crypto.randomUUID().slice(0, 12);
}

function errorResponse(status: number, error_code: string, message: string, details: string | null, correlation_id: string) {
  return new Response(JSON.stringify({
    ok: false, error_code, message, details, correlation_id,
  }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function callSeedData(action: string, seedRunId: string): Promise<any> {
  const url = `${SUPABASE_URL}/functions/v1/seed-data`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ action, seed_run_id: seedRunId }),
  });
  const body = await resp.text();
  if (!resp.ok) {
    let parsed: any;
    try { parsed = JSON.parse(body); } catch { parsed = { message: body }; }
    throw new Error(parsed.message || parsed.error || `seed-data ${action} failed (${resp.status}): ${body.slice(0, 200)}`);
  }
  try { return JSON.parse(body); } catch { return {}; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const cid = makeCorrelationId();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action } = body;

    // ─── Validate action ───
    if (!action || !['generate', 'reset'].includes(action)) {
      return errorResponse(400, 'INVALID_ACTION', `Ação inválida: ${action}. Use "generate" ou "reset".`, null, cid);
    }

    // ─── ACTION: generate ───
    if (action === 'generate') {
      const { campus_ids, months_back } = body;

      // Payload validation
      if (!campus_ids || (Array.isArray(campus_ids) && campus_ids.length === 0)) {
        return errorResponse(400, 'MISSING_CAMPUS_IDS', 'campus_ids é obrigatório. Selecione ao menos um campus.', null, cid);
      }
      if (months_back !== undefined && (typeof months_back !== 'number' || months_back < 1)) {
        return errorResponse(400, 'INVALID_MONTHS_BACK', 'months_back deve ser um número >= 1.', `Valor recebido: ${months_back}`, cid);
      }

      const period = months_back === 1 ? '1m' : months_back === 2 ? '2m' : '3m';
      const config = {
        campos: campus_ids,
        redes: [],
        period,
        modules: DEMO_MODULES.map(m => m.action.replace('seed_', '')),
        advanced: {
          volumeNovasVidas: 60,
          taxaConversao: 60,
          membrosPerCelula: 7,
          distribuicaoIdade: { '18-25': 25, '26-35': 30, '36-45': 25, '46-60': 15, '60+': 5 },
          bairros: [],
          tipoCelula: ['mista', 'casais', 'jovens'],
        },
      };

      // Create the seed_run job
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const { data: job, error: jobErr } = await supabase.from('seed_runs').insert({
        name: `Demo ${timestamp}`,
        environment: 'dev',
        status: 'queued',
        config,
        notes: 'Dataset demo gerado automaticamente',
      }).select('id').single();

      if (jobErr || !job) {
        console.error(`[${cid}] Job creation failed:`, jobErr);
        return errorResponse(500, 'JOB_CREATION_FAILED', `Falha ao criar job: ${jobErr?.message || 'unknown'}`, jobErr?.details || null, cid);
      }

      const seedRunId = job.id;
      console.log(`[${cid}] Demo seed run created: ${seedRunId}`);

      // Update to running
      await supabase.from('seed_runs').update({ status: 'running' }).eq('id', seedRunId);

      // Execute each module sequentially
      const results: Record<string, any> = {};
      let failedModule: string | null = null;

      for (const mod of DEMO_MODULES) {
        try {
          console.log(`[${cid}]   Demo → ${mod.label}...`);
          const result = await callSeedData(mod.action, seedRunId);
          results[mod.action] = { status: 'done', created: result?.created ?? 0 };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[${cid}]   Demo → ${mod.label} FAILED: ${msg}`);
          results[mod.action] = { status: 'failed', error: msg };
          failedModule = mod.label;
          break;
        }
      }

      // Update final status
      const finalStatus = failedModule ? 'failed' : 'done';
      const notes = failedModule
        ? `Falhou no módulo "${failedModule}"`
        : `Demo completo — ${DEMO_MODULES.length} módulos executados`;

      await supabase.from('seed_runs').update({
        status: finalStatus,
        notes,
      }).eq('id', seedRunId);

      return new Response(JSON.stringify({
        ok: !failedModule,
        success: !failedModule,
        seed_run_id: seedRunId,
        status: finalStatus,
        modules: results,
        correlation_id: cid,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── ACTION: reset ───
    if (action === 'reset') {
      const { old_seed_run_id, campus_ids, months_back } = body;

      // Clean old run if provided
      if (old_seed_run_id) {
        console.log(`[${cid}] Cleaning old demo run: ${old_seed_run_id}`);
        try {
          await callSeedData('cleanup', old_seed_run_id);
        } catch (e) {
          console.error(`[${cid}] Cleanup failed (continuing):`, e);
        }
      }

      // Generate new demo by calling ourselves
      const generateResp = await fetch(`${SUPABASE_URL}/functions/v1/seed-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ action: 'generate', campus_ids: campus_ids || ['ALL'], months_back: months_back || 3 }),
      });

      const resultBody = await generateResp.text();
      let result: any;
      try { result = JSON.parse(resultBody); } catch { result = { ok: false, error_code: 'PARSE_ERROR', message: resultBody.slice(0, 200) }; }
      
      return new Response(JSON.stringify({ ...result, correlation_id: cid }), {
        status: generateResp.ok ? 200 : generateResp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return errorResponse(400, 'UNKNOWN_ACTION', `Ação desconhecida: ${action}`, null, cid);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${cid}] seed-demo error:`, msg);
    return errorResponse(500, 'INTERNAL_ERROR', msg, null, cid);
  }
});
