import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "overview"
  | "set_message_status"
  | "bot_qr"
  | "bot_reconnect"
  | "send_message"
  | "message_detail";

type Body = {
  action?: Action;
  campo_id?: string | null;
  access_key_id?: string;
  message_id?: string;
  status?: string;
  note?: string;
  phone?: string;
  text?: string;
  celula_id?: string | null;
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

function agentBase(): string | null {
  const baseUrl = Deno.env.get("AGENTE_CELULAS_BASE_URL");
  if (!baseUrl) return null;
  return baseUrl.replace(/\/$/, "");
}

async function agentFetch(path: string, init: RequestInit = {}, timeoutMs = 6000) {
  const base = agentBase();
  if (!base) return { ok: false, status: 0, body: { error: "config_missing" } };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : "unknown_error" },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBotStatus() {
  const base = agentBase();
  if (!base) return { configured: false, ok: false, status: "config_missing" };
  const { ok, status, body } = await agentFetch("/health", {}, 4500);
  return { configured: true, ok, http_status: status, ...(body as Record<string, unknown>) };
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
    return { scope: { isGlobal: true, campoId: requestedCampoId || null, scopeType: String(link.scope_type) } };
  }

  if (!link.campo_id) {
    return { error: json({ error: "Funcao ativa sem campo_id nao pode acessar a operacao WhatsApp" }, 403) };
  }

  if (requestedCampoId && requestedCampoId !== link.campo_id) {
    return { error: json({ error: "campo_id fora do escopo autorizado" }, 403) };
  }

  return { scope: { isGlobal: false, campoId: link.campo_id, scopeType: String(link.scope_type) } };
}

async function logEvent(
  supabase: SupabaseClient,
  row: {
    event_type: string;
    severity: "info" | "warning" | "critical";
    title: string;
    description?: string | null;
    phone?: string | null;
    campo_id?: string | null;
    celula_id?: string | null;
    message_id?: string | null;
    weekly_report_id?: string | null;
    payload?: Record<string, unknown> | null;
  },
) {
  await supabase.from("whatsapp_events").insert(row);
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

  const action: Action = body.action || "overview";

  // ---- BOT QR ----
  if (action === "bot_qr") {
    const res = await agentFetch("/qr", {}, 6000);
    return json({ ok: res.ok, qr: (res.body as any)?.qr ?? null, raw: res.body });
  }

  // ---- BOT RECONNECT ----
  if (action === "bot_reconnect") {
    const res = await agentFetch("/reconnect", { method: "POST", body: JSON.stringify({}) }, 8000);
    await logEvent(supabase, {
      event_type: "bot_reconnect_requested",
      severity: "warning",
      title: "Reconexao do bot solicitada",
      description: `Solicitada por usuario ${authData.user.id}. Resultado: ${res.ok ? "ok" : "falhou"}.`,
      campo_id: scope.campoId,
      payload: { result: res.body, http_status: res.status },
    });
    return json({ ok: res.ok, result: res.body });
  }

  // ---- SEND MESSAGE ----
  if (action === "send_message") {
    const phone = (body.phone || "").replace(/\D/g, "");
    const text = (body.text || "").trim();
    if (phone.length < 10 || phone.length > 15) return json({ error: "Telefone invalido" }, 400);
    if (text.length < 1 || text.length > 4000) return json({ error: "Texto invalido (1-4000 chars)" }, 400);

    const res = await agentFetch("/send", {
      method: "POST",
      body: JSON.stringify({ phone, text }),
    }, 10000);

    const { data: inserted, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        source: "atalaia-panel",
        channel: "whatsapp",
        direction: "outbound",
        phone,
        message_text: text,
        classification: "manual",
        status: res.ok ? "sent" : "failed",
        error_message: res.ok ? null : JSON.stringify(res.body),
        campo_id: scope.campoId,
        celula_id: body.celula_id ?? null,
        metadata: { sent_by: authData.user.id, agent_response: res.body },
      })
      .select("*")
      .single();

    if (insertError) return json({ error: insertError.message }, 500);

    await logEvent(supabase, {
      event_type: res.ok ? "manual_send_ok" : "manual_send_failed",
      severity: res.ok ? "info" : "warning",
      title: res.ok ? "Mensagem enviada manualmente" : "Falha ao enviar mensagem manual",
      description: `Para ${phone} (${text.length} chars).`,
      phone,
      campo_id: scope.campoId,
      celula_id: body.celula_id ?? null,
      message_id: inserted?.id ?? null,
      payload: { agent_response: res.body },
    });

    return json({ ok: res.ok, message: inserted, agent: res.body });
  }

  // ---- MESSAGE DETAIL ----
  if (action === "message_detail") {
    if (!body.message_id) return json({ error: "message_id obrigatorio" }, 400);
    let q = supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("id", body.message_id);
    if (!scope.isGlobal) q = q.eq("campo_id", scope.campoId);
    const { data: msg, error } = await q.maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!msg) return json({ error: "Mensagem nao encontrada" }, 404);

    let celula = null;
    if (msg.celula_id) {
      const { data } = await supabase
        .from("celulas")
        .select("id, nome, dia_semana, horario, endereco, leader_id")
        .eq("id", msg.celula_id)
        .maybeSingle();
      celula = data;
    }

    let weeklyReport = null;
    if (msg.weekly_report_id) {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("id", msg.weekly_report_id)
        .maybeSingle();
      weeklyReport = data;
    }

    const phoneFilter = msg.phone || msg.remote_jid;
    let history: unknown[] = [];
    if (phoneFilter) {
      let hq = supabase
        .from("whatsapp_messages")
        .select("id, created_at, direction, classification, status, message_text")
        .order("created_at", { ascending: false })
        .limit(20);
      if (msg.phone) hq = hq.eq("phone", msg.phone);
      else hq = hq.eq("remote_jid", msg.remote_jid!);
      if (!scope.isGlobal) hq = hq.eq("campo_id", scope.campoId);
      const { data } = await hq;
      history = data || [];
    }

    let events: unknown[] = [];
    const { data: ev } = await supabase
      .from("whatsapp_events")
      .select("id, created_at, event_type, severity, title, description, payload")
      .eq("message_id", body.message_id)
      .order("created_at", { ascending: false })
      .limit(20);
    events = ev || [];

    return json({ message: msg, celula, weekly_report: weeklyReport, history, events });
  }

  // ---- SET MESSAGE STATUS ----
  if (action === "set_message_status") {
    if (!body.message_id || !body.status) {
      return json({ error: "message_id e status sao obrigatorios" }, 400);
    }
    if (!body.note || body.note.trim().length < 3) {
      return json({ error: "Nota obrigatoria (min 3 chars)" }, 400);
    }

    let updateQuery = supabase
      .from("whatsapp_messages")
      .update({
        status: body.status,
        metadata: { reviewed_note: body.note, reviewed_by: authData.user.id, reviewed_at: new Date().toISOString() },
      })
      .eq("id", body.message_id);
    if (!scope.isGlobal) updateQuery = updateQuery.eq("campo_id", scope.campoId);

    const { data, error } = await updateQuery.select("*").single();
    if (error) return json({ error: error.message }, 500);

    await logEvent(supabase, {
      event_type: `status_${body.status}`,
      severity: body.status === "failed" || body.status === "discarded" ? "warning" : "info",
      title: `Mensagem marcada como ${body.status}`,
      description: body.note,
      phone: data?.phone ?? null,
      campo_id: scope.campoId,
      celula_id: data?.celula_id ?? null,
      message_id: body.message_id,
      weekly_report_id: data?.weekly_report_id ?? null,
      payload: { reviewer: authData.user.id },
    });

    return json({ message: data });
  }

  // ---- OVERVIEW (default) ----
  const campoId = scope.campoId;
  const bot = await fetchBotStatus();

  let messagesQuery = supabase
    .from("whatsapp_messages")
    .select("id, created_at, updated_at, phone, remote_jid, direction, classification, confidence, status, message_text, extracted_payload, error_message, campo_id, celula_id, weekly_report_id")
    .order("created_at", { ascending: false })
    .limit(200);
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
