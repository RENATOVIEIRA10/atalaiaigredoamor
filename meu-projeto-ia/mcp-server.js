/**
 * SERVIDOR MCP — Conecta o teu projecto de IA ao Claude Code (terminal)
 *
 * Após registar este servidor no Claude Code com o comando abaixo,
 * o Claude vai ter acesso a todas as ferramentas deste projecto
 * directamente nas tuas conversas no terminal.
 *
 * COMANDO PARA REGISTAR (corre UMA VEZ no terminal):
 *
 *   claude mcp add meu-projeto-ia -- node C:\Users\R E N A T O\meu-projeto-ia\mcp-server.js
 *
 * FERRAMENTAS DISPONÍVEIS PARA O CLAUDE:
 *   - perguntar_openai   → Consulta o GPT-4o e retorna a resposta
 *   - criar_ficheiro     → Cria um ficheiro com código ou texto
 *   - ler_ficheiro       → Lê o conteúdo de um ficheiro
 *   - listar_ficheiros   → Lista os ficheiros da pasta do projecto
 *   - guardar_nota       → Guarda uma nota em Markdown
 *   - ler_obsidian       → Lê as notas da tua vault do Obsidian
 *   - executar_agente    → Executa o agente autónomo com GPT-4o
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Carrega o .env do directório onde este ficheiro está
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── CRIAR SERVIDOR MCP ────────────────────────────────────────────────────

const server = new McpServer({
  name: "meu-projeto-ia",
  version: "1.0.0",
});

// ─── FERRAMENTA 1: Perguntar ao GPT-4o ────────────────────────────────────

server.tool(
  "perguntar_openai",
  "Faz uma pergunta ao GPT-4o da OpenAI. Use para obter uma segunda opinião, comparar respostas ou quando precisar de uma resposta rápida.",
  {
    pergunta: z.string().describe("A pergunta ou tarefa para o GPT-4o"),
    contexto: z.string().optional().describe("Contexto adicional opcional"),
  },
  async ({ pergunta, contexto }) => {
    try {
      const resposta = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especialista em programação e produtividade. Responda em português de forma clara e directa.",
          },
          {
            role: "user",
            content: contexto ? `Contexto: ${contexto}\n\nPergunta: ${pergunta}` : pergunta,
          },
        ],
        temperature: 0.7,
      });

      return {
        content: [
          {
            type: "text",
            text: `**GPT-4o responde:**\n\n${resposta.choices[0].message.content}`,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro ao consultar GPT-4o: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 2: Criar ficheiro ─────────────────────────────────────────

server.tool(
  "criar_ficheiro",
  "Cria um ficheiro com o nome e conteúdo especificados na pasta do projecto de IA. Ideal para guardar código gerado.",
  {
    nome: z.string().describe("Nome do ficheiro, ex: app.js, script.py, notas.md"),
    conteudo: z.string().describe("Conteúdo completo do ficheiro"),
  },
  async ({ nome, conteudo }) => {
    try {
      const caminho = path.join(__dirname, nome);
      fs.writeFileSync(caminho, conteudo, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `✅ Ficheiro **${nome}** criado com sucesso!\nLocalização: \`${caminho}\`\nTamanho: ${conteudo.length} caracteres`,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro ao criar ficheiro: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 3: Ler ficheiro ────────────────────────────────────────────

server.tool(
  "ler_ficheiro",
  "Lê o conteúdo de um ficheiro existente na pasta do projecto de IA.",
  {
    nome: z.string().describe("Nome do ficheiro a ler, ex: index.js"),
  },
  async ({ nome }) => {
    try {
      const caminho = path.join(__dirname, nome);
      if (!fs.existsSync(caminho)) {
        return {
          content: [{ type: "text", text: `❌ Ficheiro "${nome}" não encontrado em:\n${__dirname}` }],
          isError: true,
        };
      }
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `📄 **${nome}**\n\n\`\`\`\n${conteudo}\n\`\`\``,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro ao ler ficheiro: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 4: Listar ficheiros ───────────────────────────────────────

server.tool(
  "listar_ficheiros",
  "Lista todos os ficheiros e pastas do projecto de IA.",
  {},
  async () => {
    try {
      const itens = fs.readdirSync(__dirname).filter(
        (i) => i !== "node_modules" && !i.startsWith(".")
      );
      const lista = itens
        .map((item) => {
          const stat = fs.statSync(path.join(__dirname, item));
          return `${stat.isDirectory() ? "📁" : "📄"} ${item}`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📂 **Projecto em:** ${__dirname}\n\n${lista}`,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 5: Guardar nota ────────────────────────────────────────────

server.tool(
  "guardar_nota",
  "Guarda uma nota, resumo ou resultado de tarefa em formato Markdown na pasta /notas do projecto.",
  {
    titulo: z.string().describe("Título da nota"),
    conteudo: z.string().describe("Conteúdo da nota em Markdown"),
  },
  async ({ titulo, conteudo }) => {
    try {
      const pasta = path.join(__dirname, "notas");
      if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });

      const nomeArquivo = titulo
        .replace(/[<>:"/\\|?*]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 80);
      const caminho = path.join(pasta, `${nomeArquivo}.md`);
      const texto = `# ${titulo}\n\n${conteudo}\n\n---\n_Guardado em: ${new Date().toLocaleString("pt-BR")}_\n`;

      fs.writeFileSync(caminho, texto, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `✅ Nota **"${titulo}"** guardada em:\n\`${caminho}\``,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro ao guardar nota: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 6: Ler Obsidian ────────────────────────────────────────────

server.tool(
  "ler_obsidian",
  "Lê as notas da vault do Obsidian. Pode listar todas as notas ou ler uma nota específica pelo nome.",
  {
    nota: z
      .string()
      .optional()
      .describe("Nome (parcial) de uma nota específica. Se omitido, lista todas as notas disponíveis."),
  },
  async ({ nota }) => {
    try {
      const pastaVault = process.env.OBSIDIAN_PATH || path.join(__dirname, "vault-teste");

      if (!fs.existsSync(pastaVault)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Vault do Obsidian não encontrada em:\n${pastaVault}\n\nConfigura o caminho no ficheiro .env:\nOBSIDIAN_PATH=C:\\Users\\R E N A T O\\Documents\\ObsidianVault`,
            },
          ],
          isError: true,
        };
      }

      const notas = [];
      function lerRecursivo(pasta) {
        for (const item of fs.readdirSync(pasta)) {
          const caminho = path.join(pasta, item);
          const stat = fs.statSync(caminho);
          if (stat.isDirectory() && !item.startsWith(".")) lerRecursivo(caminho);
          else if (item.endsWith(".md")) {
            notas.push({
              nome: item.replace(".md", ""),
              conteudo: fs.readFileSync(caminho, "utf-8"),
            });
          }
        }
      }
      lerRecursivo(pastaVault);

      if (notas.length === 0) {
        return {
          content: [{ type: "text", text: "❌ Nenhuma nota .md encontrada na vault." }],
          isError: true,
        };
      }

      if (nota) {
        const encontrada = notas.find((n) =>
          n.nome.toLowerCase().includes(nota.toLowerCase())
        );
        if (!encontrada) {
          const lista = notas.map((n) => `- ${n.nome}`).join("\n");
          return {
            content: [
              {
                type: "text",
                text: `❌ Nota "${nota}" não encontrada.\n\nNotas disponíveis:\n${lista}`,
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `📝 **${encontrada.nome}**\n\n${encontrada.conteudo}`,
            },
          ],
        };
      }

      // Lista todas com prévia
      const lista = notas
        .map((n) => {
          const previa = n.conteudo.split("\n").filter((l) => l.trim()).slice(0, 2).join(" — ");
          return `**${n.nome}**: ${previa.slice(0, 100)}...`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `📚 **${notas.length} nota(s) na vault:**\n\n${lista}\n\n_Usa a ferramenta com o nome de uma nota para ver o conteúdo completo._`,
          },
        ],
      };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro ao ler Obsidian: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── FERRAMENTA 7: Executar agente GPT-4o ─────────────────────────────────

server.tool(
  "executar_agente",
  "Executa o agente autónomo com GPT-4o para tarefas complexas que envolvem criar múltiplos ficheiros ou executar várias etapas automaticamente.",
  {
    tarefa: z.string().describe("Descrição detalhada da tarefa para o agente executar"),
  },
  async ({ tarefa }) => {
    try {
      const mensagens = [
        {
          role: "system",
          content:
            "Você é um agente autónomo especialista em programação. Execute a tarefa passo a passo, criando os ficheiros necessários. Responda em português.",
        },
        { role: "user", content: tarefa },
      ];

      const ferramentasAgente = [
        {
          type: "function",
          function: {
            name: "criar_ficheiro",
            description: "Cria um ficheiro com o nome e conteúdo especificados.",
            parameters: {
              type: "object",
              properties: {
                nome: { type: "string" },
                conteudo: { type: "string" },
              },
              required: ["nome", "conteudo"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "listar_ficheiros",
            description: "Lista os ficheiros na pasta do projecto.",
            parameters: { type: "object", properties: {} },
          },
        },
      ];

      let log = `🚀 **Agente iniciado:** "${tarefa}"\n\n`;
      let passos = 0;

      while (passos < 8) {
        passos++;
        const resposta = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: mensagens,
          tools: ferramentasAgente,
          tool_choice: "auto",
        });

        const msg = resposta.choices[0].message;
        mensagens.push(msg);

        if (msg.tool_calls?.length > 0) {
          for (const chamada of msg.tool_calls) {
            const args = JSON.parse(chamada.function.arguments);
            log += `🔧 **Passo ${passos}:** \`${chamada.function.name}\``;
            if (args.nome) log += ` → \`${args.nome}\``;
            log += "\n";

            let resultado = "";
            if (chamada.function.name === "criar_ficheiro") {
              fs.writeFileSync(path.join(__dirname, args.nome), args.conteudo, "utf-8");
              resultado = `✅ Ficheiro "${args.nome}" criado.`;
              log += `   ${resultado}\n`;
            } else if (chamada.function.name === "listar_ficheiros") {
              resultado = fs
                .readdirSync(__dirname)
                .filter((f) => f !== "node_modules")
                .join(", ");
            }
            mensagens.push({ role: "tool", tool_call_id: chamada.id, content: resultado });
          }
          continue;
        }

        if (msg.content) {
          log += `\n✅ **Concluído:**\n\n${msg.content}`;
          break;
        }
        if (resposta.choices[0].finish_reason === "stop") break;
      }

      return { content: [{ type: "text", text: log }] };
    } catch (erro) {
      return {
        content: [{ type: "text", text: `❌ Erro no agente: ${erro.message}` }],
        isError: true,
      };
    }
  }
);

// ─── INICIAR SERVIDOR ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
