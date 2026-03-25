/**
 * IA DUAL — Usa Claude e OpenAI ao mesmo tempo
 *
 * Estratégia automática:
 *   - Claude Opus  → análise profunda, código complexo, raciocínio longo
 *   - GPT-4o       → respostas rápidas, criatividade, tarefas gerais
 *   - Modo "ambos" → compara as respostas dos dois modelos lado a lado
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const HISTORICO_FILE = "./historico-dual.json";

function carregarHistorico() {
  if (fs.existsSync(HISTORICO_FILE)) {
    try { return JSON.parse(fs.readFileSync(HISTORICO_FILE, "utf-8")); }
    catch { return []; }
  }
  return [];
}

function guardarHistorico(mensagens) {
  fs.writeFileSync(HISTORICO_FILE, JSON.stringify(mensagens, null, 2), "utf-8");
}

const SISTEMA = `Você é um assistente de IA avançado especialista em programação, automação e produtividade.
Responda sempre em português. Seja direto e claro.
Quando gerar código, use blocos de código com a linguagem indicada.`;

// Pergunta ao Claude
async function perguntarClaude(mensagens) {
  const resposta = await claude.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: SISTEMA,
    messages: mensagens,
  });
  return resposta.content[0].text;
}

// Pergunta ao GPT-4o
async function perguntarGPT(mensagens) {
  const resposta = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: SISTEMA }, ...mensagens],
    temperature: 0.7,
  });
  return resposta.choices[0].message.content;
}

// Compara os dois modelos em paralelo
async function compararAmbos(mensagens) {
  console.log("\n⏳ Consultando Claude e GPT-4o em paralelo...\n");
  const [respostaClaude, respostaGPT] = await Promise.all([
    perguntarClaude(mensagens),
    perguntarGPT(mensagens),
  ]);
  return { claude: respostaClaude, gpt: respostaGPT };
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let mensagens = carregarHistorico();
  let modoAtual = "claude"; // claude | gpt | ambos

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          IA DUAL — CLAUDE + GPT-4o       ║");
  console.log("║  Use o melhor modelo para cada tarefa    ║");
  console.log("╚══════════════════════════════════════════╝");

  if (mensagens.length > 0) {
    console.log(`\n📂 Histórico carregado: ${mensagens.length} mensagens anteriores.`);
  }

  console.log(`\n🤖 Modo atual: ${modoAtual.toUpperCase()}\n`);
  console.log("Comandos especiais:");
  console.log('  "modo claude"  → Usar apenas Claude Opus (análise profunda)');
  console.log('  "modo gpt"     → Usar apenas GPT-4o (respostas rápidas)');
  console.log('  "modo ambos"   → Comparar as respostas dos dois modelos');
  console.log('  "novo"         → Limpar histórico');
  console.log('  "sair"         → Encerrar');
  console.log("─────────────────────────────────────────────\n");

  const perguntar = () => {
    rl.question(`[${modoAtual.toUpperCase()}] Você: `, async (entrada) => {
      const texto = entrada.trim();
      if (!texto) { perguntar(); return; }

      // Comandos de modo
      if (texto.toLowerCase() === "modo claude") {
        modoAtual = "claude";
        console.log("\n✅ Modo alterado para: CLAUDE OPUS (análise profunda)\n");
        perguntar(); return;
      }
      if (texto.toLowerCase() === "modo gpt") {
        modoAtual = "gpt";
        console.log("\n✅ Modo alterado para: GPT-4o (respostas rápidas)\n");
        perguntar(); return;
      }
      if (texto.toLowerCase() === "modo ambos") {
        modoAtual = "ambos";
        console.log("\n✅ Modo alterado para: AMBOS (comparação lado a lado)\n");
        perguntar(); return;
      }
      if (texto.toLowerCase() === "novo") {
        if (fs.existsSync(HISTORICO_FILE)) fs.unlinkSync(HISTORICO_FILE);
        mensagens = [];
        console.log("\n✅ Histórico limpo.\n");
        perguntar(); return;
      }
      if (texto.toLowerCase() === "sair") {
        console.log("\n👋 Até logo!\n");
        guardarHistorico(mensagens);
        rl.close(); return;
      }

      mensagens.push({ role: "user", content: texto });

      try {
        if (modoAtual === "claude") {
          process.stdout.write("\n🟣 Claude: ");
          const resposta = await perguntarClaude(mensagens);
          console.log(resposta);
          mensagens.push({ role: "assistant", content: resposta });

        } else if (modoAtual === "gpt") {
          process.stdout.write("\n🟢 GPT-4o: ");
          const resposta = await perguntarGPT(mensagens);
          console.log(resposta);
          mensagens.push({ role: "assistant", content: resposta });

        } else if (modoAtual === "ambos") {
          const { claude: respostaClaude, gpt: respostaGPT } = await compararAmbos(mensagens);

          console.log("─────────────────────────────────────────────");
          console.log("🟣 CLAUDE OPUS:");
          console.log(respostaClaude);
          console.log("\n─────────────────────────────────────────────");
          console.log("🟢 GPT-4o:");
          console.log(respostaGPT);

          // Guarda a resposta do Claude como referência no histórico
          mensagens.push({ role: "assistant", content: respostaClaude });
        }

        console.log("\n─────────────────────────────────────────────\n");
        guardarHistorico(mensagens);

      } catch (erro) {
        if (erro.status === 401) {
          console.error("\n❌ Chave inválida. Verifique o ficheiro .env\n");
        } else {
          console.error("\n❌ Erro:", erro.message, "\n");
        }
      }

      perguntar();
    });
  };

  perguntar();
}

main();
