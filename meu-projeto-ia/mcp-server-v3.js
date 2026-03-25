/**
 * SERVIDOR MCP v3 — ORQUESTRADOR MULTI-IA
 *
 * Filosofia: Claude é o ARQUITECTO e GESTOR. Nunca executa tarefas simples.
 * As IAs baratas executam tudo o que é rotineiro.
 *
 * HIERARQUIA DE CUSTO (do mais barato ao mais caro):
 *
 *   Tier 1 — ULTRA BARATO (< $0.10/1M tokens)
 *     • Gemini 2.5 Flash Lite  → $0.10 input / $0.40 output
 *     • GPT-4o-mini            → $0.15 input / $0.60 output
 *
 *   Tier 2 — BARATO ($0.15–$0.50/1M tokens)
 *     • DeepSeek V3.2          → $0.28 input / $0.40 output
 *     • Gemini 2.5 Flash       → $0.30 input / $2.50 output
 *
 *   Tier 3 — MÉDIO ($1–$3/1M tokens)
 *     • GPT-4o                 → $2.50 input / $10.00 output
 *     • Gemini 2.5 Pro         → $1.25 input / $10.00 output
 *
 *   Tier 4 — RESERVADO PARA CLAUDE (não entra aqui)
 *     • Claude Sonnet / Opus   → usado directamente pelo utilizador
 *
 * FERRAMENTAS DISPONÍVEIS:
 *   - ia_rapida         → Gemini Flash Lite (ultra barato, respostas simples)
 *   - ia_codigo         → GPT-4o-mini (geração e revisão de código)
 *   - ia_raciocinio     → DeepSeek V3.2 (raciocínio, análise, planos)
 *   - ia_longa          → Gemini 2.5 Flash (contexto 1M tokens, documentos longos)
 *   - ia_avancada       → GPT-4o (tarefas que precisam de qualidade superior)
 *   - salvar_memoria    → Guarda no Obsidian (sem IA)
 *   - recuperar_memoria → Busca semântica no Obsidian via Gemini Flash Lite
 *   - criar_nota        → Cria nota no Obsidian (sem IA)
 *   - listar_notas      → Lista notas da vault (sem IA)
 *   - criar_ficheiro    → Cria ficheiro no projecto (sem IA)
 *   - ler_ficheiro      → Lê ficheiro do projecto (sem IA)
 *   - ver_custo_ia      → Mostra o relatório de tokens e custos acumulados
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
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// ─── CLIENTES DE IA ────────────────────────────────────────────────────────

// OpenAI (GPT-4o, GPT-4o-mini)
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes("COLE")) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch {}

// Gemini via API compatível com OpenAI (Google AI Studio)
let gemini = null;
try {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("COLE")) {
    gemini = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }
} catch {}

// DeepSeek via API compatível com OpenAI
let deepseek = null;
try {
  if (process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes("COLE")) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com/v1",
    });
  }
} catch {}

// Groq via API compatível com OpenAI
let groq = null;
try {
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes("COLE")) {
    groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
} catch {}

const VAULT = process.env.OBSIDIAN_PATH || "";

// ─── SISTEMA DE LOGGING ────────────────────────────────────────────────────

const LOG_DIR  = path.join(__dirname, "logs");
const LOG_FILE = path.join(LOG_DIR, "tokens-v3.jsonl");

const PRECOS = {
  // Gemini
  "gemini-2.5-flash-lite":  { input: 0.10,  output: 0.40  },
  "gemini-2.5-flash-lite-preview-06-17": { input: 0.10, output: 0.40 },
  "gemini-2.5-flash":       { input: 0.30,  output: 2.50  },
  "gemini-2.5-pro":         { input: 1.25,  output: 10.00 },
  // OpenAI
  "gpt-4o-mini":            { input: 0.15,  output: 0.60  },
  "gpt-4o":                 { input: 2.50,  output: 10.00 },
  // DeepSeek
  "deepseek-chat":          { input: 0.28,  output: 0.40  },
  "deepseek-v3":            { input: 0.28,  output: 0.40  },
  // Groq (Llama)
  "llama-3.3-70b-versatile":{ input: 0.59,  output: 0.79  },
  "llama-3.1-8b-instant":   { input: 0.05,  output: 0.08  },
};

function calcularCusto(modelo, tokensIn, tokensOut) {
  const chave = Object.keys(PRECOS).find((k) => modelo.toLowerCase().includes(k.toLowerCase()));
  const p = chave ? PRECOS[chave] : { input: 1.0, output: 3.0 };
  return ((tokensIn / 1_000_000) * p.input) + ((tokensOut / 1_000_000) * p.output);
}

function logTokens({ ferramenta, modelo, tokensIn, tokensOut, custo, duracao }) {
  const entrada = {
    ts:         new Date().toISOString(),
    ferramenta,
    modelo,
    tokens_in:  tokensIn,
    tokens_out: tokensOut,
    total:      tokensIn + tokensOut,
    custo_usd:  parseFloat(custo.toFixed(6)),
    duracao_ms: duracao,
  };
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entrada) + "\n", "utf-8");
  } catch {}
  process.stderr.write(
    `[MCP-v3] ${entrada.ts} | ${ferramenta} | ${modelo} | ` +
    `in:${tokensIn} out:${tokensOut} | $${entrada.custo_usd} | ${duracao}ms\n`
  );
}

// ─── HELPER GENÉRICO DE CHAMADA ─────────────────────────────────────────────

async function chamarIA(cliente, modelo, mensagens, ferramenta) {
  const inicio = Date.now();
  const r = await cliente.chat.completions.create({
    model: modelo,
    messages: mensagens,
    temperature: 0.7,
  });
  const duracao   = Date.now() - inicio;
  const tokensIn  = r.usage?.prompt_tokens     || 0;
  const tokensOut = r.usage?.completion_tokens || 0;
  const custo     = calcularCusto(r.model || modelo, tokensIn, tokensOut);
  logTokens({ ferramenta, modelo: r.model || modelo, tokensIn, tokensOut, custo, duracao });
  return r.choices[0].message.content;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

function semIA(nome, varEnv) {
  return {
    content: [{
      type: "text",
      text: `❌ ${nome} não configurado.\n\nAdiciona ao ficheiro .env:\n${varEnv}=SUA_CHAVE_AQUI\n\nObtém a chave em:\n${
        varEnv === "GEMINI_API_KEY"   ? "https://aistudio.google.com/app/apikey" :
        varEnv === "DEEPSEEK_API_KEY" ? "https://platform.deepseek.com/api_keys" :
        varEnv === "GROQ_API_KEY"     ? "https://console.groq.com/keys" :
        "https://platform.openai.com/api-keys"
      }`,
    }],
    isError: true,
  };
}

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

// ─── SERVIDOR MCP ──────────────────────────────────────────────────────────

const server = new McpServer({ name: "meu-projeto-ia-v3", version: "3.0.0" });

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 1 — IAs POR NÍVEL DE CUSTO
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "ia_rapida",
  "MAIS BARATO — Usa Gemini 2.5 Flash Lite ($0.10/1M). Ideal para: perguntas simples, resumos curtos, traduções, classificações, respostas rápidas. Quando em dúvida sobre qual IA usar, começa aqui.",
  {
    tarefa: z.string().describe("A tarefa ou pergunta a executar"),
    contexto: z.string().optional().describe("Contexto adicional se necessário"),
  },
  async ({ tarefa, contexto }) => {
    if (!gemini) return semIA("Gemini", "GEMINI_API_KEY");
    try {
      const msgs = [
        { role: "system", content: "Você é um assistente eficiente. Responda de forma clara e directa em português." },
        { role: "user",   content: contexto ? `Contexto: ${contexto}\n\nTarefa: ${tarefa}` : tarefa },
      ];
      const resposta = await chamarIA(gemini, "gemini-2.5-flash", msgs, "ia_rapida");
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      // Fallback para GPT-4o-mini se Gemini falhar
      if (openai) {
        try {
          const msgs = [
            { role: "system", content: "Você é um assistente eficiente. Responda de forma clara e directa em português." },
            { role: "user",   content: contexto ? `Contexto: ${contexto}\n\nTarefa: ${tarefa}` : tarefa },
          ];
          const resposta = await chamarIA(openai, "gpt-4o-mini", msgs, "ia_rapida_fallback");
          return { content: [{ type: "text", text: `[via GPT-4o-mini]\n\n${resposta}` }] };
        } catch {}
      }
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ia_codigo",
  "BARATO — Usa GPT-4o-mini ($0.15/1M). Especializado em: gerar código, explicar código, corrigir bugs, criar scripts. Melhor para código do que o Gemini Flash.",
  {
    descricao: z.string().describe("O que o código deve fazer, ou o código a analisar/corrigir"),
    linguagem: z.string().optional().describe("Linguagem: JavaScript, Python, TypeScript, etc. Padrão: JavaScript"),
    modo: z.enum(["gerar", "explicar", "corrigir", "revisar"]).optional().describe("Modo de operação. Padrão: gerar"),
    guardar_em: z.string().optional().describe("Nome do ficheiro para guardar o código, ex: app.js"),
  },
  async ({ descricao, linguagem, modo, guardar_em }) => {
    if (!openai) return semIA("OpenAI", "OPENAI_API_KEY");
    try {
      const lang = linguagem || "JavaScript";
      const operacao = modo || "gerar";
      const prompts = {
        gerar:    `Você é um programador sénior em ${lang}. Gere código limpo, comentado e funcional. Responda APENAS com o código.`,
        explicar: `Você é um professor de programação. Explique este código ${lang} de forma clara. Responda em português.`,
        corrigir: `Você é um debugger especialista em ${lang}. Identifica e corrige os bugs. Mostra o código corrigido e explica o que foi corrigido.`,
        revisar:  `Você é um code reviewer sénior em ${lang}. Analisa: bugs, performance, boas práticas, segurança. Seja directo. Responda em português.`,
      };
      const resposta = await chamarIA(openai, "gpt-4o-mini", [
        { role: "system", content: prompts[operacao] },
        { role: "user",   content: descricao },
      ], "ia_codigo");

      if (guardar_em && (operacao === "gerar" || operacao === "corrigir")) {
        const caminho = path.join(__dirname, guardar_em);
        const pasta   = path.dirname(caminho);
        if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
        const codigo = resposta.replace(/```[\w]*\n?/g, "").replace(/```$/g, "").trim();
        fs.writeFileSync(caminho, codigo, "utf-8");
        return { content: [{ type: "text", text: `✅ Código guardado em \`${caminho}\`\n\n\`\`\`${lang.toLowerCase()}\n${codigo}\n\`\`\`` }] };
      }
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ia_raciocinio",
  "BARATO — Usa DeepSeek V3.2 ($0.28/1M). Especializado em: raciocínio complexo, análise de problemas, planos de acção, decisões técnicas, comparações. Excelente custo-benefício para tarefas analíticas.",
  {
    tarefa: z.string().describe("A tarefa de raciocínio ou análise"),
    contexto: z.string().optional().describe("Contexto, dados ou informações relevantes"),
    guardar_no_obsidian: z.boolean().optional().describe("Se true, guarda o resultado no Obsidian"),
    pasta_obsidian: z.string().optional().describe("Pasta no Obsidian para guardar, ex: 'Análises'"),
  },
  async ({ tarefa, contexto, guardar_no_obsidian, pasta_obsidian }) => {
    // Fallback para GPT-4o-mini se DeepSeek não estiver configurado
    const cliente = deepseek || openai;
    const modelo  = deepseek ? "deepseek-chat" : "gpt-4o-mini";
    const nomeIA  = deepseek ? "DeepSeek V3.2" : "GPT-4o-mini (fallback)";

    if (!cliente) return semIA("DeepSeek", "DEEPSEEK_API_KEY");
    try {
      const resposta = await chamarIA(cliente, modelo, [
        { role: "system", content: "Você é um especialista em análise e raciocínio lógico. Pensa passo a passo, considera múltiplas perspectivas e fornece conclusões claras e accionáveis. Responda em português." },
        { role: "user",   content: contexto ? `Contexto:\n${contexto}\n\nTarefa:\n${tarefa}` : tarefa },
      ], "ia_raciocinio");

      if (guardar_no_obsidian && VAULT) {
        const titulo     = tarefa.slice(0, 60);
        const nomeArq    = titulo.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_");
        const subpasta   = pasta_obsidian || "Análises";
        const destino    = path.join(VAULT, subpasta);
        if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
        const caminho    = path.join(destino, `${nomeArq}.md`);
        const conteudo   = `---\ncriado: ${new Date().toISOString()}\nmodelo: ${nomeIA}\ntags: [análise, ia, deepseek]\n---\n\n# ${titulo}\n\n${resposta}\n`;
        fs.writeFileSync(caminho, conteudo, "utf-8");
        return { content: [{ type: "text", text: `✅ Análise guardada no Obsidian:\n\`${caminho}\`\n\n${resposta}` }] };
      }
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ia_longa",
  "CONTEXTO LONGO — Usa Gemini 2.5 Flash ($0.30/1M, contexto 1M tokens). Ideal para: analisar documentos longos, processar múltiplas notas do Obsidian de uma vez, resumir livros ou relatórios extensos.",
  {
    tarefa: z.string().describe("O que fazer com o conteúdo longo"),
    conteudo: z.string().describe("O conteúdo longo a processar (pode ser muito extenso)"),
    formato: z.enum(["resumo", "análise", "extração", "perguntas", "livre"]).optional().describe("Formato da resposta. Padrão: livre"),
  },
  async ({ tarefa, conteudo, formato }) => {
    if (!gemini) return semIA("Gemini", "GEMINI_API_KEY");
    try {
      const instrucoes = {
        resumo:    "Cria um resumo estruturado com os pontos principais.",
        análise:   "Faz uma análise crítica identificando padrões, conclusões e recomendações.",
        extração:  "Extrai as informações mais importantes em formato de lista organizada.",
        perguntas: "Gera as 10 perguntas mais importantes que este conteúdo responde.",
        livre:     "Executa a tarefa solicitada.",
      };
      const instrucao = instrucoes[formato || "livre"];
      const resposta = await chamarIA(gemini, "gemini-2.5-flash", [
        { role: "system", content: `Você é um especialista em análise de documentos. ${instrucao} Responda em português.` },
        { role: "user",   content: `Tarefa: ${tarefa}\n\nConteúdo:\n${conteudo}` },
      ], "ia_longa");
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ia_avancada",
  "QUALIDADE SUPERIOR — Usa GPT-4o ($2.50/1M). Reservado para tarefas que realmente precisam de qualidade máxima: código muito complexo, análises críticas, conteúdo profissional. Usa apenas quando as outras IAs não forem suficientes.",
  {
    tarefa: z.string().describe("A tarefa que requer qualidade máxima"),
    contexto: z.string().optional().describe("Contexto adicional"),
    justificativa: z.string().optional().describe("Por que esta tarefa precisa de GPT-4o e não de uma IA mais barata"),
  },
  async ({ tarefa, contexto }) => {
    if (!openai) return semIA("OpenAI", "OPENAI_API_KEY");
    try {
      const resposta = await chamarIA(openai, "gpt-4o", [
        { role: "system", content: "Você é um assistente de alto nível. Fornece respostas de qualidade máxima, detalhadas e precisas. Responda em português." },
        { role: "user",   content: contexto ? `Contexto:\n${contexto}\n\nTarefa:\n${tarefa}` : tarefa },
      ], "ia_avancada");
      return { content: [{ type: "text", text: resposta }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 2 — MEMÓRIA & OBSIDIAN
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "salvar_memoria",
  "Guarda uma memória, decisão ou aprendizado no Obsidian. Não usa IA — é instantâneo e gratuito.",
  {
    titulo:  z.string().describe("Título da memória"),
    conteudo: z.string().describe("Conteúdo completo a guardar"),
    pasta:   z.string().optional().describe("Subpasta no Obsidian, ex: 'Memórias/IA'. Padrão: 'Memórias'"),
    tags:    z.string().optional().describe("Tags separadas por vírgula"),
  },
  async ({ titulo, conteudo, pasta, tags }) => {
    if (!VAULT) return { content: [{ type: "text", text: "❌ OBSIDIAN_PATH não configurado no .env" }], isError: true };
    try {
      const subpasta   = pasta || "Memórias";
      const destino    = path.join(VAULT, subpasta);
      if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });
      const nomeArq    = titulo.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 80);
      const caminho    = path.join(destino, `${nomeArq}.md`);
      const tagStr     = tags ? `\ntags: [${tags}]` : "";
      const texto      = `---\ncriado: ${new Date().toISOString()}${tagStr}\n---\n\n# ${titulo}\n\n${conteudo}\n`;
      fs.writeFileSync(caminho, texto, "utf-8");
      return { content: [{ type: "text", text: `✅ Memória guardada:\n\`${caminho}\`` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "recuperar_memoria",
  "Busca memórias relevantes no Obsidian usando Gemini Flash Lite (ultra barato). Encontra notas relacionadas com a tua pergunta mesmo que o nome não coincida exactamente.",
  {
    pergunta: z.string().describe("O que queres recuperar ou lembrar"),
  },
  async ({ pergunta }) => {
    if (!VAULT) return { content: [{ type: "text", text: "❌ OBSIDIAN_PATH não configurado no .env" }], isError: true };
    const clienteIA = gemini || openai;
    const modeloIA  = gemini ? "gemini-2.5-flash" : "gpt-4o-mini";
    if (!clienteIA) return semIA("Gemini ou OpenAI", "GEMINI_API_KEY");
    try {
      const notas = lerTodasNotas(VAULT);
      if (notas.length === 0) return { content: [{ type: "text", text: "❌ Nenhuma nota encontrada na vault." }], isError: true };

      const indice = notas.map((n, i) => `[${i}] ${n.nome}: ${n.conteudo.slice(0, 150)}`).join("\n");
      const selecao = await chamarIA(clienteIA, modeloIA, [
        { role: "system", content: "Analise as notas e devolva APENAS os índices das mais relevantes para a pergunta, separados por vírgula. Ex: 0,3,7" },
        { role: "user",   content: `Pergunta: ${pergunta}\n\nNotas:\n${indice.slice(0, 10000)}` },
      ], "recuperar_memoria_selecao");

      const indices = selecao.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n < notas.length);
      if (indices.length === 0) return { content: [{ type: "text", text: `Não encontrei memórias relevantes para: "${pergunta}"` }] };

      const notasRelevantes = indices.map((i) => `# ${notas[i].nome}\n\n${notas[i].conteudo}`).join("\n\n---\n\n");
      const resposta = await chamarIA(clienteIA, modeloIA, [
        { role: "system", content: "Com base nas notas fornecidas, responde à pergunta de forma clara e directa. Cita as notas pelo nome. Responde em português." },
        { role: "user",   content: `Pergunta: ${pergunta}\n\nNotas:\n${notasRelevantes}` },
      ], "recuperar_memoria_resposta");

      return { content: [{ type: "text", text: `📚 **${indices.length} nota(s) relevante(s):**\n\n${resposta}` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "listar_notas",
  "Lista todas as notas da vault do Obsidian. Sem IA — instantâneo e gratuito.",
  {
    pasta: z.string().optional().describe("Subpasta específica para listar. Se omitido, lista tudo."),
  },
  async ({ pasta }) => {
    if (!VAULT) return { content: [{ type: "text", text: "❌ OBSIDIAN_PATH não configurado no .env" }], isError: true };
    try {
      const base  = pasta ? path.join(VAULT, pasta) : VAULT;
      const notas = lerTodasNotas(base);
      if (notas.length === 0) return { content: [{ type: "text", text: "Nenhuma nota encontrada." }] };
      const lista = notas.map((n) => `📝 ${path.relative(VAULT, n.caminho)}`).join("\n");
      return { content: [{ type: "text", text: `📚 **${notas.length} nota(s):**\n\n${lista}` }] };
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
  "Cria um ficheiro no projecto com o conteúdo especificado. Sem IA — instantâneo e gratuito.",
  {
    nome:     z.string().describe("Nome do ficheiro, ex: app.js, script.py"),
    conteudo: z.string().describe("Conteúdo completo do ficheiro"),
  },
  async ({ nome, conteudo }) => {
    try {
      const caminho = path.join(__dirname, nome);
      const pasta   = path.dirname(caminho);
      if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(caminho, conteudo, "utf-8");
      return { content: [{ type: "text", text: `✅ Ficheiro **${nome}** criado:\n\`${caminho}\`` }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

server.tool(
  "ler_ficheiro",
  "Lê o conteúdo de um ficheiro do projecto. Sem IA — instantâneo e gratuito.",
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

// ══════════════════════════════════════════════════════════════════════════
// BLOCO 4 — MONITORIZAÇÃO DE CUSTOS
// ══════════════════════════════════════════════════════════════════════════

server.tool(
  "ver_custo_ia",
  "Mostra o relatório de tokens e custos acumulados de todas as IAs usadas via MCP. Inclui comparação de quanto economizaste ao não usar o Claude para estas tarefas.",
  {
    periodo: z.enum(["hoje", "semana", "tudo"]).optional().describe("Período do relatório. Padrão: tudo"),
  },
  async ({ periodo }) => {
    const logFile = LOG_FILE;
    const logFileV2 = path.join(LOG_DIR, "tokens.jsonl");

    if (!fs.existsSync(logFile) && !fs.existsSync(logFileV2)) {
      return { content: [{ type: "text", text: "Nenhum log encontrado ainda. Os logs aparecem após a primeira chamada a uma ferramenta IA." }] };
    }

    try {
      let entradas = [];
      for (const f of [logFile, logFileV2]) {
        if (fs.existsSync(f)) {
          const linhas = fs.readFileSync(f, "utf-8").trim().split("\n").filter(Boolean);
          entradas.push(...linhas.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
        }
      }

      const agora  = new Date();
      const modo   = periodo || "tudo";
      if (modo === "hoje") {
        const hoje = agora.toISOString().slice(0, 10);
        entradas = entradas.filter((e) => e.ts.startsWith(hoje));
      } else if (modo === "semana") {
        const limite = new Date(agora - 7 * 24 * 60 * 60 * 1000);
        entradas = entradas.filter((e) => new Date(e.ts) >= limite);
      }

      if (entradas.length === 0) return { content: [{ type: "text", text: `Nenhum log para o período: ${modo}` }] };

      const totalTokens = entradas.reduce((s, e) => s + (e.total || 0), 0);
      const totalCusto  = entradas.reduce((s, e) => s + (e.custo_usd || 0), 0);

      // Custo equivalente se tivesse usado Claude Sonnet para tudo
      const custoSeClaude = (totalTokens / 1_000_000) * 9.0; // média input+output Sonnet
      const economia      = custoSeClaude - totalCusto;

      // Por modelo
      const porModelo = {};
      for (const e of entradas) {
        const m = e.modelo || "?";
        if (!porModelo[m]) porModelo[m] = { chamadas: 0, tokens: 0, custo: 0 };
        porModelo[m].chamadas++;
        porModelo[m].tokens += e.total || 0;
        porModelo[m].custo  += e.custo_usd || 0;
      }

      const linhasModelo = Object.entries(porModelo)
        .sort((a, b) => b[1].custo - a[1].custo)
        .map(([m, d]) => `  • ${m.slice(0, 35).padEnd(35)} ${String(d.chamadas + "x").padStart(4)}  $${d.custo.toFixed(5)}`)
        .join("\n");

      const relatorio = [
        `📊 RELATÓRIO DE CUSTOS IA — ${modo.toUpperCase()}`,
        ``,
        `  Chamadas totais:  ${entradas.length}`,
        `  Tokens totais:    ${totalTokens.toLocaleString()}`,
        `  Custo real:       $${totalCusto.toFixed(5)}`,
        `  Se fosse Claude:  $${custoSeClaude.toFixed(5)}`,
        `  💰 Economia:      $${economia.toFixed(5)} (${economia > 0 ? ((economia / custoSeClaude) * 100).toFixed(0) : 0}% menos)`,
        ``,
        `POR MODELO:`,
        linhasModelo,
        ``,
        `Corre "node ver-logs.js" para relatório completo.`,
      ].join("\n");

      return { content: [{ type: "text", text: relatorio }] };
    } catch (erro) {
      return { content: [{ type: "text", text: `❌ Erro: ${erro.message}` }], isError: true };
    }
  }
);

// ─── ARRANQUE ──────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("[MCP-v3] Servidor Multi-IA iniciado.\n");
