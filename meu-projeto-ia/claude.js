import Anthropic from "@anthropic-ai/sdk";
import readline from "readline";
import dotenv from "dotenv";
import fs from "fs";

// Carrega as variáveis do ficheiro .env
dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Ficheiro onde o histórico da conversa é guardado
const HISTORICO_FILE = "./historico-claude.json";

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

function limparHistorico() {
  if (fs.existsSync(HISTORICO_FILE)) fs.unlinkSync(HISTORICO_FILE);
  console.log("\n✅ Histórico limpo. Nova conversa iniciada.\n");
}

// Envia mensagem para o Claude e recebe resposta
async function chat(mensagens, sistemaPrompt) {
  const resposta = await client.messages.create({
    model: "claude-opus-4-5",        // Modelo mais inteligente
    max_tokens: 4096,
    system: sistemaPrompt,
    messages: mensagens,
  });
  return resposta.content[0].text;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const sistemaPrompt = `Você é um assistente de IA avançado e especialista em programação, automação e produtividade.
Você pode:
- Criar e explicar código em qualquer linguagem (JavaScript, Python, TypeScript, etc.)
- Criar agentes de IA e pipelines de automação
- Analisar e resumir notas do Obsidian
- Continuar tarefas de sessões anteriores com base no histórico
- Ajudar a planear projetos e resolver problemas complexos

Responda sempre em português de forma clara e direta.
Quando gerar código, use blocos de código com a linguagem indicada.
Quando for uma tarefa longa, divida em passos numerados.`;

  let mensagens = carregarHistorico();

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║        ASSISTENTE CLAUDE LOCAL           ║");
  console.log("║  Powered by Anthropic Claude Opus        ║");
  console.log("╚══════════════════════════════════════════╝");

  if (mensagens.length > 0) {
    console.log(`\n📂 Histórico carregado: ${mensagens.length} mensagens anteriores.`);
    console.log('   (Digite "novo" para começar uma conversa nova)\n');
  } else {
    console.log("\n💬 Pronto para conversar! O que deseja fazer?\n");
  }

  console.log('Comandos: "novo" = limpar histórico | "sair" = encerrar');
  console.log("─────────────────────────────────────────────\n");

  const perguntar = () => {
    rl.question("Você: ", async (entrada) => {
      const texto = entrada.trim();
      if (!texto) { perguntar(); return; }

      if (texto.toLowerCase() === "sair") {
        console.log("\n👋 Até logo! O histórico foi guardado.\n");
        guardarHistorico(mensagens);
        rl.close();
        return;
      }

      if (texto.toLowerCase() === "novo") {
        limparHistorico();
        mensagens = [];
        perguntar();
        return;
      }

      // O Claude exige que as mensagens alternem entre user e assistant
      mensagens.push({ role: "user", content: texto });

      try {
        process.stdout.write("\n🤖 Claude: ");
        const resposta = await chat(mensagens, sistemaPrompt);
        console.log(resposta);
        console.log("\n─────────────────────────────────────────────\n");

        mensagens.push({ role: "assistant", content: resposta });
        guardarHistorico(mensagens);
      } catch (erro) {
        if (erro.status === 401) {
          console.error("\n❌ Chave da Anthropic inválida.");
          console.error("   Abra o ficheiro .env e cole a sua chave em ANTHROPIC_API_KEY\n");
        } else if (erro.status === 429) {
          console.error("\n❌ Limite de requisições atingido. Aguarde um momento.\n");
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
