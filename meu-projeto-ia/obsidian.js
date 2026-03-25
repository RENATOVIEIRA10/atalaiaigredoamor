import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import readline from "readline";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── LEITOR DE OBSIDIAN ────────────────────────────────────────────────────

// Lê todos os ficheiros .md de uma pasta (vault do Obsidian)
function lerVaultObsidian(pastaVault) {
  if (!fs.existsSync(pastaVault)) {
    return null;
  }

  const notas = [];

  function lerPastaRecursiva(pasta) {
    const itens = fs.readdirSync(pasta);
    for (const item of itens) {
      const caminho = path.join(pasta, item);
      const stat = fs.statSync(caminho);
      if (stat.isDirectory() && !item.startsWith(".")) {
        lerPastaRecursiva(caminho);
      } else if (item.endsWith(".md")) {
        const conteudo = fs.readFileSync(caminho, "utf-8");
        notas.push({
          nome: item.replace(".md", ""),
          caminho: caminho,
          conteudo: conteudo,
          tamanho: conteudo.length,
        });
      }
    }
  }

  lerPastaRecursiva(pastaVault);
  return notas;
}

// Formata as notas para enviar à IA (com limite de tamanho)
function formatarNotasParaIA(notas, maxChars = 80000) {
  let texto = "";
  let totalChars = 0;

  for (const nota of notas) {
    const bloco = `\n\n## NOTA: ${nota.nome}\n${nota.conteudo}\n`;
    if (totalChars + bloco.length > maxChars) {
      texto += `\n\n[... ${notas.length} notas no total, mostrando as primeiras por limite de tamanho ...]`;
      break;
    }
    texto += bloco;
    totalChars += bloco.length;
  }

  return texto;
}

// ─── ANÁLISE COM IA ────────────────────────────────────────────────────────

async function analisarComIA(pergunta, contextoDasNotas) {
  const mensagens = [
    {
      role: "system",
      content: `Você é um assistente especialista em análise de notas do Obsidian.
Você tem acesso ao conteúdo completo da vault do utilizador.
Responda perguntas, faça resumos, identifique padrões, sugira conexões entre notas e ajude a continuar tarefas.
Responda sempre em português de forma clara e organizada.
Use Markdown para formatar a resposta quando útil.`,
    },
    {
      role: "user",
      content: `Aqui estão as minhas notas do Obsidian:\n${contextoDasNotas}\n\n---\n\nPergunta/Tarefa: ${pergunta}`,
    },
  ];

  const resposta = await client.chat.completions.create({
    model: "gpt-4o",
    messages: mensagens,
    temperature: 0.5,
    max_tokens: 2000,
  });

  return resposta.choices[0].message.content;
}

// ─── ENTRADA PRINCIPAL ─────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════╗");
console.log("║       LEITOR DE OBSIDIAN COM IA          ║");
console.log("║  Analisa, resume e conecta as suas notas ║");
console.log("╚══════════════════════════════════════════╝\n");

// Caminho da vault (do .env ou padrão)
const pastaVault = process.env.OBSIDIAN_PATH || "./vault-teste";

console.log(`📂 Vault do Obsidian: ${pastaVault}`);

// Cria uma vault de teste se não existir (para demonstração)
if (!fs.existsSync(pastaVault)) {
  console.log("\n⚠️  Pasta do Obsidian não encontrada.");
  console.log("   Criando vault de exemplo para demonstração...\n");
  fs.mkdirSync(pastaVault, { recursive: true });

  // Notas de exemplo
  fs.writeFileSync(
    path.join(pastaVault, "Projeto Atalaia.md"),
    `# Projeto Atalaia\n\n## Objetivo\nSistema operacional pastoral para a Rede Amor a Dois.\n\n## Tarefas Pendentes\n- [ ] Implementar dashboard do líder de célula\n- [ ] Corrigir validação de telefone no whatsapp.ts\n- [ ] Criar testes unitários\n- [ ] Melhorar a função normalizePhone\n\n## Notas\nO sistema usa React + Vite + Supabase. A IA é integrada via edge functions do Supabase.\n`,
    "utf-8"
  );

  fs.writeFileSync(
    path.join(pastaVault, "Ideias de Código.md"),
    `# Ideias de Código\n\n## Agentes de IA\n- Criar um agente que lê emails e cria tarefas\n- Agente que monitora o GitHub e resume PRs\n- Agente que analisa métricas e gera relatórios\n\n## Automações\n- Script para backup automático das notas\n- Integração com Google Calendar\n- Notificações via WhatsApp\n`,
    "utf-8"
  );

  fs.writeFileSync(
    path.join(pastaVault, "Aprendizados.md"),
    `# Aprendizados\n\n## Node.js\n- ES Modules: usar "type": "module" no package.json\n- Para usar import/export, o ficheiro deve ser .mjs ou ter type:module\n\n## OpenAI API\n- Modelos: gpt-4o (melhor), gpt-4o-mini (mais rápido e barato)\n- Tool calling permite criar agentes autónomos\n- Manter histórico de mensagens para contexto\n`,
    "utf-8"
  );

  console.log("✅ Vault de exemplo criada com 3 notas de demonstração.\n");
}

const notas = lerVaultObsidian(pastaVault);

if (!notas || notas.length === 0) {
  console.log("❌ Nenhuma nota .md encontrada na vault.");
  rl.close();
  process.exit(1);
}

console.log(`✅ ${notas.length} nota(s) carregada(s) da vault.\n`);
console.log("Exemplos do que pode perguntar:");
console.log('  "Resume todas as minhas notas"');
console.log('  "Quais são as tarefas pendentes?"');
console.log('  "O que eu aprendi sobre Node.js?"');
console.log('  "Que ideias tenho para agentes de IA?"');
console.log('  "Continua a tarefa do Projeto Atalaia"');
console.log("\n─────────────────────────────────────────────\n");

const contextoDasNotas = formatarNotasParaIA(notas);

const perguntar = () => {
  rl.question("Você: ", async (pergunta) => {
    if (!pergunta.trim()) {
      perguntar();
      return;
    }

    if (pergunta.toLowerCase() === "sair") {
      console.log("\n👋 Até logo!\n");
      rl.close();
      return;
    }

    try {
      console.log("\n🤖 Analisando as suas notas...\n");
      const resposta = await analisarComIA(pergunta.trim(), contextoDasNotas);
      console.log("Assistente:", resposta);
      console.log("\n─────────────────────────────────────────────\n");
    } catch (erro) {
      if (erro.status === 401) {
        console.error("\n❌ Chave da OpenAI inválida. Verifique o ficheiro .env\n");
      } else {
        console.error("\n❌ Erro:", erro.message, "\n");
      }
    }

    perguntar();
  });
};

perguntar();
