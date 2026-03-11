import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const body = await req.json();
    const { mode, content, tipo } = body; // mode: 'text' | 'image', tipo: 'pagar' | 'receber'

    if (!content || !tipo) {
      return new Response(JSON.stringify({ error: "Conteúdo e tipo são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tipoLabel = tipo === "pagar" ? "Contas a Pagar" : "Contas a Receber";
    const dateField = tipo === "pagar" ? "data_vencimento" : "data_prevista";

    const systemPrompt = `Você é um assistente financeiro especializado em extrair dados de ${tipoLabel} para igrejas.

Analise o conteúdo fornecido e extraia TODOS os lançamentos financeiros encontrados.

Para cada lançamento, retorne um objeto JSON com estes campos:
- descricao: string (descrição da conta)
- valor: number (valor em reais, sem símbolo)
- ${dateField}: string (data no formato YYYY-MM-DD)
- categoria_sugerida: string (sugestão de categoria: "Dízimos e Ofertas", "Aluguel", "Energia", "Água", "Internet", "Manutenção", "Eventos", "Material", "Salários", "Transporte", "Alimentação", "Outros")
${tipo === "pagar" ? '- fornecedor_sugerido: string (nome do fornecedor/beneficiário se identificável)' : '- origem_sugerida: string (origem do recebível se identificável)'}
- recorrencia_sugerida: string | null ("mensal", "semanal", "trimestral", "anual" ou null)
- observacoes: string | null (notas adicionais extraídas)

IMPORTANTE:
- Retorne APENAS um array JSON válido, sem markdown, sem explicação
- Se não conseguir extrair dados, retorne []
- Valores devem ser números (ex: 1500.00, não "R$ 1.500,00")
- Datas no formato YYYY-MM-DD
- Se a data não for clara, use a data atual ou a mais provável`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (mode === "image") {
      // content is a base64 data URL
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Extraia todos os lançamentos financeiros desta imagem/documento para ${tipoLabel}:` },
          { type: "image_url", image_url: { url: content } },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Extraia todos os lançamentos financeiros do texto abaixo para ${tipoLabel}:\n\n${content}`,
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error(`Erro no gateway de IA (${aiResp.status})`);
    }

    const aiData = await aiResp.json();
    let raw = aiData?.choices?.[0]?.message?.content || "[]";

    // Clean markdown code fences if present
    raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let items: any[];
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items)) items = [items];
    } catch {
      console.error("Failed to parse AI response:", raw);
      items = [];
    }

    return new Response(JSON.stringify({ items, raw_count: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-financial error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
