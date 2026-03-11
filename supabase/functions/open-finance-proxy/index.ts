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

  console.log("[Pluggy Auth] clientId present:", !!clientId, "length:", clientId?.length || 0);
  console.log("[Pluggy Auth] clientSecret present:", !!clientSecret, "length:", clientSecret?.length || 0);

  if (!clientId || !clientSecret) {
    throw new Error("Pluggy credentials not configured. Please set PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET.");
  }

  console.log("[Pluggy Auth] Authenticating with Pluggy API...");
  const res = await fetch(`${PLUGGY_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });

  const responseText = await res.text();
  console.log("[Pluggy Auth] Status:", res.status, "Response:", responseText.substring(0, 200));

  if (!res.ok) {
    throw new Error(`Pluggy auth failed (${res.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText);
  if (!data.apiKey) {
    throw new Error("Pluggy auth response missing apiKey field");
  }

  console.log("[Pluggy Auth] Successfully obtained API key");
  return data.apiKey;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) {
      console.error("[Auth] User validation failed:", authErr?.message);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claims.user.id;

    const body = await req.json();
    const { action } = body;
    console.log(`[open-finance-proxy] Action: ${action}, User: ${userId}`);

    // ── ACTION: create_connect_token ──
    if (action === "create_connect_token") {
      console.log("[create_connect_token] Starting...");
      const apiKey = await getPluggyApiKey();
      const payload: Record<string, unknown> = {};
      if (body.itemId) payload.itemId = body.itemId;

      console.log("[create_connect_token] Requesting connect token from Pluggy...");
      const res = await fetch(`${PLUGGY_BASE}/connect_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      console.log("[create_connect_token] Status:", res.status, "Response:", responseText.substring(0, 200));

      if (!res.ok) {
        throw new Error(`Connect token failed (${res.status}): ${responseText}`);
      }

      const data = JSON.parse(responseText);
      return jsonResponse({ accessToken: data.accessToken });
    }

    // ── ACTION: save_connection ──
    if (action === "save_connection") {
      const { campoId, itemId } = body;
      if (!campoId || !itemId) throw new Error("campoId and itemId required");

      console.log("[save_connection] Fetching item details for:", itemId);
      const apiKey = await getPluggyApiKey();
      const itemRes = await fetch(`${PLUGGY_BASE}/items/${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });

      const itemText = await itemRes.text();
      console.log("[save_connection] Item response status:", itemRes.status);

      if (!itemRes.ok) {
        throw new Error(`Failed to fetch item (${itemRes.status}): ${itemText}`);
      }
      const itemData = JSON.parse(itemText);

      const { data, error } = await supabase.from("fin_bank_connections").insert({
        campo_id: campoId,
        pluggy_item_id: itemId,
        access_token_encrypted: "pluggy-session",
        bank_name: itemData.connector?.name || "Banco",
        account_type: itemData.connector?.type || null,
        status: "active",
        created_by: userId,
      }).select().single();

      if (error) {
        console.error("[save_connection] DB error:", error.message);
        throw error;
      }

      console.log("[save_connection] Connection saved:", data.id);
      return jsonResponse({ connection: data });
    }

    // ── ACTION: sync_transactions ──
    if (action === "sync_transactions") {
      const { connectionId, campoId, dateFrom, dateTo } = body;
      if (!connectionId || !campoId) throw new Error("connectionId and campoId required");

      console.log("[sync_transactions] Starting sync for connection:", connectionId);

      const { data: conn, error: connErr } = await supabase
        .from("fin_bank_connections")
        .select("*")
        .eq("id", connectionId)
        .single();
      if (connErr || !conn) throw new Error("Connection not found");

      const apiKey = await getPluggyApiKey();

      // Fetch accounts
      console.log("[sync_transactions] Fetching accounts for item:", conn.pluggy_item_id);
      const acctRes = await fetch(`${PLUGGY_BASE}/accounts?itemId=${conn.pluggy_item_id}`, {
        headers: { "X-API-KEY": apiKey },
      });

      const acctText = await acctRes.text();
      console.log("[sync_transactions] Accounts response status:", acctRes.status);

      if (!acctRes.ok) {
        await supabase.from("fin_bank_connections").update({
          status: "error",
          sync_error: acctText,
        }).eq("id", connectionId);
        throw new Error(`Failed to fetch accounts (${acctRes.status}): ${acctText}`);
      }

      const acctData = JSON.parse(acctText);
      const accounts = acctData.results || [];
      console.log("[sync_transactions] Found", accounts.length, "accounts");

      let allTransactions: Record<string, unknown>[] = [];
      const bankName = conn.bank_name || "Banco";

      for (const acct of accounts) {
        let url = `${PLUGGY_BASE}/transactions?accountId=${acct.id}`;
        if (dateFrom) url += `&from=${dateFrom}`;
        if (dateTo) url += `&to=${dateTo}`;
        url += `&pageSize=500`;

        console.log("[sync_transactions] Fetching transactions for account:", acct.id);
        const txRes = await fetch(url, {
          headers: { "X-API-KEY": apiKey },
        });
        if (!txRes.ok) {
          const txErr = await txRes.text();
          console.error("[sync_transactions] Transaction fetch failed:", txErr);
          continue;
        }
        const txData = await txRes.json();
        const txs = txData.results || [];
        console.log("[sync_transactions] Got", txs.length, "transactions from account", acct.id);

        for (const tx of txs) {
          allTransactions.push({
            data: tx.date?.split("T")[0] || new Date().toISOString().split("T")[0],
            descricao: tx.description || tx.descriptionRaw || "Sem descrição",
            valor: Math.abs(tx.amount || 0),
            tipo: (tx.amount || 0) >= 0 ? "entrada" : "saida",
            saldo: tx.balance || null,
          });
        }

        if (acct.number) {
          await supabase.from("fin_bank_connections").update({
            account_number: acct.number,
            account_type: acct.type || conn.account_type,
          }).eq("id", connectionId);
        }
      }

      // Create conciliacao session
      if (allTransactions.length > 0) {
        const dates = allTransactions.map((t) => t.data as string).sort();
        const periodoInicio = dateFrom || dates[0];
        const periodoFim = dateTo || dates[dates.length - 1];

        const { data: contasPagar } = await supabase
          .from("fin_contas_pagar")
          .select("id, descricao, valor, data_vencimento, status")
          .eq("campo_id", campoId);
        const { data: contasReceber } = await supabase
          .from("fin_contas_receber")
          .select("id, descricao, valor, data_prevista, status")
          .eq("campo_id", campoId);

        const itemsWithMatch = allTransactions.map((item) => {
          const absVal = Math.abs(item.valor as number);
          let bestMatch: Record<string, unknown> | null = null;
          let bestScore = 0;

          const pool = item.tipo === "saida" ? (contasPagar || []) : (contasReceber || []);
          const dateField = item.tipo === "saida" ? "data_vencimento" : "data_prevista";

          for (const c of pool) {
            if ((c as any).status === "pago" || (c as any).status === "recebido") continue;
            let score = 0;
            const valDiff = Math.abs(Number((c as any).valor) - absVal);
            if (valDiff === 0) score += 50;
            else if (valDiff < absVal * 0.02) score += 30;
            else continue;

            const daysDiff = Math.abs(
              new Date((c as any)[dateField]).getTime() - new Date(item.data as string).getTime()
            ) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 1) score += 30;
            else if (daysDiff <= 7) score += 20;
            else if (daysDiff <= 30) score += 5;

            if (score > bestScore) {
              bestScore = score;
              bestMatch = { ...(c as any), type: item.tipo === "saida" ? "pagar" : "receber" };
            }
          }

          return {
            ...item,
            campo_id: campoId,
            status_conciliacao:
              bestScore >= 70 ? "conciliado" : bestScore >= 30 ? "sugerido" : "pendente",
            conta_pagar_id: bestMatch?.type === "pagar" ? (bestMatch as any).id : null,
            conta_receber_id: bestMatch?.type === "receber" ? (bestMatch as any).id : null,
            match_score: bestScore || null,
            match_sugerido_label: bestMatch
              ? `${(bestMatch as any).descricao} (R$ ${Number((bestMatch as any).valor).toFixed(2)})`
              : null,
          };
        });

        const conciliados = itemsWithMatch.filter((i) => i.status_conciliacao === "conciliado").length;
        const pendentes = itemsWithMatch.filter(
          (i) => i.status_conciliacao === "pendente" || i.status_conciliacao === "sugerido"
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

        const rows = itemsWithMatch.map((it) => ({
          ...it,
          conciliacao_id: conc.id,
        }));
        const { error: itemsErr } = await supabase.from("fin_extrato_items").insert(rows);
        if (itemsErr) throw itemsErr;

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

        console.log("[sync_transactions] Completed:", allTransactions.length, "transactions,", conciliados, "matched");
        return jsonResponse({
          conciliacaoId: conc.id,
          totalTransactions: allTransactions.length,
          conciliados,
          pendentes,
        });
      }

      return jsonResponse({ totalTransactions: 0, message: "Nenhuma transação encontrada" });
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
      return jsonResponse({ connections: data });
    }

    // ── ACTION: delete_connection ──
    if (action === "delete_connection") {
      const { connectionId } = body;
      if (!connectionId) throw new Error("connectionId required");

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
          console.error("[delete_connection] Failed to delete Pluggy item:", e);
        }
      }

      const { error } = await supabase
        .from("fin_bank_connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;

      return jsonResponse({ success: true });
    }

    // ── ACTION: test_auth ──
    if (action === "test_auth") {
      console.log("[test_auth] Testing Pluggy authentication...");
      try {
        const apiKey = await getPluggyApiKey();
        return jsonResponse({ success: true, message: "Pluggy authentication successful", apiKeyLength: apiKey.length });
      } catch (e: any) {
        return jsonResponse({ success: false, error: e.message }, 400);
      }
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("[open-finance-proxy] Error:", err.message);
    return jsonResponse({ error: err.message || "Internal error" }, 500);
  }
});
