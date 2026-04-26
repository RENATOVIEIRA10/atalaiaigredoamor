// AUR.IOs HQ Bridge — proxy autenticado para o agentes-hub.
// Recebe evento do frontend (com JWT do usuário), valida e reenvia para
// a edge function ingest-event no projeto agentes-hub, adicionando o
// header x-bridge-secret server-side (nunca exposto ao browser).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HQ_INGEST_URL =
  'https://zwnlpumonvkrghoxnddd.supabase.co/functions/v1/ingest-event';
const STATION_SLUG = 'atalaia';

interface BridgePayload {
  event_type?: unknown;
  payload?: unknown;
  session_id?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // 1. Auth: exige JWT válido (assinado pelo Supabase do Atalaia)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 2. Bridge secret (runtime, server-side only)
    const bridgeSecret = Deno.env.get('AURIOS_HQ_BRIDGE_SECRET');
    if (!bridgeSecret) {
      console.error('[aurios-bridge-emit] AURIOS_HQ_BRIDGE_SECRET ausente');
      return new Response(
        JSON.stringify({ ok: false, error: 'Bridge not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 3. Body
    let body: BridgePayload;
    try {
      body = (await req.json()) as BridgePayload;
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid JSON' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (typeof body.event_type !== 'string' || body.event_type.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: 'event_type required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const payload =
      body.payload && typeof body.payload === 'object' ? body.payload : {};
    const sessionId =
      typeof body.session_id === 'string' && body.session_id.length > 0
        ? body.session_id
        : crypto.randomUUID();

    // 4. Forward ao agentes-hub com bridge secret
    const hqRes = await fetch(HQ_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': bridgeSecret,
      },
      body: JSON.stringify({
        station_slug: STATION_SLUG,
        event_type: body.event_type,
        session_id: sessionId,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!hqRes.ok) {
      const text = await hqRes.text().catch(() => '');
      console.warn(
        '[aurios-bridge-emit] HQ ingest failed',
        hqRes.status,
        text,
      );
      return new Response(
        JSON.stringify({ ok: false, error: 'HQ ingest failed', status: hqRes.status }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[aurios-bridge-emit] unexpected error', err);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
