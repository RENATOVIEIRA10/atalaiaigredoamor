import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  action?: "overview" | "set_message_status";
  campo_id?: string | null;
  access_key_id?: string;
  message_id?: string;
  status?: string;
  note?: string;
};

type SupabaseClient = ReturnType<typeof createClient>;

const GLOBAL_SCOPES = new Set(["admin", "pastor_senior_global"]);

type AuthorizedScope = {
  isGlobal: boolean;
  campoId: string | null;
  scopeType: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchBotStatus() {
  const baseUrl = Deno.env.get("AGENTE_CELULAS_BASE_URL");
  if (!baseUrl) {
    return { configured: false, ok: false, status: "config_missing" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    const payload = await res.json().catch(() => ({}));
    return { configured: true, ok: res.ok, http_status: res.status, ...payload };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      status: "unreachable",
      error: error instanceof Error ? error.message : "unknown_error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getAuthorizedScope(
  supabase: SupabaseClient,
  userId: string,
  accessKeyId?: string,
  requestedCampoId?: string | null,
): Promise<{ scope?: AuthorizedScope; error?: Response }> {
  if (!accessKeyId) {
    return { error: json({ error: "access_key_id e obrigatorio" }, 400) };
  }

  const { data: link, error } = await supabase
    .from("user_access_links")
    .select("access_key_id, scope_type, campo_id, active")
    .eq("user_id", userId)
    .eq("access_key_id", accessKeyId)
    .eq("active", true)
    .maybeSingle();

  if (error) return { error: json({ error: error.message }, 500) };
  if (!link) return { error: json({ error: "Funcao ativa nao autorizada para este usuario" }, 403) };

  const isGlobal = GLOBAL_SCOPES.has(String(link.scope_type)) && !link.campo_id;
  if (isGlobal) {
    return {
      scope: {
        isGlobal: true,
        campoId: requestedCampoId || null,
        scopeType: String(link.scope_type),
      },
    };
  }

  if (!link.campo_id) {
    return { error: json({ error: "Funcao ativa sem campo_id nao pode acessar a operacao WhatsApp" }, 403) };
  }

  if (requestedCampoId && requestedCampoId !== link.campo_id) {
    return { error: json({ error: "campo_id fora do escopo autorizado" }, 403) };
  }

  return {
    scope: {
      isGlobal: false,
      campoId: link.campo_id,
      scopeType: String(link.scope_type),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (authError || !authData.user) {
    return json({ error: "Nao autenticado" }, 401);
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { scope, error: scopeError } = await getAuthorizedScope(
    supabase,
    authData.user.id,
    body.access_key_id,
    body.campo_id ?? null,
  );
  if (scopeError) return scopeError;
  if (!scope) return json({ error: "Escopo nao autorizado" }, 403);

  if (body.action === "set_message_status") {
    if (!body.message_id || !body.status) {
      return json({ error: "message_id e status sao obrigatorios" }, 400);
    }

    let updateQuery = supabase
      .from("whatsapp_messages")
      .update({
        status: body.status,
        metadata: body.note ? { reviewed_note: body.note, reviewed_by: authData.user.id } : undefined,
      })
      .eq("id", body.message_id);
    if (!scope.isGlobal) updateQuery = updateQuery.eq("campo_id", scope.campoId);

    const { data, error } = await updateQuery.select("*").single();

    if (error) return json({ error: error.message }, 500);
    return json({ message: data });
  }

  const campoId = scope.campoId;
  const bot = await fetchBotStatus();

  let messagesQuery = supabase
    .from("whatsapp_messages")
    .select("id, created_at, updated_at, phone, remote_jid, direction, classification, confidence, status, message_text, extracted_payload, error_message, campo_id, celula_id, weekly_report_id")
    .order("created_at", { ascending: false })
    .limit(80);
  if (campoId) messagesQuery = messagesQuery.eq("campo_id", campoId);

  let eventsQuery = supabase
    .from("whatsapp_events")
    .select("id, created_at, event_type, severity, title, description, phone, campo_id, celula_id, message_id, weekly_report_id, payload")
    .order("created_at", { ascending: false })
    .limit(80);
  if (campoId) eventsQuery = eventsQuery.eq("campo_id", campoId);

  const [{ data: messages, error: messagesError }, { data: events, error: eventsError }] =
    await Promise.all([messagesQuery, eventsQuery]);

  if (messagesError) return json({ error: messagesError.message }, 500);
  if (eventsError) return json({ error: eventsError.message }, 500);

  const pending = (messages || []).filter((m) =>
    ["received", "pending", "pending_confirmation", "failed"].includes(String(m.status))
  );

  return json({
    bot,
    metrics: {
      messages_total: messages?.length || 0,
      pending_total: pending.length,
      failed_total: (messages || []).filter((m) => m.status === "failed").length,
      reports_total: (messages || []).filter((m) => m.classification === "report").length,
      events_total: events?.length || 0,
    },
    messages: messages || [],
    events: events || [],
  });
});
