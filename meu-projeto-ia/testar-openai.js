/**
 * TESTE DE CONFIRMAÇÃO — API da OpenAI
 *
 * Este script confirma que:
 *   1. A chave da OpenAI está válida
 *   2. As chamadas vão para a OpenAI (não para o Claude)
 *   3. Mostra o modelo usado, tokens consumidos e custo estimado
 *
 * Como usar:
 *   node testar-openai.js
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const CHAVE = process.env.OPENAI_API_KEY || "";

// Preços por 1M tokens (USD) — actualizados Março 2025
const PRECOS = {
  "gpt-4o":       { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":  { input: 0.15,  output: 0.60  },
  "gpt-4-turbo":  { input: 10.00, output: 30.00 },
};

function calcularCusto(modelo, tokensInput, tokensOutput) {
  const p = PRECOS[modelo] || PRECOS["gpt-4o"];
  const custo = (tokensInput / 1_000_000) * p.input + (tokensOutput / 1_000_000) * p.output;
  return custo.toFixed(6);
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║     TESTE DE CONFIRMAÇÃO — API OPENAI        ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── Verificação 1: Chave presente ─────────────────────────────
  console.log("1. Verificando chave da OpenAI...");
  if (!CHAVE || CHAVE.includes("COLE_SUA")) {
    console.log("   ❌ OPENAI_API_KEY não configurada no ficheiro .env");
    console.log("   Abre o .env e cola a tua chave em OPENAI_API_KEY\n");
    process.exit(1);
  }
  console.log(`   ✅ Chave encontrada: ${CHAVE.slice(0, 7)}...${CHAVE.slice(-4)}`);
  console.log(`   ✅ Tipo: ${CHAVE.startsWith("sk-proj-") ? "Project API Key" : "Standard API Key"}\n`);

  // ── Verificação 2: Conexão com a OpenAI ───────────────────────
  console.log("2. Testando conexão com a API da OpenAI...");
  const openai = new OpenAI({ apiKey: CHAVE });

  let modelos;
  try {
    modelos = await openai.models.list();
    const temGPT4o = modelos.data.some((m) => m.id === "gpt-4o");
    console.log(`   ✅ Conexão estabelecida com api.openai.com`);
    console.log(`   ✅ Modelos disponíveis: ${modelos.data.length}`);
    console.log(`   ✅ GPT-4o disponível: ${temGPT4o ? "Sim" : "Não (verifica o plano da conta)"}\n`);
  } catch (erro) {
    if (erro.status === 401) {
      console.log("   ❌ Chave inválida ou expirada.");
      console.log("   Gera uma nova chave em: https://platform.openai.com/api-keys\n");
    } else if (erro.status === 429) {
      console.log("   ❌ Limite de requisições atingido ou saldo insuficiente.");
      console.log("   Verifica o teu saldo em: https://platform.openai.com/usage\n");
    } else {
      console.log(`   ❌ Erro: ${erro.message}\n`);
    }
    process.exit(1);
  }

  // ── Verificação 3: Chamada real ao GPT-4o ─────────────────────
  console.log("3. Fazendo uma chamada real ao GPT-4o...");
  console.log("   (Esta chamada vai aparecer no teu dashboard da OpenAI)\n");

  try {
    const inicio = Date.now();
    const resposta = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Responde APENAS com: 'Confirmado. Sou o GPT-4o da OpenAI.'" },
        { role: "user", content: "Confirma que és a API da OpenAI." },
      ],
      max_tokens: 30,
      temperature: 0,
    });
    const tempo = Date.now() - inicio;

    const msg       = resposta.choices[0].message;
    const modelo    = resposta.model;
    const tokensIn  = resposta.usage.prompt_tokens;
    const tokensOut = resposta.usage.completion_tokens;
    const total     = resposta.usage.total_tokens;
    const custo     = calcularCusto(modelo, tokensIn, tokensOut);
    const requestId = resposta.id;

    console.log("   ╔─────────────────────────────────────────────╗");
    console.log(`   ║ Resposta: ${msg.content.padEnd(35)}║`);
    console.log("   ╠─────────────────────────────────────────────╣");
    console.log(`   ║ Modelo:   ${modelo.padEnd(35)}║`);
    console.log(`   ║ Request ID: ${requestId.slice(0, 33)}║`);
    console.log(`   ║ Tokens:   ${String(tokensIn + " in / " + tokensOut + " out / " + total + " total").padEnd(35)}║`);
    console.log(`   ║ Custo:    $${String(custo).padEnd(34)}║`);
    console.log(`   ║ Tempo:    ${String(tempo + "ms").padEnd(35)}║`);
    console.log("   ╚─────────────────────────────────────────────╝\n");

    console.log("4. Como confirmar no dashboard da OpenAI:");
    console.log("   → Acede a: https://platform.openai.com/usage");
    console.log(`   → Procura o Request ID: ${requestId}`);
    console.log("   → Verás esta chamada listada com os tokens consumidos\n");

  } catch (erro) {
    console.log(`   ❌ Erro na chamada: ${erro.message}\n`);
    process.exit(1);
  }

  // ── Verificação 4: Confirmar que o MCP usa OpenAI ─────────────
  console.log("5. Como confirmar que o servidor MCP usa a OpenAI:");
  console.log("   → Cada vez que usas uma ferramenta do MCP no Claude Code,");
  console.log("     a chamada aparece em: https://platform.openai.com/usage");
  console.log("   → O Claude Code só aparece na tua conta Anthropic");
  console.log("   → A OpenAI só aparece na tua conta OpenAI");
  console.log("   → São cobranças separadas, em plataformas separadas\n");

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  ✅ TUDO CERTO! A API da OpenAI está activa  ║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().catch((e) => {
  console.error("Erro inesperado:", e.message);
  process.exit(1);
});
