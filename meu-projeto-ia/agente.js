import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import readline from "readline";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── FERRAMENTAS DO AGENTE ─────────────────────────────────────────────────

// Ferramenta: Criar ficheiro com código
function criarFicheiro(nome, conteudo) {
  fs.writeFileSync(nome, conteudo, "utf-8");
  return `✅ Ficheiro "${nome}" criado com sucesso.`;
}

// Ferramenta: Ler ficheiro
function lerFicheiro(nome) {
  if (!fs.existsSync(nome)) return `❌ Ficheiro "${nome}" não encontrado.`;
  return fs.readFileSync(nome, "utf-8");
}

// Ferramenta: Listar ficheiros na pasta atual
function listarFicheiros() {
  const ficheiros = fs.readdirSync("./");
  return ficheiros.join("\n");
}

// Ferramenta: Guardar notas/tarefas
function guardarNota(titulo, conteudo) {
  const pasta = "./notas";
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta);
  const nome = `${pasta}/${titulo.replace(/\s+/g, "_")}.md`;
  const texto = `# ${titulo}\n\n${conteudo}\n\n_Criado em: ${new Date().toLocaleString("pt-BR")}_\n`;
  fs.writeFileSync(nome, texto, "utf-8");
  return `✅ Nota "${titulo}" guardada em ${nome}`;
}

// Mapa de ferramentas disponíveis para o agente
const ferramentas = {
  criar_ficheiro: ({ nome, conteudo }) => criarFicheiro(nome, conteudo),
  ler_ficheiro: ({ nome }) => lerFicheiro(nome),
  listar_ficheiros: () => listarFicheiros(),
  guardar_nota: ({ titulo, conteudo }) => guardarNota(titulo, conteudo),
};

// Definição das ferramentas para a OpenAI
const definicaoFerramentas = [
  {
    type: "function",
    function: {
      name: "criar_ficheiro",
      description: "Cria um ficheiro com o nome e conteúdo especificados. Use para guardar código gerado.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do ficheiro, ex: app.js, script.py" },
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
        properties: {
          nome: { type: "string", description: "Nome do ficheiro a ler" },
        },
        required: ["nome"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_ficheiros",
      description: "Lista todos os ficheiros na pasta atual do projeto.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "guardar_nota",
      description: "Guarda uma nota ou resumo de tarefa em formato Markdown.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título da nota" },
          conteudo: { type: "string", description: "Conteúdo da nota em Markdown" },
        },
        required: ["titulo", "conteudo"],
      },
    },
  },
];

// ─── LOOP DO AGENTE ────────────────────────────────────────────────────────

async function executarAgente(tarefa) {
  console.log(`\n🚀 Agente iniciado para a tarefa:\n"${tarefa}"\n`);
  console.log("─────────────────────────────────────────────");

  const mensagens = [
    {
      role: "system",
      content: `Você é um agente de IA autónomo e especialista em programação.
Você tem acesso a ferramentas para criar ficheiros, ler código e guardar notas.
Execute a tarefa do utilizador de forma autónoma, usando as ferramentas disponíveis quando necessário.
Pense passo a passo, execute as ações necessárias e informe o utilizador do progresso.
Responda sempre em português.`,
    },
    { role: "user", content: tarefa },
  ];

  let passos = 0;
  const MAX_PASSOS = 10;

  while (passos < MAX_PASSOS) {
    passos++;
    console.log(`\n🔄 Passo ${passos}...`);

    const resposta = await client.chat.completions.create({
      model: "gpt-4o",
      messages: mensagens,
      tools: definicaoFerramentas,
      tool_choice: "auto",
    });

    const mensagemAssistente = resposta.choices[0].message;
    mensagens.push(mensagemAssistente);

    // Se o agente quer usar uma ferramenta
    if (mensagemAssistente.tool_calls && mensagemAssistente.tool_calls.length > 0) {
      for (const chamada of mensagemAssistente.tool_calls) {
        const nomeFerramenta = chamada.function.name;
        const args = JSON.parse(chamada.function.arguments);

        console.log(`\n🔧 Usando ferramenta: ${nomeFerramenta}`);
        if (args.nome) console.log(`   Ficheiro: ${args.nome}`);
        if (args.titulo) console.log(`   Nota: ${args.titulo}`);

        const resultado = ferramentas[nomeFerramenta]
          ? ferramentas[nomeFerramenta](args)
          : `❌ Ferramenta "${nomeFerramenta}" não encontrada.`;

        console.log(`   Resultado: ${resultado.split("\n")[0]}`);

        mensagens.push({
          role: "tool",
          tool_call_id: chamada.id,
          content: resultado,
        });
      }
      continue;
    }

    // Se o agente terminou (sem mais ferramentas para usar)
    if (mensagemAssistente.content) {
      console.log("\n─────────────────────────────────────────────");
      console.log("\n✅ Agente concluiu a tarefa:\n");
      console.log(mensagemAssistente.content);
      console.log("\n─────────────────────────────────────────────\n");
      break;
    }

    if (resposta.choices[0].finish_reason === "stop") break;
  }
}

// ─── ENTRADA PRINCIPAL ─────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n╔══════════════════════════════════════════╗");
console.log("║          AGENTE DE IA AUTÓNOMO           ║");
console.log("║  Cria código, ficheiros e notas          ║");
console.log("╚══════════════════════════════════════════╝\n");
console.log("Exemplos de tarefas:");
console.log('  "Cria um script Python que lê um CSV e gera um relatório"');
console.log('  "Cria um servidor Express simples em Node.js"');
console.log('  "Cria um agente de IA que responde perguntas sobre clima"');
console.log("\n─────────────────────────────────────────────\n");

rl.question("Qual é a tarefa para o agente? ", async (tarefa) => {
  if (!tarefa.trim()) {
    console.log("❌ Nenhuma tarefa fornecida.");
    rl.close();
    return;
  }
  try {
    await executarAgente(tarefa.trim());
  } catch (erro) {
    if (erro.status === 401) {
      console.error("\n❌ Chave da OpenAI inválida. Verifique o ficheiro .env\n");
    } else {
      console.error("\n❌ Erro:", erro.message, "\n");
    }
  }
  rl.close();
});
