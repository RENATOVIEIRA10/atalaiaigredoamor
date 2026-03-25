# ============================================================
# SCRIPT DE INSTALAÇÃO AUTOMÁTICA — MEU PROJETO IA
# Cole este script inteiro no PowerShell e pressione Enter
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CRIANDO O SEU PROJETO DE IA LOCAL       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Criar a pasta do projeto
$pasta = "C:\Users\$env:USERNAME\meu-projeto-ia"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
Set-Location $pasta
Write-Host "✅ Pasta criada: $pasta" -ForegroundColor Green

# ─── FICHEIRO: package.json ───────────────────────────────
$packageJson = @'
{
  "name": "meu-projeto-ia",
  "version": "1.0.0",
  "type": "module",
  "description": "Assistente de IA local com OpenAI",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "agente": "node agente.js",
    "obsidian": "node obsidian.js"
  },
  "dependencies": {
    "openai": "^4.67.0",
    "dotenv": "^16.4.5",
    "fs-extra": "^11.2.0"
  }
}
'@
Set-Content -Path "$pasta\package.json" -Value $packageJson -Encoding UTF8
Write-Host "✅ package.json criado" -ForegroundColor Green

# ─── FICHEIRO: .env ──────────────────────────────────────
$envFile = @'
# Cole aqui a sua chave da OpenAI
# Obtenha em: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-COLE_SUA_CHAVE_AQUI

# Caminho da sua vault do Obsidian (opcional)
OBSIDIAN_PATH=C:\Users\RENATO\Documents\ObsidianVault
'@
Set-Content -Path "$pasta\.env" -Value $envFile -Encoding UTF8
Write-Host "✅ .env criado (lembre-se de colocar a sua chave OpenAI)" -ForegroundColor Yellow

# ─── FICHEIRO: .gitignore ─────────────────────────────────
$gitignore = @'
node_modules/
.env
historico.json
notas/
vault-teste/
'@
Set-Content -Path "$pasta\.gitignore" -Value $gitignore -Encoding UTF8
Write-Host "✅ .gitignore criado" -ForegroundColor Green

# ─── FICHEIRO: index.js ──────────────────────────────────
$indexJs = @'
import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HISTORICO_FILE = "./historico.json";

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

async function chat(mensagens) {
  const resposta = await client.chat.completions.create({
    model: "gpt-4o",
    messages: mensagens,
    temperature: 0.7,
  });
  return resposta.choices[0].message.content;
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

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

      mensagens.push({ role: "user", content: texto });
      const mensagensComSistema = [sistemaPrompt, ...mensagens];

      try {
        process.stdout.write("\n🤖 Assistente: ");
        const resposta = await chat(mensagensComSistema);
        console.log(resposta);
        console.log("\n─────────────────────────────────────────────\n");
        mensagens.push({ role: "assistant", content: resposta });
        guardarHistorico(mensagens);
      } catch (erro) {
        if (erro.status === 401) {
          console.error("\n❌ Chave da OpenAI inválida.");
          console.error("   Abra o ficheiro .env e cole a sua chave em OPENAI_API_KEY\n");
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
'@
Set-Content -Path "$pasta\index.js" -Value $indexJs -Encoding UTF8
Write-Host "✅ index.js criado (chatbot com memória)" -ForegroundColor Green

# ─── FICHEIRO: agente.js ─────────────────────────────────
$agenteJs = @'
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import readline from "readline";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function criarFicheiro(nome, conteudo) {
  fs.writeFileSync(nome, conteudo, "utf-8");
  return `✅ Ficheiro "${nome}" criado com sucesso.`;
}

function lerFicheiro(nome) {
  if (!fs.existsSync(nome)) return `❌ Ficheiro "${nome}" não encontrado.`;
  return fs.readFileSync(nome, "utf-8");
}

function listarFicheiros() {
  return fs.readdirSync("./").join("\n");
}

function guardarNota(titulo, conteudo) {
  const pasta = "./notas";
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta);
  const nome = `${pasta}/${titulo.replace(/\s+/g, "_")}.md`;
  const texto = `# ${titulo}\n\n${conteudo}\n\n_Criado em: ${new Date().toLocaleString("pt-BR")}_\n`;
  fs.writeFileSync(nome, texto, "utf-8");
  return `✅ Nota "${titulo}" guardada em ${nome}`;
}

const ferramentas = {
  criar_ficheiro: ({ nome, conteudo }) => criarFicheiro(nome, conteudo),
  ler_ficheiro: ({ nome }) => lerFicheiro(nome),
  listar_ficheiros: () => listarFicheiros(),
  guardar_nota: ({ titulo, conteudo }) => guardarNota(titulo, conteudo),
};

const definicaoFerramentas = [
  {
    type: "function",
    function: {
      name: "criar_ficheiro",
      description: "Cria um ficheiro com o nome e conteúdo especificados.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do ficheiro, ex: app.js" },
          conteudo: { type: "string", description: "Conteúdo completo do ficheiro" },
        },
        required: ["nome", "conteudo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ler_ficheiro",
      description: "Lê o conteúdo de um ficheiro existente.",
      parameters: {
        type: "object",
        properties: { nome: { type: "string" } },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_ficheiros",
      description: "Lista todos os ficheiros na pasta atual.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_nota",
      description: "Guarda uma nota em formato Markdown.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          conteudo: { type: "string" },
        },
        required: ["titulo", "conteudo"],
      },
    },
  },
];

async function executarAgente(tarefa) {
  console.log(`\n🚀 Agente iniciado para: "${tarefa}"\n`);
  console.log("─────────────────────────────────────────────");

  const mensagens = [
    {
      role: "system",
      content: `Você é um agente de IA autónomo especialista em programação.
Use as ferramentas disponíveis para executar a tarefa do utilizador.
Pense passo a passo e informe o progresso. Responda em português.`,
    },
    { role: "user", content: tarefa },
  ];

  let passos = 0;
  while (passos < 10) {
    passos++;
    console.log(`\n🔄 Passo ${passos}...`);

    const resposta = await client.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      tools: definicaoFerramentas,
      tool_choice: "auto",
    });

    const msg = resposta.choices[0].message;
    mensagens.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const chamada of msg.tool_calls) {
        const nome = chamada.function.name;
        const args = JSON.parse(chamada.function.arguments);
        console.log(`\n🔧 Ferramenta: ${nome}`);
        if (args.nome) console.log(`   Ficheiro: ${args.nome}`);
        const resultado = ferramentas[nome] ? ferramentas[nome](args) : `❌ Ferramenta não encontrada.`;
        console.log(`   ${resultado.split("\n")[0]}`);
        mensagens.push({ role: "tool", tool_call_id: chamada.id, content: resultado });
      }
      continue;
    }

    if (msg.content) {
      console.log("\n─────────────────────────────────────────────");
      console.log("\n✅ Agente concluiu:\n");
      console.log(msg.content);
      console.log("\n─────────────────────────────────────────────\n");
      break;
    }
    if (resposta.choices[0].finish_reason === "stop") break;
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════╗");
console.log("║          AGENTE DE IA AUTÓNOMO           ║");
console.log("║  Cria código, ficheiros e notas          ║");
console.log("╚══════════════════════════════════════════╝\n");
console.log('Exemplo: "Cria um servidor Express simples em Node.js"\n');
console.log("─────────────────────────────────────────────\n");

rl.question("Qual é a tarefa para o agente? ", async (tarefa) => {
  if (!tarefa.trim()) { console.log("❌ Nenhuma tarefa fornecida."); rl.close(); return; }
  try {
    await executarAgente(tarefa.trim());
  } catch (erro) {
    if (erro.status === 401) console.error("\n❌ Chave da OpenAI inválida. Verifique o ficheiro .env\n");
    else console.error("\n❌ Erro:", erro.message, "\n");
  }
  rl.close();
});
'@
Set-Content -Path "$pasta\agente.js" -Value $agenteJs -Encoding UTF8
Write-Host "✅ agente.js criado (agente autónomo)" -ForegroundColor Green

# ─── FICHEIRO: obsidian.js ────────────────────────────────
$obsidianJs = @'
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import readline from "readline";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function lerVaultObsidian(pastaVault) {
  if (!fs.existsSync(pastaVault)) return null;
  const notas = [];
  function lerRecursivo(pasta) {
    const itens = fs.readdirSync(pasta);
    for (const item of itens) {
      const caminho = path.join(pasta, item);
      const stat = fs.statSync(caminho);
      if (stat.isDirectory() && !item.startsWith(".")) lerRecursivo(caminho);
      else if (item.endsWith(".md")) {
        notas.push({ nome: item.replace(".md", ""), conteudo: fs.readFileSync(caminho, "utf-8") });
      }
    }
  }
  lerRecursivo(pastaVault);
  return notas;
}

function formatarNotas(notas, maxChars = 80000) {
  let texto = "";
  let total = 0;
  for (const nota of notas) {
    const bloco = `\n\n## NOTA: ${nota.nome}\n${nota.conteudo}\n`;
    if (total + bloco.length > maxChars) { texto += `\n\n[... limite atingido, ${notas.length} notas no total ...]`; break; }
    texto += bloco;
    total += bloco.length;
  }
  return texto;
}

async function analisarComIA(pergunta, contexto) {
  const resposta = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Você é um assistente especialista em análise de notas do Obsidian.
Responda perguntas, faça resumos, identifique padrões e ajude a continuar tarefas.
Responda em português com Markdown quando útil.`,
      },
      { role: "user", content: `Notas do Obsidian:\n${contexto}\n\n---\n\nPergunta: ${pergunta}` },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  });
  return resposta.choices[0].message.content;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════╗");
console.log("║       LEITOR DE OBSIDIAN COM IA          ║");
console.log("╚══════════════════════════════════════════╝\n");

const pastaVault = process.env.OBSIDIAN_PATH || "./vault-teste";
console.log(`📂 Vault: ${pastaVault}`);

if (!fs.existsSync(pastaVault)) {
  console.log("\n⚠️  Pasta não encontrada. Criando vault de exemplo...\n");
  fs.mkdirSync(pastaVault, { recursive: true });
  fs.writeFileSync(path.join(pastaVault, "Tarefas.md"), `# Tarefas\n\n- [ ] Configurar projeto de IA\n- [ ] Aprender sobre agentes\n- [ ] Integrar com Obsidian\n`, "utf-8");
  fs.writeFileSync(path.join(pastaVault, "Ideias.md"), `# Ideias\n\n## Projetos\n- Agente que lê emails\n- Automação de relatórios\n- Chatbot para o Atalaia\n`, "utf-8");
  console.log("✅ Vault de exemplo criada com 2 notas.\n");
}

const notas = lerVaultObsidian(pastaVault);
if (!notas || notas.length === 0) { console.log("❌ Nenhuma nota encontrada."); rl.close(); process.exit(1); }

console.log(`✅ ${notas.length} nota(s) carregada(s).\n`);
console.log('Exemplos: "Resume todas as notas" | "Quais são as tarefas?" | "sair"');
console.log("─────────────────────────────────────────────\n");

const contexto = formatarNotas(notas);

const perguntar = () => {
  rl.question("Você: ", async (pergunta) => {
    if (!pergunta.trim()) { perguntar(); return; }
    if (pergunta.toLowerCase() === "sair") { console.log("\n👋 Até logo!\n"); rl.close(); return; }
    try {
      console.log("\n🤖 Analisando...\n");
      const resposta = await analisarComIA(pergunta.trim(), contexto);
      console.log("Assistente:", resposta);
      console.log("\n─────────────────────────────────────────────\n");
    } catch (erro) {
      if (erro.status === 401) console.error("\n❌ Chave inválida. Verifique o .env\n");
      else console.error("\n❌ Erro:", erro.message, "\n");
    }
    perguntar();
  });
};

perguntar();
'@
Set-Content -Path "$pasta\obsidian.js" -Value $obsidianJs -Encoding UTF8
Write-Host "✅ obsidian.js criado (leitor de Obsidian)" -ForegroundColor Green

# ─── INSTALAR DEPENDÊNCIAS ────────────────────────────────
Write-Host ""
Write-Host "📦 Instalando dependências (npm install)..." -ForegroundColor Cyan
npm install
Write-Host ""

# ─── RESULTADO FINAL ─────────────────────────────────────
Write-Host "============================================" -ForegroundColor Green
Write-Host "   PROJETO CRIADO COM SUCESSO!             " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Localização: $pasta" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  PRÓXIMO PASSO OBRIGATÓRIO:" -ForegroundColor Yellow
Write-Host "   Abra o ficheiro .env e substitua:" -ForegroundColor Yellow
Write-Host "   sk-COLE_SUA_CHAVE_AQUI  →  pela sua chave real da OpenAI" -ForegroundColor Yellow
Write-Host "   Obtenha em: https://platform.openai.com/api-keys" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 COMANDOS PARA USAR:" -ForegroundColor Cyan
Write-Host "   node index.js    → Chatbot com memória" -ForegroundColor White
Write-Host "   node agente.js   → Agente que cria código" -ForegroundColor White
Write-Host "   node obsidian.js → Leitor de notas Obsidian" -ForegroundColor White
Write-Host ""
