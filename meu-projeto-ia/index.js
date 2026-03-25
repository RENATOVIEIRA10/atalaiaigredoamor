import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";
import fs from "fs";

// Carrega as variáveis do ficheiro .env
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ficheiro onde o histórico da conversa é guardado
const HISTORICO_FILE = "./historico.json";

// Carrega o histórico anterior (para continuar tarefas)
function carregarHistorico() {
  if (fs.existsSync(HISTORICO_FILE)) {
    try {
      const dados = fs.readFileSync(HISTORICO_FILE, "utf-8");
      return JSON.parse(dados);
    } catch {
      return [];
    }
  }
  return [];
}

// Guarda o histórico no disco
function guardarHistorico(mensagens) {
  fs.writeFileSync(HISTORICO_FILE, JSON.stringify(mensagens, null, 2), "utf-8");
}

// Limpa o histórico (começa nova sessão)
function limparHistorico() {
  if (fs.existsSync(HISTORICO_FILE)) {
    fs.unlinkSync(HISTORICO_FILE);
  }
  console.log("\n✅ Histórico limpo. Nova conversa iniciada.\n");
}

// Envia mensagem para a OpenAI e recebe resposta
async function chat(mensagens) {
  const resposta = await client.chat.completions.create({
    model: "gpt-4o",
    messages: mensagens,
    temperature: 0.7,
  });
  return resposta.choices[0].message.content;
}

// Função principal
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Sistema: define o comportamento do assistente
  const sistemaPrompt = {
    role: "system",
    content: `Você é um assistente de IA avançado e especialista em programação, automação e produtividade.
Você pode:
- Criar e explicar código em qualquer linguagem (JavaScript, Python, TypeScript, etc.)
- Criar agentes de IA e pipelines de automação
- Analisar e resumir notas do Obsidian
- Continuar tarefas de sessões anteriores com base no histórico
- Ajudar a planear projetos e resolver problemas complexos

Responda sempre em português de forma clara e direta.
Quando gerar código, use blocos de código com a linguagem indicada.
Quando for uma tarefa longa, divida em passos numerados.`,
  };

  // Carrega histórico anterior
  let mensagens = carregarHistorico();

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║        ASSISTENTE DE IA LOCAL            ║");
  console.log("║  Powered by OpenAI GPT-4o                ║");
  console.log("╚══════════════════════════════════════════╝");

  if (mensagens.length > 0) {
    console.log(`\n📂 Histórico carregado: ${mensagens.length} mensagens anteriores.`);
    console.log('   (Digite "novo" para começar uma conversa nova)\n');
  } else {
    console.log("\n💬 Pronto para conversar! O que deseja fazer?\n");
  }

  console.log('Comandos especiais:');
  console.log('  "novo"    → Limpa o histórico e começa nova sessão');
  console.log('  "sair"    → Encerra o programa');
  console.log('  "codigo"  → Pede ao assistente para gerar código');
  console.log('  "agente"  → Pede ao assistente para criar um agente de IA');
  console.log('─────────────────────────────────────────────\n');

  const perguntar = () => {
    rl.question("Você: ", async (entrada) => {
      const texto = entrada.trim();

      if (!texto) {
        perguntar();
        return;
      }

      // Comandos especiais
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

      // Adiciona a mensagem do utilizador ao histórico
      mensagens.push({ role: "user", content: texto });

      // Prepara as mensagens com o sistema no início
      const mensagensComSistema = [sistemaPrompt, ...mensagens];

      try {
        process.stdout.write("\n🤖 Assistente: ");
        const resposta = await chat(mensagensComSistema);
        console.log(resposta);
        console.log("\n─────────────────────────────────────────────\n");

        // Adiciona a resposta ao histórico e guarda
        mensagens.push({ role: "assistant", content: resposta });
        guardarHistorico(mensagens);
      } catch (erro) {
        if (erro.status === 401) {
          console.error("\n❌ Erro: Chave da OpenAI inválida ou não configurada.");
          console.error("   Abra o ficheiro .env e cole a sua chave em OPENAI_API_KEY\n");
        } else if (erro.status === 429) {
          console.error("\n❌ Erro: Limite de requisições atingido. Aguarde um momento.\n");
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
