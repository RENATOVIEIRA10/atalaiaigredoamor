/**
 * VERIFICAR CRÉDITO — OpenAI & Claude
 *
 * Verifica automaticamente o estado de ambas as APIs
 * e mostra qual IA está disponível para uso.
 *
 * Como usar:
 *   node verificar-credito.js
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const OPENAI_KEY    = process.env.OPENAI_API_KEY    || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

// ── Utilitários de formatação ─────────────────────────────────────────────

function ok(msg)    { return `✅ ${msg}`; }
function erro(msg)  { return `❌ ${msg}`; }
function aviso(msg) { return `⚠️  ${msg}`; }

function linha() { console.log("─".repeat(52)); }

// ── Verificar OpenAI ──────────────────────────────────────────────────────

async function verificarOpenAI() {
  console.log("\n┌─────────────────────────────────────────────────┐");
  console.log("│              OPENAI (GPT-4o)                    │");
  console.log("└─────────────────────────────────────────────────┘");

  // 1. Chave presente?
  if (!OPENAI_KEY || OPENAI_KEY.includes("COLE_SUA")) {
    console.log(erro("Chave não configurada no .env"));
    console.log("   → Obtenha em: https://platform.openai.com/api-keys");
    return { disponivel: false, motivo: "chave_ausente" };
  }
  console.log(ok(`Chave: ${OPENAI_KEY.slice(0, 7)}...${OPENAI_KEY.slice(-4)}`));

  const openai = new OpenAI({ apiKey: OPENAI_KEY });

  // 2. Testar conexão com chamada mínima
  try {
    const inicio = Date.now();
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "ok" }],
      max_tokens: 1,
    });
    const tempo = Date.now() - inicio;
    const modelo = resposta.model;
    const tokensUsados = resposta.usage?.total_tokens || 0;

    console.log(ok(`Conexão: api.openai.com (${tempo}ms)`));
    console.log(ok(`Modelo:  ${modelo}`));
    console.log(ok(`Tokens usados neste teste: ${tokensUsados}`));

    // 3. Verificar uso recente via Usage API
    try {
      const hoje = new Date();
      const dataInicio = new Date(hoje);
      dataInicio.setDate(hoje.getDate() - 30);

      const usageResp = await fetch(
        `https://api.openai.com/v1/usage?date=${hoje.toISOString().slice(0, 10)}`,
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      );

      if (usageResp.ok) {
        const usage = await usageResp.json();
        const totalTokens = usage.data?.reduce((acc, d) => acc + (d.n_context_tokens_total || 0) + (d.n_generated_tokens_total || 0), 0) || 0;
        console.log(ok(`Tokens usados hoje: ${totalTokens.toLocaleString()}`));
      }
    } catch {
      // Usage API pode não estar disponível para todas as chaves
    }

    // 4. Verificar saldo (via billing — só funciona com chaves de organização)
    try {
      const billingResp = await fetch(
        "https://api.openai.com/v1/dashboard/billing/credit_grants",
        { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
      );

      if (billingResp.ok) {
        const billing = await billingResp.json();
        const total    = billing.total_granted   || 0;
        const usado    = billing.total_used       || 0;
        const restante = billing.total_available  || 0;
        const expira   = billing.grants?.[0]?.expires_at;

        console.log(ok(`Crédito total:     $${total.toFixed(2)}`));
        console.log(ok(`Crédito usado:     $${usado.toFixed(2)}`));
        console.log(ok(`Crédito restante:  $${restante.toFixed(2)}`));
        if (expira) {
          const dataExpira = new Date(expira * 1000).toLocaleDateString("pt-BR");
          console.log(ok(`Expira em:         ${dataExpira}`));
        }

        if (restante < 1) {
          console.log(aviso("Saldo baixo! Recarrega em: https://platform.openai.com/settings/organization/billing"));
          return { disponivel: restante > 0, motivo: "saldo_baixo", saldo: restante };
        }
      } else if (billingResp.status === 429) {
        console.log(aviso("Limite de requisições atingido temporariamente"));
      } else {
        // Chaves de projecto não têm acesso ao billing — mas a API funciona
        console.log(ok("Saldo: verificação manual em platform.openai.com/usage"));
      }
    } catch {
      console.log(ok("Saldo: verificação manual em platform.openai.com/usage"));
    }

    console.log(ok("STATUS: DISPONÍVEL para uso ✓"));
    return { disponivel: true };

  } catch (e) {
    if (e.status === 401) {
      console.log(erro("Chave inválida ou expirada"));
      console.log("   → Gera nova chave em: https://platform.openai.com/api-keys");
      return { disponivel: false, motivo: "chave_invalida" };
    }
    if (e.status === 429) {
      const msg = e.message || "";
      if (msg.includes("quota") || msg.includes("billing")) {
        console.log(erro("Saldo esgotado ou limite de quota atingido"));
        console.log("   → Recarrega em: https://platform.openai.com/settings/organization/billing");
        return { disponivel: false, motivo: "sem_saldo" };
      }
      console.log(aviso("Limite de requisições por minuto atingido (aguarda 1 min)"));
      return { disponivel: true, motivo: "rate_limit" };
    }
    if (e.status === 403) {
      console.log(erro("Sem permissão — verifica as restrições da chave"));
      return { disponivel: false, motivo: "sem_permissao" };
    }
    console.log(erro(`Erro inesperado: ${e.message}`));
    return { disponivel: false, motivo: "erro_desconhecido" };
  }
}

// ── Verificar Claude / Anthropic ──────────────────────────────────────────

async function verificarClaude() {
  console.log("\n┌─────────────────────────────────────────────────┐");
  console.log("│           CLAUDE (Anthropic)                    │");
  console.log("└─────────────────────────────────────────────────┘");

  // Nota: O Claude Code usa autenticação OAuth (não API key)
  // Se o utilizador tem o Claude Code instalado, a verificação é diferente
  const temChaveAPI = ANTHROPIC_KEY && !ANTHROPIC_KEY.includes("COLE_SUA") && !ANTHROPIC_KEY.includes("sk-ant-COLE");

  if (!temChaveAPI) {
    console.log(aviso("Chave ANTHROPIC_API_KEY não configurada no .env"));
    console.log("   → Isso é normal se usas o Claude Code (CLI)");
    console.log("   → O Claude Code usa autenticação própria (OAuth)");
    console.log("   → Para verificar o Claude Code, usa: claude /status");

    // Tenta verificar se o Claude Code está instalado
    try {
      const { execSync } = await import("child_process");
      const versao = execSync("claude --version 2>&1", { timeout: 5000 }).toString().trim();
      console.log(ok(`Claude Code instalado: ${versao}`));
      console.log(ok("Para verificar crédito: https://claude.ai/settings"));
      return { disponivel: "claude_code", motivo: "usa_oauth" };
    } catch {
      console.log(erro("Claude Code não encontrado no PATH"));
      console.log("   → Instala em: https://claude.ai/download");
      return { disponivel: false, motivo: "nao_instalado" };
    }
  }

  // Se tem chave de API da Anthropic
  console.log(ok(`Chave: ${ANTHROPIC_KEY.slice(0, 14)}...${ANTHROPIC_KEY.slice(-4)}`));

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  try {
    const inicio = Date.now();
    const resposta = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1,
      messages: [{ role: "user", content: "ok" }],
    });
    const tempo = Date.now() - inicio;

    console.log(ok(`Conexão: api.anthropic.com (${tempo}ms)`));
    console.log(ok(`Modelo:  ${resposta.model}`));
    console.log(ok(`Tokens usados neste teste: ${(resposta.usage?.input_tokens || 0) + (resposta.usage?.output_tokens || 0)}`));
    console.log(ok("Saldo: verificação em https://console.anthropic.com/settings/billing"));
    console.log(ok("STATUS: DISPONÍVEL para uso ✓"));
    return { disponivel: true };

  } catch (e) {
    if (e.status === 401) {
      console.log(erro("Chave inválida ou expirada"));
      console.log("   → Gera nova chave em: https://console.anthropic.com/settings/keys");
      return { disponivel: false, motivo: "chave_invalida" };
    }
    if (e.status === 529 || e.status === 429) {
      console.log(aviso("API sobrecarregada ou limite atingido"));
      return { disponivel: false, motivo: "sobrecarga" };
    }
    if (e.message?.includes("credit") || e.message?.includes("billing")) {
      console.log(erro("Crédito esgotado"));
      console.log("   → Recarrega em: https://console.anthropic.com/settings/billing");
      return { disponivel: false, motivo: "sem_credito" };
    }
    console.log(erro(`Erro: ${e.message}`));
    return { disponivel: false, motivo: "erro" };
  }
}

// ── Resumo final ──────────────────────────────────────────────────────────

function mostrarResumo(openai, claude) {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                  RESUMO FINAL                   ║");
  console.log("╠══════════════════════════════════════════════════╣");

  const openaiOk  = openai.disponivel === true;
  const claudeOk  = claude.disponivel === true || claude.disponivel === "claude_code";

  console.log(`║  OpenAI (GPT-4o):  ${openaiOk  ? "✅ DISPONÍVEL          " : "❌ INDISPONÍVEL        "}║`);
  console.log(`║  Claude:           ${claudeOk  ? "✅ DISPONÍVEL          " : "❌ INDISPONÍVEL        "}║`);
  console.log("╠══════════════════════════════════════════════════╣");

  if (openaiOk && claudeOk) {
    console.log("║  🚀 Modo completo: MCP + Claude Code activos     ║");
    console.log("║     Tarefas rotineiras → OpenAI (via MCP)        ║");
    console.log("║     Tarefas complexas  → Claude directamente     ║");
  } else if (openaiOk && !claudeOk) {
    console.log("║  ⚡ Modo OpenAI: usa directamente no terminal     ║");
    console.log("║     node index.js   → chatbot GPT-4o             ║");
    console.log("║     node agente.js  → agente autónomo            ║");
    console.log("║     node obsidian.js → lê notas Obsidian         ║");
  } else if (!openaiOk && claudeOk) {
    console.log("║  🤖 Modo Claude: usa o Claude Code normalmente   ║");
    console.log("║     As ferramentas MCP (OpenAI) não funcionam    ║");
    console.log("║     Recarrega a OpenAI em platform.openai.com    ║");
  } else {
    console.log("║  🔴 Ambas as IAs indisponíveis                   ║");
    console.log("║     Verifica as chaves no ficheiro .env          ║");
  }

  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  Links úteis:                                    ║");
  console.log("║  OpenAI saldo: platform.openai.com/usage         ║");
  console.log("║  Claude saldo: console.anthropic.com/billing     ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║     VERIFICAÇÃO DE CRÉDITO — OpenAI & Claude    ║");
  console.log(`║     ${new Date().toLocaleString("pt-BR").padEnd(45)}║`);
  console.log("╚══════════════════════════════════════════════════╝");

  const [resultOpenAI, resultClaude] = await Promise.allSettled([
    verificarOpenAI(),
    verificarClaude(),
  ]);

  const openai = resultOpenAI.status === "fulfilled" ? resultOpenAI.value : { disponivel: false, motivo: "erro" };
  const claude = resultClaude.status === "fulfilled" ? resultClaude.value : { disponivel: false, motivo: "erro" };

  mostrarResumo(openai, claude);
}

main().catch((e) => {
  console.error("\nErro inesperado:", e.message);
  process.exit(1);
});
