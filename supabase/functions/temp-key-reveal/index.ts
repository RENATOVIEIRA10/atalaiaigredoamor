import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TEMP_PASSWORD = "atalaia-key-2026-temp-renato";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body */ }

  if (body.password !== TEMP_PASSWORD) {
    return new Response(JSON.stringify({ error: "Senha incorreta" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    aviso: "Copie agora. Esta funcao sera deletada em seguida.",
  }), { status: 200, headers: corsHeaders });
});
