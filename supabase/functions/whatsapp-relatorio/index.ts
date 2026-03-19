import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Chave secreta para autenticar o agente-celulas
const WEBHOOK_SECRET = Deno.env.get("WHATSAPP_WEBHOOK_SECRET") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verifica a chave secreta
    const secret = req.headers.get("x-webhook-secret");
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { celula, lider, membros, visitantes, criancas, lideres_treinamento, discipulados, data } = body;

    if (!celula) {
      return new Response(
        JSON.stringify({ error: "Nome da célula é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cliente Supabase com service role (permissão total)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Busca a célula pelo nome (case insensitive)
    const { data: celulaData, error: celulaError } = await supabase
      .from("celulas")
      .select("id, name, rede_id, campo_id")
      .ilike("name", `%${celula}%`)
      .limit(1)
      .single();

    if (celulaError || !celulaData) {
      return new Response(
        JSON.stringify({ error: `Célula "${celula}" não encontrada no Atalaia`, detalhes: celulaError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcula o início da semana (segunda-feira)
    const meetingDate = data ? new Date(data.split("/").reverse().join("-")) : new Date();
    const dayOfWeek = meetingDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(meetingDate);
    weekStart.setDate(meetingDate.getDate() - daysToMonday);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const meetingDateStr = meetingDate.toISOString().split("T")[0];

    // Insere ou atualiza o relatório semanal
    const { data: report, error: reportError } = await supabase
      .from("weekly_reports")
      .upsert({
        celula_id: celulaData.id,
        rede_id: celulaData.rede_id,
        campo_id: celulaData.campo_id,
        week_start: weekStartStr,
        meeting_date: meetingDateStr,
        members_present: membros || 0,
        visitors: visitantes || 0,
        children: criancas || 0,
        leaders_in_training: lideres_treinamento || 0,
        discipleships: discipulados || 0,
        notes: `Relatório via WhatsApp — Líder: ${lider || "Não informado"}`,
      }, {
        onConflict: "celula_id,week_start",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (reportError) {
      return new Response(
        JSON.stringify({ error: "Erro ao salvar relatório", detalhes: reportError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        celula: celulaData.name,
        relatorio_id: report.id,
        semana: weekStartStr,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", detalhes: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
