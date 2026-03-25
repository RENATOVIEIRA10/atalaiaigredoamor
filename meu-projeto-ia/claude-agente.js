import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import fs from "fs";
import readline from "readline";

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── FERRAMENTAS DO AGENTE ─────────────────────────────────────────────────

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

// Definição das ferramentas no formato da API do Claude
const definicaoFerramentas = [
  {
    name: "criar_ficheiro",
    description: "Cria um ficheiro com o nome e conteúdo especificados. Use para guardar código gerado.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do ficheiro, ex: app.js, script.py" },
        conteudo: { type: "string", description: "Conteúdo completo do ficheiro" },
      },
      required: ["nome", "conteudo"],
    },
  },
  {
    name: "ler_ficheiro",
    description: "Lê o conteúdo de um ficheiro existente.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do ficheiro a ler" },
      },
      required: ["nome"],
    },
  },
  {
    name: "listar_ficheiros",
    description: "Lista todos os ficheiros na pasta atual do projeto.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "guardar_nota",
    description: "Guarda uma nota ou resumo de tarefa em formato Markdown.",
    input_schema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Título da nota" },
        conteudo: { type: "string", description: "Conteúdo da nota em Markdown" },
      },
      required: ["titulo", "conteudo"],
    },
  },
];

// ─── LOOP DO AGENTE ────────────────────────────────────────────────────────

async function executarAgente(tarefa) {
  console.log(`\n🚀 Agente Claude iniciado para: "${tarefa}"\n`);
  console.log("─────────────────────────────────────────────");

  const sistemaPrompt = `Você é um agente de IA autónomo especialista em programação.
Use as ferramentas disponíveis para criar ficheiros, ler código e guardar notas.
Execute a tarefa do utilizador de forma autónoma, passo a passo.
Informe o utilizador do progresso em cada etapa. Responda em português.`;

  const mensagens = [{ role: "user", content: tarefa }];

  let passos = 0;
  const MAX_PASSOS = 10;

  while (passos < MAX_PASSOS) {
    passos++;
    console.log(`\n🔄 Passo ${passos}...`);

    const resposta = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: sistemaPrompt,
      tools: definicaoFerramentas,
      messages: mensagens,
    });

    // Adiciona a resposta do assistente ao histórico
    mensagens.push({ role: "assistant", content: resposta.content });

    // Verifica se o Claude quer usar ferramentas
    const usoFerramentas = resposta.content.filter((b) => b.type === "tool_use");
    const textos = resposta.content.filter((b) => b.type === "text");

    // Mostra texto de raciocínio do Claude
    if (textos.length > 0) {
      for (const bloco of textos) {
        if (bloco.text.trim()) {
          console.log(`\n💭 Claude: ${bloco.text}`);
        }
      }
    }

    // Executa as ferramentas solicitadas
    if (usoFerramentas.length > 0) {
      const resultadosFerramentas = [];

      for (const chamada of usoFerramentas) {
        console.log(`\n🔧 Ferramenta: ${chamada.name}`);
        if (chamada.input.nome) console.log(`   Ficheiro: ${chamada.input.nome}`);
        if (chamada.input.titulo) console.log(`   Nota: ${chamada.input.titulo}`);

        const resultado = ferramentas[chamada.name]
          ? ferramentas[chamada.name](chamada.input)
          : `❌ Ferramenta "${chamada.name}" não encontrada.`;

        console.log(`   ${resultado.split("\n")[0]}`);

        resultadosFerramentas.push({
          type: "tool_result",
          tool_use_id: chamada.id,
          content: resultado,
        });
      }

      // Devolve os resultados ao Claude
      mensagens.push({ role: "user", content: resultadosFerramentas });
      continue;
    }

    // Se o Claude terminou (sem mais ferramentas)
    if (resposta.stop_reason === "end_turn") {
      console.log("\n─────────────────────────────────────────────");
      console.log("\n✅ Agente Claude concluiu a tarefa!\n");
      console.log("─────────────────────────────────────────────\n");
      break;
    }
  }
}

// ─── ENTRADA PRINCIPAL ─────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════╗");
console.log("║       AGENTE CLAUDE AUTÓNOMO             ║");
console.log("║  Cria código, ficheiros e notas          ║");
console.log("╚══════════════════════════════════════════╝\n");
console.log('Exemplo: "Cria um servidor Express simples em Node.js"\n');
console.log("─────────────────────────────────────────────\n");

rl.question("Qual é a tarefa para o agente Claude? ", async (tarefa) => {
  if (!tarefa.trim()) {
    console.log("❌ Nenhuma tarefa fornecida.");
    rl.close();
    return;
  }
  try {
    await executarAgente(tarefa.trim());
  } catch (erro) {
    if (erro.status === 401) {
      console.error("\n❌ Chave da Anthropic inválida. Verifique o ficheiro .env\n");
    } else {
      console.error("\n❌ Erro:", erro.message, "\n");
    }
  }
  rl.close();
});
