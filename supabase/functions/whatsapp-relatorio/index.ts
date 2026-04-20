import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Aceita DD/MM/AAAA, DD-MM-AAAA, YYYY-MM-DD — normaliza para YYYY-MM-DD.
// Retorna null se vazio/invalido (callee usa fallback = hoje).
function normalizarData(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  // YYYY-MM-DD — ja no formato certo
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/AAAA ou DD-MM-AAAA
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  return null;
}

function matchCelula(celulas: Record<string, unknown>[], searchTerm: string) {
  // 1. match exato
  const exato = celulas.find((c) => {
    const n = ((c.name || c.nome) as string || "").toLowerCase();
    return n === searchTerm;
  });
  if (exato) return exato;

  // 2. match parcial — preferir o nome MAIS LONGO (mais especifico)
  // "Videira Verdadeira" deve ganhar de "Videira"
  // "Transformados Pela Graca" deve ganhar de "A Graca"
  let bestMatch: Record<string, unknown> | null = null;
  let bestLen = 0;
  for (const c of celulas) {
    const n = ((c.name || c.nome) as string || "").toLowerCase();
    if (n.includes(searchTerm) || searchTerm.includes(n)) {
      const matchLen = n.length;
      if (matchLen > bestLen) {
        bestLen = matchLen;
        bestMatch = c;
      }
    }
  }
  return bestMatch;
}

Deno.serve(async (req) => {
  const WEBHOOK_SECRET = Deno.env.get("ATALAIA_WEBHOOK_SECRET");
  const secret = req.headers.get("x-webhook-secret");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Nao autorizado" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const headers = { "Content-Type": "application/json" };

  // ── ACTION: delete ──────────────────────────────────────────────────────────
  if (body.action === "delete") {
    const { celula, semana_inicio, relatorio_id } = body as Record<string, unknown>;

    if (relatorio_id) {
      const { error } = await supabase.from("weekly_reports").delete().eq("id", relatorio_id as string);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
      return new Response(JSON.stringify({ sucesso: true, excluido_por: "id", relatorio_id }), { status: 200, headers });
    }

    if (!celula) {
      return new Response(JSON.stringify({ error: "Informe celula ou relatorio_id para excluir" }), { status: 400, headers });
    }

    // Normaliza nome da celula
    const { data: celulas } = await supabase.from("celulas").select("id, name, nome").neq("is_test_data", true).limit(200);
    let celula_nome = (celula as string).trim();
    if (celulas) {
      const searchTerm = celula_nome.toLowerCase();
      const found = matchCelula(celulas as Record<string, unknown>[], searchTerm);
      if (found) celula_nome = (found.name || found.nome) as string || celula_nome;
    }

    // Calcula semana se nao informada
    let semana = semana_inicio as string;
    if (!semana) {
      const hoje = new Date();
      const diaSemana = hoje.getDay();
      const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const segunda = new Date(hoje);
      segunda.setDate(hoje.getDate() + diffSegunda);
      semana = segunda.toISOString().split("T")[0];
    }

    const { data: found_rows, error: findErr } = await supabase
      .from("weekly_reports")
      .select("id, celula, semana_inicio")
      .eq("celula", celula_nome)
      .eq("semana_inicio", semana);

    if (findErr) return new Response(JSON.stringify({ error: findErr.message }), { status: 500, headers });
    if (!found_rows || found_rows.length === 0) {
      return new Response(JSON.stringify({ error: "Relatorio nao encontrado", celula: celula_nome, semana }), { status: 404, headers });
    }

    const { error: delErr } = await supabase
      .from("weekly_reports")
      .delete()
      .eq("celula", celula_nome)
      .eq("semana_inicio", semana);

    if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers });
    return new Response(JSON.stringify({ sucesso: true, excluido: celula_nome, semana, registros: found_rows.length }), { status: 200, headers });
  }

  // ── ACTION: save/upsert (padrao) ────────────────────────────────────────────
  const { celula, lider, membros, visitantes, criancas, lideres_treinamento, discipulados, data } = body as Record<string, unknown>;

  let celula_nome = (celula as string || "").trim();
  let cell_id: string | null = null;

  if (celula_nome) {
    const { data: celulas } = await supabase
      .from("celulas")
      .select("id, name, nome")
      .neq("is_test_data", true)
      .limit(200);

    if (celulas) {
      const searchTerm = celula_nome.toLowerCase();
      const found = matchCelula(celulas as Record<string, unknown>[], searchTerm);
      if (found) {
        cell_id = found.id as string;
        celula_nome = (found.name || found.nome) as string || celula_nome;
      }
    }
  }

  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diffSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diffSegunda);
  const semana_inicio = segunda.toISOString().split("T")[0];

  const total = (membros as number || 0) + (visitantes as number || 0) + (criancas as number || 0);

  const { data: saved, error } = await supabase.from("weekly_reports").upsert({
    cell_id: cell_id || null,
    celula: celula_nome,
    lider: lider || null,
    membros: membros || 0,
    visitantes: visitantes || 0,
    criancas: criancas || 0,
    lideres_treinamento: lideres_treinamento || 0,
    discipulados: discipulados || 0,
    total_presentes: total,
    data: normalizarData(data) || hoje.toISOString().split("T")[0],
    semana_inicio,
  }, { onConflict: "celula,semana_inicio", ignoreDuplicates: false }).select().single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }

  return new Response(JSON.stringify({
    sucesso: true,
    celula: celula_nome,
    relatorio_id: (saved as Record<string, unknown>)?.id,
    semana: semana_inicio,
  }), { status: 200, headers });
});
