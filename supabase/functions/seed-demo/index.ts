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
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`seed-data ${action} failed: ${text}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action } = body;

    // ─── ACTION: generate ───
    // Creates a demo seed run job and executes all modules
    if (action === 'generate') {
      const { campus_ids, months_back } = body;

      if (!campus_ids || (Array.isArray(campus_ids) && campus_ids.length === 0)) {
        return new Response(JSON.stringify({ error: 'campus_ids é obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
        return new Response(JSON.stringify({ error: `Falha ao criar job: ${jobErr?.message}` }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const seedRunId = job.id;
      console.log(`Demo seed run created: ${seedRunId}`);

      // Update to running
      await supabase.from('seed_runs').update({ status: 'running' }).eq('id', seedRunId);

      // Execute each module sequentially
      const results: Record<string, any> = {};
      let failedModule: string | null = null;

      for (const mod of DEMO_MODULES) {
        try {
          console.log(`  Demo → ${mod.label}...`);
          const result = await callSeedData(mod.action, seedRunId);
          results[mod.action] = { status: 'done', created: result?.created ?? 0 };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`  Demo → ${mod.label} FAILED: ${msg}`);
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
        success: !failedModule,
        seed_run_id: seedRunId,
        status: finalStatus,
        modules: results,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── ACTION: reset ───
    // Cleans old demo run and generates a new one
    if (action === 'reset') {
      const { old_seed_run_id, campus_ids, months_back } = body;

      // Clean old run if provided
      if (old_seed_run_id) {
        console.log(`Cleaning old demo run: ${old_seed_run_id}`);
        try {
          await callSeedData('cleanup', old_seed_run_id);
        } catch (e) {
          console.error('Cleanup failed (continuing):', e);
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

      const result = await generateResp.json();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('seed-demo error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
