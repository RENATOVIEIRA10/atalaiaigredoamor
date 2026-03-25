/**
 * SERVIDOR MCP — meu-projeto-ia
 *
 * Filosofia: OpenAI executa TUDO que é rotineiro.
 * Claude Code fica reservado para situações complexas.
 *
 * FERRAMENTAS DISPONÍVEIS:
 *
 * MEMÓRIA & OBSIDIAN
 *   - salvar_memoria        → Salva uma memória/aprendizado no Obsidian
 *   - recuperar_memoria     → Busca memórias relevantes no Obsidian via GPT-4o
 *   - listar_notas          → Lista todas as notas da vault
 *   - ler_nota              → Lê uma nota específica do Obsidian
 *   - atualizar_nota        → Atualiza ou adiciona conteúdo a uma nota existente
 *
 * TAREFAS ROTINEIRAS
 *   - resumir_texto         → Resume qualquer texto com GPT-4o
 *   - gerar_codigo          → Gera código em qualquer linguagem
 *   - explicar_codigo       → Explica o que um trecho de código faz
 *   - revisar_codigo        → Revisa e sugere melhorias num ficheiro
 *   - traduzir_texto        → Traduz texto entre idiomas
 *   - criar_plano           → Cria um plano de acção para uma tarefa
 *   - responder_pergunta    → Responde qualquer pergunta com GPT-4o
 *
 * FICHEIROS
 *   - criar_ficheiro        → Cria um ficheiro no projecto
 *   - ler_ficheiro          → Lê um ficheiro do projecto
 *   - listar_ficheiros      → Lista os ficheiros do projecto
 *
 * AGENTE AUTÓNOMO
 *   - executar_agente       → Agente GPT-4o com acesso ao Obsidian + ficheiros
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

let openai = null;
try {
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("COLE_SUA")) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {}

// Caminho da vault do Obsidian
const VAULT = process.env.OBSIDIAN_PATH || "";

// ─── HELPERS ───────────────────────────────────────────────────────────────

function semOpenAI() {
  return { content: [{ type: "text", text: "❌ OPENAI_API_KEY não configurada no ficheiro .env" }], isError: true };
}

function semVault() {
  return {
    content: [{
      type: "text",
      text: `❌ OBSIDIAN_PATH não configurado no ficheiro .env\n\nAdiciona esta linha ao .env:\nOBSIDIAN_PATH=C:\\Users\\R E N A T O\\Documents\\Obsidian Vault`,
    }],
    isError: true,
  };
}

// Lê todas as notas .md recursivamente da vault
function lerTodasNotas(pasta) {
  const notas = [];
  if (!fs.existsSync(pasta)) return notas;
  for (const item of fs.readdirSync(pasta)) {
    const caminho = path.join(pasta, item);
    try {
      const stat = fs.statSync(caminho);
      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        notas.push(...lerTodasNotas(caminho));
      } else if (item.endsWith(".md")) {
        notas.push({
          nome: item.replace(".md", ""),
          caminho,
          conteudo: fs.readFileSync(caminho, "utf-8"),
        });
      }
    } catch {}
  }
  return notas;
}

async function gpt(mensagens, modelo = "gpt-4o") {
  const r = await openai.chat.completions.create({ model: modelo, messages: mensagens, temperature: 0.7 });
  return r.choices[0].message.content;
}

// ─── SERVIDOR MCP ──────────────────────────────────────────────────────────

const server = new McpServer({ name: "meu-projeto-ia", version: "2.0.0" });

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 1 — MEMÓRIA & OBSIDIAN
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "salvar_memoria",
  "Salva uma memória, aprendizado, decisão ou contexto importante directamente no Obsidian. Use sempre que quiser que algo seja lembrado no futuro.",
  {
    titulo: z.string().describe("Título da memória, ex: 'Decisão sobre arquitectura do projecto X'"),
    conteudo: z.string().describe("O que deve ser lembrado — pode ser texto livre, código, decisões, contexto"),
    tags: z.string().optional().describe("Tags separadas por vírgula, ex: 'projecto, decisão, código'"),
    pasta: z.string().optional().describe("Subpasta dentro da vault onde guardar, ex: 'Memórias/Projectos'. Se omitido, usa 'Memórias'"),
  },
  async ({ titulo, conteudo, tags, pasta }) => {
    if (!VAULT) return semVault();
    try {
      const subpasta = pasta || "Memórias";
      const destino = path.join(VAULT, subpasta);
      if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

      const nomeArquivo = titulo.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 80);
      const caminho = path.join(destino, `${nomeArquivo}.md`);
      const tagStr = tags ? `\ntags: [${tags}]` : "";
      const texto = `---\ncriado: ${new Date().toISOString()}${tagStr}\n---\n\n# ${titulo}\n\n${conteudo}\n`;

      fs.writeFileSync(caminho, texto, "utf-8");
      return {
        content: [{ type: "text", text: `✅ Memória guardada no Obsidian:\n\`${caminho}\`` }],
      };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro ao salvar memória: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "recuperar_memoria",
  "Busca memórias relevantes no Obsidian usando GPT-4o para encontrar e resumir o que é mais pertinente para a tua pergunta.",
  {
    pergunta: z.string().describe("O que queres recuperar ou lembrar, ex: 'Como configurei o servidor MCP?' ou 'Quais decisões tomei sobre o projecto X?'"),
  },
  async ({ pergunta }) => {
    if (!openai) return semOpenAI();
    if (!VAULT) return semVault();
    try {
      const notas = lerTodasNotas(VAULT);
      if (notas.length === 0) {
        return { content: [{ type: "text", text: "❌ Nenhuma nota encontrada na vault do Obsidian." }], isError: true };
      }

      // Envia o índice de notas ao GPT para ele escolher quais são relevantes
      const indice = notas.map((n, i) => `[${i}] ${n.nome}: ${n.conteudo.slice(0, 200)}`).join("\n\n");

      const selecao = await gpt([
        { role: "system", content: "Você é um assistente de recuperação de memória. Analise as notas e identifique quais são relevantes para a pergunta. Responda APENAS com os índices separados por vírgula, ex: 0,3,7" },
        { role: "user", content: `Pergunta: ${pergunta}\n\nNotas disponíveis:\n${indice.slice(0, 12000)}` },
      ]);

      const indices = selecao.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n < notas.length);

      if (indices.length === 0) {
        return { content: [{ type: "text", text: `Não encontrei memórias relevantes para: "${pergunta}"` }] };
      }

      const notasRelevantes = indices.map((i) => `# ${notas[i].nome}\n\n${notas[i].conteudo}`).join("\n\n---\n\n");

      const resposta = await gpt([
        { role: "system", content: "Você é um assistente de memória pessoal. Com base nas notas fornecidas, responda à pergunta de forma clara e directa. Cite as notas relevantes pelo nome." },
        { role: "user", content: `Pergunta: ${pergunta}\n\nNotas relevantes:\n${notasRelevantes}` },
      ]);

      return { content: [{ type: "text", text: `📚 **Memórias recuperadas** (${indices.length} nota(s) relevante(s)):\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro ao recuperar memória: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "listar_notas",
  "Lista todas as notas da vault do Obsidian, organizadas por pasta.",
  {
    pasta: z.string().optional().describe("Subpasta específica para listar. Se omitido, lista tudo."),
  },
  async ({ pasta }) => {
    if (!VAULT) return semVault();
    try {
      const base = pasta ? path.join(VAULT, pasta) : VAULT;
      const notas = lerTodasNotas(base);
      if (notas.length === 0) return { content: [{ type: "text", text: "Nenhuma nota encontrada." }] };

      const lista = notas.map((n) => {
        const relativo = path.relative(VAULT, n.caminho);
        return `📝 ${relativo}`;
      }).join("\n");

      return { content: [{ type: "text", text: `📚 **${notas.length} nota(s) na vault:**\n\n${lista}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ler_nota",
  "Lê o conteúdo completo de uma nota específica do Obsidian.",
  {
    nome: z.string().describe("Nome (parcial) da nota a ler, ex: 'configuração MCP'"),
  },
  async ({ nome }) => {
    if (!VAULT) return semVault();
    try {
      const notas = lerTodasNotas(VAULT);
      const encontrada = notas.find((n) => n.nome.toLowerCase().includes(nome.toLowerCase()));
      if (!encontrada) {
        const lista = notas.map((n) => `- ${n.nome}`).join("\n");
        return { content: [{ type: "text", text: `❌ Nota "${nome}" não encontrada.\n\nNotas disponíveis:\n${lista}` }], isError: true };
      }
      return { content: [{ type: "text", text: `📝 **${encontrada.nome}**\n\n${encontrada.conteudo}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "atualizar_nota",
  "Adiciona conteúdo a uma nota existente no Obsidian, ou cria a nota se não existir.",
  {
    nome: z.string().describe("Nome da nota a actualizar ou criar"),
    conteudo: z.string().describe("Conteúdo a adicionar"),
    modo: z.enum(["adicionar", "substituir"]).optional().describe("'adicionar' acrescenta ao fim (padrão), 'substituir' reescreve a nota"),
    pasta: z.string().optional().describe("Subpasta onde criar a nota se não existir, ex: 'Projectos'"),
  },
  async ({ nome, conteudo, modo, pasta }) => {
    if (!VAULT) return semVault();
    try {
      const notas = lerTodasNotas(VAULT);
      const encontrada = notas.find((n) => n.nome.toLowerCase().includes(nome.toLowerCase()));

      if (encontrada) {
        const novoConteudo = (modo === "substituir")
          ? conteudo
          : `${encontrada.conteudo}\n\n---\n_Actualizado em: ${new Date().toLocaleString("pt-BR")}_\n\n${conteudo}`;
        fs.writeFileSync(encontrada.caminho, novoConteudo, "utf-8");
        return { content: [{ type: "text", text: `✅ Nota **"${encontrada.nome}"** actualizada em:\n\`${encontrada.caminho}\`` }] };
      } else {
        // Cria a nota nova
        const subpasta = pasta || "";
        const destino = subpasta ? path.join(VAULT, subpasta) : VAULT;
        if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
        const nomeArquivo = nome.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 80);
        const caminho = path.join(destino, `${nomeArquivo}.md`);
        const texto = `# ${nome}\n\n${conteudo}\n\n---\n_Criado em: ${new Date().toLocaleString("pt-BR")}_\n`;
        fs.writeFileSync(caminho, texto, "utf-8");
        return { content: [{ type: "text", text: `✅ Nota **"${nome}"** criada em:\n\`${caminho}\`` }] };
      }
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 2 — TAREFAS ROTINEIRAS COM GPT-4o
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "resumir_texto",
  "Resume qualquer texto, artigo, documentação ou conversa usando GPT-4o. Ideal para poupar tempo de leitura.",
  {
    texto: z.string().describe("O texto a resumir"),
    estilo: z.enum(["curto", "detalhado", "bullets", "executivo"]).optional().describe("Estilo do resumo: curto (3 linhas), detalhado, bullets (pontos), executivo (para decisões)"),
  },
  async ({ texto, estilo }) => {
    if (!openai) return semOpenAI();
    try {
      const estilos = {
        curto: "Resume em no máximo 3 frases.",
        detalhado: "Faz um resumo detalhado mantendo os pontos principais.",
        bullets: "Resume em pontos de bullet, máximo 8 pontos.",
        executivo: "Resume para tomada de decisão: contexto, pontos-chave e recomendação.",
      };
      const instrucao = estilos[estilo || "detalhado"];
      const resposta = await gpt([
        { role: "system", content: `Você é um especialista em síntese de informação. ${instrucao} Responda em português.` },
        { role: "user", content: texto },
      ]);
      return { content: [{ type: "text", text: `📋 **Resumo:**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "gerar_codigo",
  "Gera código em qualquer linguagem de programação com base numa descrição. Usa GPT-4o.",
  {
    descricao: z.string().describe("O que o código deve fazer"),
    linguagem: z.string().optional().describe("Linguagem de programação, ex: JavaScript, Python, TypeScript. Padrão: JavaScript"),
    guardar_em: z.string().optional().describe("Nome do ficheiro para guardar o código gerado, ex: app.js"),
  },
  async ({ descricao, linguagem, guardar_em }) => {
    if (!openai) return semOpenAI();
    try {
      const lang = linguagem || "JavaScript";
      const resposta = await gpt([
        { role: "system", content: `Você é um programador sénior especialista em ${lang}. Gere código limpo, comentado e funcional. Responda APENAS com o código, sem explicações antes ou depois.` },
        { role: "user", content: descricao },
      ]);

      if (guardar_em) {
        const caminho = path.join(__dirname, guardar_em);
        const pasta = path.dirname(caminho);
        if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
        fs.writeFileSync(caminho, resposta, "utf-8");
        return { content: [{ type: "text", text: `✅ Código gerado e guardado em \`${caminho}\`:\n\n\`\`\`${lang.toLowerCase()}\n${resposta}\n\`\`\`` }] };
      }

      return { content: [{ type: "text", text: `\`\`\`${lang.toLowerCase()}\n${resposta}\n\`\`\`` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "explicar_codigo",
  "Explica o que um trecho de código faz, em linguagem simples. Usa GPT-4o.",
  {
    codigo: z.string().describe("O código a explicar"),
    nivel: z.enum(["simples", "tecnico"]).optional().describe("'simples' para leigos, 'tecnico' para programadores"),
  },
  async ({ codigo, nivel }) => {
    if (!openai) return semOpenAI();
    try {
      const instrucao = nivel === "tecnico"
        ? "Explica tecnicamente o que este código faz, incluindo padrões, complexidade e possíveis problemas."
        : "Explica o que este código faz em linguagem simples, como se fosse para alguém que não programa.";
      const resposta = await gpt([
        { role: "system", content: `${instrucao} Responda em português.` },
        { role: "user", content: codigo },
      ]);
      return { content: [{ type: "text", text: `💡 **Explicação:**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "revisar_codigo",
  "Revisa um ficheiro de código do projecto e sugere melhorias, bugs e boas práticas. Usa GPT-4o.",
  {
    ficheiro: z.string().describe("Nome do ficheiro a rever, ex: index.js"),
  },
  async ({ ficheiro }) => {
    if (!openai) return semOpenAI();
    try {
      const caminho = path.join(__dirname, ficheiro);
      if (!fs.existsSync(caminho)) {
        return { content: [{ type: "text", text: `❌ Ficheiro "${ficheiro}" não encontrado.` }], isError: true };
      }
      const codigo = fs.readFileSync(caminho, "utf-8");
      const resposta = await gpt([
        { role: "system", content: "Você é um code reviewer sénior. Analisa o código e fornece: 1) Bugs encontrados, 2) Melhorias de performance, 3) Boas práticas em falta, 4) Sugestões de refactoring. Seja directo e prático. Responda em português." },
        { role: "user", content: `Ficheiro: ${ficheiro}\n\n${codigo}` },
      ]);
      return { content: [{ type: "text", text: `🔍 **Revisão de \`${ficheiro}\`:**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "traduzir_texto",
  "Traduz qualquer texto entre idiomas usando GPT-4o.",
  {
    texto: z.string().describe("Texto a traduzir"),
    para: z.string().optional().describe("Idioma de destino, ex: inglês, espanhol, francês. Padrão: inglês"),
  },
  async ({ texto, para }) => {
    if (!openai) return semOpenAI();
    try {
      const idioma = para || "inglês";
      const resposta = await gpt([
        { role: "system", content: `Você é um tradutor profissional. Traduz o texto para ${idioma} mantendo o tom e estilo original. Responda APENAS com a tradução.` },
        { role: "user", content: texto },
      ]);
      return { content: [{ type: "text", text: `🌐 **Tradução para ${idioma}:**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "criar_plano",
  "Cria um plano de acção detalhado para qualquer tarefa ou projecto usando GPT-4o.",
  {
    objetivo: z.string().describe("O que queres alcançar ou fazer"),
    contexto: z.string().optional().describe("Contexto adicional, restrições, recursos disponíveis"),
    guardar_no_obsidian: z.boolean().optional().describe("Se true, guarda o plano no Obsidian automaticamente"),
  },
  async ({ objetivo, contexto, guardar_no_obsidian }) => {
    if (!openai) return semOpenAI();
    try {
      const resposta = await gpt([
        { role: "system", content: "Você é um especialista em planeamento e gestão de projectos. Cria planos de acção claros, com passos numerados, estimativas de tempo e critérios de sucesso. Responda em português." },
        { role: "user", content: contexto ? `Objectivo: ${objetivo}\n\nContexto: ${contexto}` : `Objectivo: ${objetivo}` },
      ]);

      if (guardar_no_obsidian && VAULT) {
        const titulo = `Plano - ${objetivo.slice(0, 60)}`;
        const nomeArquivo = titulo.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_");
        const destino = path.join(VAULT, "Planos");
        if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
        const caminho = path.join(destino, `${nomeArquivo}.md`);
        fs.writeFileSync(caminho, `# ${titulo}\n\n${resposta}\n\n---\n_Criado em: ${new Date().toLocaleString("pt-BR")}_\n`, "utf-8");
        return { content: [{ type: "text", text: `📋 **Plano criado e guardado no Obsidian:**\n\`${caminho}\`\n\n${resposta}` }] };
      }

      return { content: [{ type: "text", text: `📋 **Plano de Acção:**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "responder_pergunta",
  "Responde qualquer pergunta usando GPT-4o. Use para perguntas rápidas, factuais ou técnicas que não precisam da capacidade completa do Claude.",
  {
    pergunta: z.string().describe("A pergunta a responder"),
    contexto: z.string().optional().describe("Contexto adicional para uma resposta mais precisa"),
  },
  async ({ pergunta, contexto }) => {
    if (!openai) return semOpenAI();
    try {
      const resposta = await gpt([
        { role: "system", content: "Você é um assistente especialista. Responda de forma clara, directa e precisa. Responda em português." },
        { role: "user", content: contexto ? `Contexto: ${contexto}\n\nPergunta: ${pergunta}` : pergunta },
      ]);
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 3 — FICHEIROS DO PROJECTO
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "criar_ficheiro",
  "Cria um ficheiro com o nome e conteúdo especificados na pasta do projecto.",
  {
    nome: z.string().describe("Nome do ficheiro, ex: app.js, script.py"),
    conteudo: z.string().describe("Conteúdo completo do ficheiro"),
  },
  async ({ nome, conteudo }) => {
    try {
      const caminho = path.join(__dirname, nome);
      const pasta = path.dirname(caminho);
      if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(caminho, conteudo, "utf-8");
      return { content: [{ type: "text", text: `✅ Ficheiro **${nome}** criado em:\n\`${caminho}\`` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ler_ficheiro",
  "Lê o conteúdo de um ficheiro do projecto.",
  {
    nome: z.string().describe("Nome do ficheiro a ler"),
  },
  async ({ nome }) => {
    try {
      const caminho = path.join(__dirname, nome);
      if (!fs.existsSync(caminho)) return { content: [{ type: "text", text: `❌ Ficheiro "${nome}" não encontrado.` }], isError: true };
      const conteudo = fs.readFileSync(caminho, "utf-8");
      return { content: [{ type: "text", text: `📄 **${nome}**\n\n\`\`\`\n${conteudo}\n\`\`\`` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "listar_ficheiros",
  "Lista todos os ficheiros e pastas do projecto.",
  {},
  async () => {
    try {
      const itens = fs.readdirSync(__dirname).filter((i) => i !== "node_modules" && !i.startsWith("."));
      const lista = itens.map((item) => {
        try {
          const stat = fs.statSync(path.join(__dirname, item));
          return `${stat.isDirectory() ? "📁" : "📄"} ${item}`;
        } catch { return `📄 ${item}`; }
      }).join("\n");
      return { content: [{ type: "text", text: `📂 **Projecto:** \`${__dirname}\`\n\n${lista}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 4 — AGENTE AUTÓNOMO (com acesso ao Obsidian)
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "executar_agente",
  "Executa o agente autónomo GPT-4o para tarefas complexas com múltiplos passos. O agente tem acesso ao Obsidian, pode criar ficheiros e guardar memórias automaticamente.",
  {
    tarefa: z.string().describe("Descrição detalhada da tarefa para o agente executar"),
  },
  async ({ tarefa }) => {
    if (!openai) return semOpenAI();
    try {
      const mensagens = [
        {
          role: "system",
          content: `Você é um agente autónomo especialista em programação e gestão de conhecimento.
Tem acesso a ferramentas para criar ficheiros, ler e escrever no Obsidian.
Execute a tarefa passo a passo. Responda em português.
Vault do Obsidian: ${VAULT || "não configurado"}`,
        },
        { role: "user", content: tarefa },
      ];

      const ferramentasAgente = [
        {
          type: "function",
          function: {
            name: "criar_ficheiro",
            description: "Cria um ficheiro no projecto.",
            parameters: { type: "object", properties: { nome: { type: "string" }, conteudo: { type: "string" } }, required: ["nome", "conteudo"] },
          },
        },
        {
          type: "function",
          function: {
            name: "ler_ficheiro",
            description: "Lê um ficheiro do projecto.",
            parameters: { type: "object", properties: { nome: { type: "string" } }, required: ["nome"] },
          },
        },
        {
          type: "function",
          function: {
            name: "listar_ficheiros",
            description: "Lista os ficheiros do projecto.",
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            name: "ler_obsidian",
            description: "Lê notas do Obsidian. Pode listar todas as notas, ler uma nota específica pelo nome, ou fazer uma busca semântica por conteúdo relevante para um tema.",
            parameters: {
              type: "object",
              properties: {
                modo: {
                  type: "string",
                  enum: ["listar", "ler", "buscar"],
                  description: "'listar' → lista todas as notas; 'ler' → lê uma nota pelo nome; 'buscar' → busca notas relevantes para um tema",
                },
                nome: { type: "string", description: "Nome parcial da nota (para modo 'ler')" },
                tema: { type: "string", description: "Tema ou pergunta para busca semântica (para modo 'buscar')" },
                pasta: { type: "string", description: "Subpasta específica para filtrar, ex: Memórias, Projectos" },
              },
              required: ["modo"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "escrever_obsidian",
            description: "Cria ou actualiza uma nota no Obsidian. Pode criar nova nota, adicionar conteúdo ao fim de uma nota existente, ou substituir o conteúdo completo.",
            parameters: {
              type: "object",
              properties: {
                titulo: { type: "string", description: "Título da nota" },
                conteudo: { type: "string", description: "Conteúdo a escrever" },
                modo: {
                  type: "string",
                  enum: ["criar", "adicionar", "substituir"],
                  description: "'criar' → cria nota nova; 'adicionar' → acrescenta ao fim; 'substituir' → reescreve tudo",
                },
                pasta: { type: "string", description: "Subpasta dentro da vault, ex: Memórias, Projectos, Diário" },
                tags: { type: "string", description: "Tags separadas por vírgula, ex: ia, projecto, decisão" },
              },
              required: ["titulo", "conteudo", "modo"],
            },
          },
        },
      ];

      let log = `🚀 **Agente iniciado:** "${tarefa}"\n\n`;
      let passos = 0;

      while (passos < 10) {
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
            if (args.nome || args.titulo) log += ` → \`${args.nome || args.titulo}\``;
            log += "\n";

            let resultado = "";

            if (chamada.function.name === "criar_ficheiro") {
              const caminho = path.join(__dirname, args.nome);
              const pasta = path.dirname(caminho);
              if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
              fs.writeFileSync(caminho, args.conteudo, "utf-8");
              resultado = `✅ Ficheiro "${args.nome}" criado.`;

            } else if (chamada.function.name === "ler_ficheiro") {
              const caminho = path.join(__dirname, args.nome);
              resultado = fs.existsSync(caminho) ? fs.readFileSync(caminho, "utf-8") : `❌ Ficheiro "${args.nome}" não encontrado.`;

            } else if (chamada.function.name === "listar_ficheiros") {
              resultado = fs.readdirSync(__dirname).filter((f) => f !== "node_modules" && !f.startsWith(".")).join(", ");

            } else if (chamada.function.name === "ler_obsidian") {
              if (!VAULT) {
                resultado = "❌ OBSIDIAN_PATH não configurado no .env.";
              } else {
                const baseVault = args.pasta ? path.join(VAULT, args.pasta) : VAULT;
                const notas = lerTodasNotas(baseVault);

                if (notas.length === 0) {
                  resultado = `❌ Nenhuma nota encontrada${args.pasta ? ` na pasta "${args.pasta}"` : " na vault"}.`;

                } else if (args.modo === "listar") {
                  resultado = `📚 ${notas.length} nota(s):\n` + notas.map((n) => {
                    const rel = path.relative(VAULT, n.caminho);
                    return `- ${rel}`;
                  }).join("\n");

                } else if (args.modo === "ler" && args.nome) {
                  const encontrada = notas.find((n) => n.nome.toLowerCase().includes(args.nome.toLowerCase()));
                  if (encontrada) {
                    resultado = `📝 **${encontrada.nome}**\n\n${encontrada.conteudo}`;
                  } else {
                    const lista = notas.slice(0, 20).map((n) => `- ${n.nome}`).join("\n");
                    resultado = `❌ Nota "${args.nome}" não encontrada.\n\nNotas disponíveis:\n${lista}`;
                  }

                } else if (args.modo === "buscar" && args.tema) {
                  // Busca semântica: envia índice ao GPT para seleccionar notas relevantes
                  const indice = notas.map((n, i) => `[${i}] ${n.nome}: ${n.conteudo.slice(0, 150)}`).join("\n");
                  try {
                    const selecao = await openai.chat.completions.create({
                      model: "gpt-4o-mini",
                      messages: [
                        { role: "system", content: "Analisa as notas e devolve APENAS os índices das mais relevantes para o tema, separados por vírgula. Ex: 0,3,7" },
                        { role: "user", content: `Tema: ${args.tema}\n\nNotas:\n${indice.slice(0, 8000)}` },
                      ],
                      max_tokens: 50,
                    });
                    const indices = selecao.choices[0].message.content
                      .split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n < notas.length);
                    if (indices.length === 0) {
                      resultado = `Nenhuma nota relevante encontrada para: "${args.tema}"`;
                    } else {
                      resultado = indices.map((i) => `📝 **${notas[i].nome}**\n\n${notas[i].conteudo}`).join("\n\n---\n\n");
                    }
                  } catch {
                    // Fallback: busca por texto simples
                    const tema = args.tema.toLowerCase();
                    const relevantes = notas.filter((n) =>
                      n.nome.toLowerCase().includes(tema) || n.conteudo.toLowerCase().includes(tema)
                    ).slice(0, 5);
                    resultado = relevantes.length > 0
                      ? relevantes.map((n) => `📝 **${n.nome}**\n\n${n.conteudo}`).join("\n\n---\n\n")
                      : `Nenhuma nota encontrada para: "${args.tema}"`;
                  }

                } else {
                  // Modo padrão: lista tudo
                  resultado = `📚 ${notas.length} nota(s):\n` + notas.map((n) => `- ${n.nome}`).join("\n");
                }
              }

            } else if (chamada.function.name === "escrever_obsidian") {
              if (!VAULT) {
                resultado = "❌ OBSIDIAN_PATH não configurado no .env.";
              } else {
                try {
                  const subpasta = args.pasta || "Memórias";
                  const destino = path.join(VAULT, subpasta);
                  if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

                  const nomeArquivo = args.titulo.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 80);
                  const caminho = path.join(destino, `${nomeArquivo}.md`);
                  const timestamp = new Date().toLocaleString("pt-BR");
                  const tagStr = args.tags ? `\ntags: [${args.tags}]` : "";

                  if (args.modo === "criar" || !fs.existsSync(caminho)) {
                    const texto = `---\ncriado: ${new Date().toISOString()}${tagStr}\n---\n\n# ${args.titulo}\n\n${args.conteudo}\n`;
                    fs.writeFileSync(caminho, texto, "utf-8");
                    resultado = `✅ Nota "${args.titulo}" criada em: ${caminho}`;

                  } else if (args.modo === "adicionar") {
                    const existente = fs.readFileSync(caminho, "utf-8");
                    const novoConteudo = `${existente}\n\n---\n_Actualizado em: ${timestamp}_\n\n${args.conteudo}\n`;
                    fs.writeFileSync(caminho, novoConteudo, "utf-8");
                    resultado = `✅ Conteúdo adicionado à nota "${args.titulo}".`;

                  } else if (args.modo === "substituir") {
                    const texto = `---\nactualizado: ${new Date().toISOString()}${tagStr}\n---\n\n# ${args.titulo}\n\n${args.conteudo}\n`;
                    fs.writeFileSync(caminho, texto, "utf-8");
                    resultado = `✅ Nota "${args.titulo}" substituída em: ${caminho}`;
                  }
                } catch (e) {
                  resultado = `❌ Erro ao escrever no Obsidian: ${e.message}`;
                }
              }
            }

            log += `   ${resultado.split("\n")[0]}\n`;
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
      return { content: [{ type: "text", text: `❌ Erro no agente: ${erro.message}` }], isError: true };
    }
  }
);

// ─── INICIAR SERVIDOR ──────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
