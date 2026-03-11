import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLUGGY_BASE = "https://api.pluggy.ai";

async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Pluggy credentials not configured");

  const res = await fetch(`${PLUGGY_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pluggy auth failed: ${text}`);
  }
  const data = await res.json();
  return data.apiKey;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.user.id;

    const body = await req.json();
    const { action } = body;

    // ── ACTION: create_connect_token ──
    // Returns a Pluggy Connect widget token so the frontend can open the widget
    if (action === "create_connect_token") {
      const apiKey = await getPluggyApiKey();
      const payload: any = {};
      if (body.itemId) payload.itemId = body.itemId;

      const res = await fetch(`${PLUGGY_BASE}/connect_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Connect token failed: ${text}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify({ accessToken: data.accessToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: save_connection ──
    // After user connects via widget, save the item reference
    if (action === "save_connection") {
      const { campoId, itemId } = body;
      if (!campoId || !itemId) throw new Error("campoId and itemId required");

      // Fetch item details from Pluggy
      const apiKey = await getPluggyApiKey();
      const itemRes = await fetch(`${PLUGGY_BASE}/items/${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!itemRes.ok) {
        const text = await itemRes.text();
        throw new Error(`Failed to fetch item: ${text}`);
      }
      const itemData = await itemRes.json();

      // Save to DB (store apiKey encrypted - in production use vault)
      const { data, error } = await supabase.from("fin_bank_connections").insert({
        campo_id: campoId,
        pluggy_item_id: itemId,
        access_token_encrypted: apiKey, // The API key is session-based, we re-auth each time
        bank_name: itemData.connector?.name || "Banco",
        account_type: itemData.connector?.type || null,
        status: "active",
        created_by: userId,
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ connection: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: sync_transactions ──
    // Fetch transactions from Pluggy and insert into fin_extrato_items
    if (action === "sync_transactions") {
      const { connectionId, campoId, dateFrom, dateTo } = body;
      if (!connectionId || !campoId) throw new Error("connectionId and campoId required");

      // Get connection
      const { data: conn, error: connErr } = await supabase
        .from("fin_bank_connections")
        .select("*")
        .eq("id", connectionId)
        .single();
      if (connErr || !conn) throw new Error("Connection not found");

      const apiKey = await getPluggyApiKey();

      // Fetch accounts for item
      const acctRes = await fetch(`${PLUGGY_BASE}/accounts?itemId=${conn.pluggy_item_id}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!acctRes.ok) {
        const text = await acctRes.text();
        // Update connection status
        await supabase.from("fin_bank_connections").update({
          status: "error",
          sync_error: text,
        }).eq("id", connectionId);
        throw new Error(`Failed to fetch accounts: ${text}`);
      }
      const acctData = await acctRes.json();
      const accounts = acctData.results || [];

      let allTransactions: any[] = [];
      let bankName = conn.bank_name || "Banco";

      for (const acct of accounts) {
        // Fetch transactions for each account
        let url = `${PLUGGY_BASE}/transactions?accountId=${acct.id}`;
        if (dateFrom) url += `&from=${dateFrom}`;
        if (dateTo) url += `&to=${dateTo}`;
        url += `&pageSize=500`;

        const txRes = await fetch(url, {
          headers: { "X-API-KEY": apiKey },
        });
        if (!txRes.ok) continue;
        const txData = await txRes.json();
        const txs = txData.results || [];

        for (const tx of txs) {
          allTransactions.push({
            data: tx.date?.split("T")[0] || new Date().toISOString().split("T")[0],
            descricao: tx.description || tx.descriptionRaw || "Sem descrição",
            valor: Math.abs(tx.amount || 0),
            tipo: (tx.amount || 0) >= 0 ? "entrada" : "saida",
            saldo: tx.balance || null,
          });
        }

        // Update account info
        if (acct.number) {
          await supabase.from("fin_bank_connections").update({
            account_number: acct.number,
            account_type: acct.type || conn.account_type,
          }).eq("id", connectionId);
        }
      }

      // Create conciliacao session and insert items
      if (allTransactions.length > 0) {
        const dates = allTransactions.map((t: any) => t.data).sort();
        const periodoInicio = dateFrom || dates[0];
        const periodoFim = dateTo || dates[dates.length - 1];

        // Fetch contas for matching
        const { data: contasPagar } = await supabase
          .from("fin_contas_pagar")
          .select("id, descricao, valor, data_vencimento, status")
          .eq("campo_id", campoId);
        const { data: contasReceber } = await supabase
          .from("fin_contas_receber")
          .select("id, descricao, valor, data_prevista, status")
          .eq("campo_id", campoId);

        // Simple matching
        const itemsWithMatch = allTransactions.map((item: any) => {
          const absVal = Math.abs(item.valor);
          let bestMatch: any = null;
          let bestScore = 0;

          const pool = item.tipo === "saida" ? (contasPagar || []) : (contasReceber || []);
          const dateField = item.tipo === "saida" ? "data_vencimento" : "data_prevista";

          for (const c of pool) {
            if (c.status === "pago" || c.status === "recebido") continue;
            let score = 0;
            const valDiff = Math.abs(Number(c.valor) - absVal);
            if (valDiff === 0) score += 50;
            else if (valDiff < absVal * 0.02) score += 30;
            else continue;

            const daysDiff = Math.abs(
              new Date(c[dateField]).getTime() - new Date(item.data).getTime()
            ) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 1) score += 30;
            else if (daysDiff <= 7) score += 20;
            else if (daysDiff <= 30) score += 5;

            if (score > bestScore) {
              bestScore = score;
              bestMatch = { ...c, type: item.tipo === "saida" ? "pagar" : "receber" };
            }
          }

          return {
            ...item,
            campo_id: campoId,
            status_conciliacao:
              bestScore >= 70 ? "conciliado" : bestScore >= 30 ? "sugerido" : "pendente",
            conta_pagar_id: bestMatch?.type === "pagar" ? bestMatch.id : null,
            conta_receber_id: bestMatch?.type === "receber" ? bestMatch.id : null,
            match_score: bestScore || null,
            match_sugerido_label: bestMatch
              ? `${bestMatch.descricao} (R$ ${Number(bestMatch.valor).toFixed(2)})`
              : null,
          };
        });

        const conciliados = itemsWithMatch.filter((i: any) => i.status_conciliacao === "conciliado").length;
        const pendentes = itemsWithMatch.filter(
          (i: any) => i.status_conciliacao === "pendente" || i.status_conciliacao === "sugerido"
        ).length;

        const { data: conc, error: concErr } = await supabase
          .from("fin_conciliacoes")
          .insert({
            campo_id: campoId,
            periodo_inicio: periodoInicio,
            periodo_fim: periodoFim,
            banco: bankName,
            total_itens: itemsWithMatch.length,
            total_conciliados: conciliados,
            total_pendentes: pendentes,
            created_by: userId,
          })
          .select()
          .single();

        if (concErr) throw concErr;

        const rows = itemsWithMatch.map((it: any) => ({
          ...it,
          conciliacao_id: conc.id,
        }));
        const { error: itemsErr } = await supabase.from("fin_extrato_items").insert(rows);
        if (itemsErr) throw itemsErr;

        // Update connection sync time
        await supabase.from("fin_bank_connections").update({
          last_sync_at: new Date().toISOString(),
          status: "active",
          sync_error: null,
        }).eq("id", connectionId);

        // Audit
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", userId)
          .maybeSingle();
        await supabase.from("fin_audit_log").insert({
          tabela: "fin_conciliacoes",
          registro_id: conc.id,
          acao: "sync_open_finance",
          campo_id: campoId,
          user_id: userId,
          user_name: profile?.name || claims.user.email,
          detalhes: {
            total_itens: allTransactions.length,
            banco: bankName,
            connection_id: connectionId,
          },
        });

        return new Response(
          JSON.stringify({
            conciliacaoId: conc.id,
            totalTransactions: allTransactions.length,
            conciliados,
            pendentes,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ totalTransactions: 0, message: "Nenhuma transação encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: list_connections ──
    if (action === "list_connections") {
      const { campoId } = body;
      const { data, error } = await supabase
        .from("fin_bank_connections")
        .select("*")
        .eq("campo_id", campoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ connections: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: delete_connection ──
    if (action === "delete_connection") {
      const { connectionId } = body;
      if (!connectionId) throw new Error("connectionId required");

      // Also disconnect from Pluggy
      const { data: conn } = await supabase
        .from("fin_bank_connections")
        .select("pluggy_item_id")
        .eq("id", connectionId)
        .single();

      if (conn?.pluggy_item_id) {
        try {
          const apiKey = await getPluggyApiKey();
          await fetch(`${PLUGGY_BASE}/items/${conn.pluggy_item_id}`, {
            method: "DELETE",
            headers: { "X-API-KEY": apiKey },
          });
        } catch (e) {
          console.error("Failed to delete Pluggy item:", e);
        }
      }

      const { error } = await supabase
        .from("fin_bank_connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("open-finance-proxy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
