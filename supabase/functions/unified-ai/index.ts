import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Mode = "concierge" | "chatbot" | "glossario" | "dashboard";

const isMode = (value: unknown): value is Mode =>
  value === "concierge" || value === "chatbot" || value === "glossario" || value === "dashboard";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const mode = body.mode;

    if (!isMode(mode)) {
      return new Response(JSON.stringify({ error: "Modo de IA inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = (body.context ?? {}) as Record<string, unknown>;
    const user = (body.user ?? {}) as Record<string, unknown>;
    const scope = (body.scope ?? {}) as Record<string, unknown>;
    const message = typeof body.message === "string" ? body.message.slice(0, 6000) : "";

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const messages = rawMessages
      .filter((m: unknown) => typeof m === "object" && m !== null)
      .map((m: any) => ({ role: m.role, content: String(m.content || "").slice(0, 6000) }))
      .filter((m: { role: string; content: string }) =>
        (m.role === "user" || m.role === "assistant") && m.content.trim().length > 0
      )
      .slice(-16);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const roleLabel = String(scope.roleLabel || scope.scopeType || "líder");
    const campus = String(scope.campusName || scope.campus || "Não definido");
    const redeName = scope.redeName ? String(scope.redeName) : null;
    const routeLabel = String(scope.route || "dashboard");
    const userName = String(user.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name || "líder");
    const isAutoGreeting = Boolean(context.isAutoGreeting);
    const metrics = context.metrics || {};
    const pendencias = Array.isArray(context.pendencias) ? context.pendencias : [];

    let systemPrompt = "";
    let userPrompt = message;

    if (mode === "chatbot" || mode === "concierge") {
      const metricsText = Object.keys(metrics).length > 0
        ? `\n\nMétricas atuais:\n${JSON.stringify(metrics, null, 2)}`
        : "";
      
      const pendenciasText = pendencias.length > 0
        ? `\n\nPendências detectadas: ${pendencias.join(", ")}`
        : "";

      systemPrompt = `Você é o Pastor Digital do Atalaia, inspirado no Pastor Arthur.
Tom: amoroso, acolhedor, paternal, espiritual e prático.

Regras Fundamentais:
- SEMPRE usar linguagem pastoral, NUNCA corporativa
- Evitar palavras: métrica, indicador, performance, KPI, dashboard
- Usar: ovelhas, vidas, cuidado, crescimento, caminhada, colheita
- Saudações: "Graça e paz", "Meu filho(a)", "Já disse que te amo hoje?"
- Tom de pai espiritual que caminha junto
- Máximo 3 parágrafos curtos
- Finalizar com 1 próximo passo prático e claro

Contexto do Usuário:
- Nome: ${userName}
- Papel: ${roleLabel}
- Campus: ${campus}${redeName ? `\n- Rede: ${redeName}` : ""}
- Tela: ${routeLabel}${metricsText}${pendenciasText}

${isAutoGreeting ? `
IMPORTANTE: Esta é uma saudação automática ao entrar no sistema.
- Seja caloroso e encorajador
- Mencione 1-2 pendências principais se houver
- Ofereça ajuda específica baseada no papel ministerial
- Use emojis pastorais com moderação (❤️, 🙏)
- Não seja repetitivo, varie as saudações

Exemplos de tom por papel:
- Pastor Global: Visão do Reino, múltiplos campos
- Pastor de Campo: Redes e líderes, crescimento do campus
- Líder de Rede: Coordenações e células, cuidado dos líderes
- Coordenador: Células e membros, multiplicação
- Líder de Célula: Pessoas, novas vidas, discipulado
` : ""}`;

      if (!userPrompt.trim() && messages.length > 0) {
        userPrompt = messages[messages.length - 1].content;
      }
    }

    if (mode === "glossario") {
      const glossary = JSON.stringify(context.glossary ?? []);
      const modules = JSON.stringify(context.modules ?? []);
      const scopes = JSON.stringify(context.scopes ?? {});

      systemPrompt = `Você é o Guia do Atalaia.
Responda com precisão, sem inventar funcionalidades.
Use apenas as referências fornecidas.
Se não encontrar, diga: "Não encontrei isso no sistema atual.".
Responda em português e com markdown simples.`;

      userPrompt = `Pergunta: ${message}\n\nGlossário: ${glossary}\n\nMódulos: ${modules}\n\nEscopos: ${scopes}`;
    }

    if (mode === "dashboard") {
      const insightType = String(context.insightType || "growth_analysis");
      const period = String(context.period || "período atual");
      const reportData = JSON.stringify(context.reportData ?? []);

      systemPrompt = `Você é um conselheiro pastoral de gestão ministerial.
Responda em português com linguagem pastoral e prática.
Estruture em markdown curto com: destaques, pontos de atenção e próximos passos.
Sem termos corporativos.`;

      userPrompt = `Tipo: ${insightType}\nPeríodo: ${period}\nDados: ${reportData}`;
    }

    if (!systemPrompt || !userPrompt.trim()) {
      return new Response(JSON.stringify({ error: "Requisição incompleta para IA" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payloadMessages = mode === "chatbot" || mode === "concierge"
      ? [{ role: "system", content: systemPrompt }, ...messages, { role: "user", content: userPrompt }]
      : [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: payloadMessages,
        max_tokens: mode === "dashboard" ? 1400 : 900,
        temperature: 0.65,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Erro no gateway de IA (${aiResp.status})`);
    }

    const aiData = await aiResp.json();
    const content = aiData?.choices?.[0]?.message?.content || "Não consegui processar sua pergunta agora.";

    return new Response(JSON.stringify({ content, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("unified-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
