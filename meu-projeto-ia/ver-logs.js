/**
 * VER LOGS DE TOKENS — OpenAI & Claude
 *
 * Mostra um relatório completo de uso de tokens e custo estimado.
 *
 * Como usar:
 *   node ver-logs.js           → relatório completo
 *   node ver-logs.js hoje      → só as chamadas de hoje
 *   node ver-logs.js semana    → últimos 7 dias
 *   node ver-logs.js limpar    → apaga todos os logs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE  = path.join(__dirname, "logs", "tokens.jsonl");

const MODO = process.argv[2] || "tudo";

// ── Limpar logs ────────────────────────────────────────────────────────────

if (MODO === "limpar") {
  if (fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "", "utf-8");
    console.log("✅ Logs apagados.");
  } else {
    console.log("Nenhum log encontrado.");
  }
  process.exit(0);
}

// ── Ler logs ───────────────────────────────────────────────────────────────

if (!fs.existsSync(LOG_FILE)) {
  console.log("\n❌ Nenhum log encontrado ainda.");
  console.log("   Os logs aparecem automaticamente quando usas as ferramentas MCP.\n");
  process.exit(0);
}

const linhas = fs.readFileSync(LOG_FILE, "utf-8").trim().split("\n").filter(Boolean);
let entradas = linhas.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

// ── Filtrar por período ────────────────────────────────────────────────────

const agora = new Date();

if (MODO === "hoje") {
  const hoje = agora.toISOString().slice(0, 10);
  entradas = entradas.filter((e) => e.ts.startsWith(hoje));
} else if (MODO === "semana") {
  const limite = new Date(agora - 7 * 24 * 60 * 60 * 1000);
  entradas = entradas.filter((e) => new Date(e.ts) >= limite);
}

if (entradas.length === 0) {
  console.log(`\nNenhum log encontrado para o período: ${MODO}\n`);
  process.exit(0);
}

// ── Calcular totais ────────────────────────────────────────────────────────

const totalTokensIn  = entradas.reduce((s, e) => s + (e.tokens_in  || 0), 0);
const totalTokensOut = entradas.reduce((s, e) => s + (e.tokens_out || 0), 0);
const totalTokens    = entradas.reduce((s, e) => s + (e.total      || 0), 0);
const totalCusto     = entradas.reduce((s, e) => s + (e.custo_usd  || 0), 0);
const totalDuracao   = entradas.reduce((s, e) => s + (e.duracao_ms || 0), 0);

// Agrupar por ferramenta
const porFerramenta = {};
for (const e of entradas) {
  if (!porFerramenta[e.ferramenta]) {
    porFerramenta[e.ferramenta] = { chamadas: 0, tokens: 0, custo: 0 };
  }
  porFerramenta[e.ferramenta].chamadas++;
  porFerramenta[e.ferramenta].tokens += e.total || 0;
  porFerramenta[e.ferramenta].custo  += e.custo_usd || 0;
}

// Agrupar por modelo
const porModelo = {};
for (const e of entradas) {
  const modelo = e.modelo || "desconhecido";
  if (!porModelo[modelo]) porModelo[modelo] = { chamadas: 0, tokens: 0, custo: 0 };
  porModelo[modelo].chamadas++;
  porModelo[modelo].tokens += e.total || 0;
  porModelo[modelo].custo  += e.custo_usd || 0;
}

// ── Exibir relatório ───────────────────────────────────────────────────────

const periodo = MODO === "hoje" ? "HOJE" : MODO === "semana" ? "ÚLTIMOS 7 DIAS" : "TOTAL ACUMULADO";

console.log(`\n╔${"═".repeat(54)}╗`);
console.log(`║  RELATÓRIO DE TOKENS — ${periodo.padEnd(30)}║`);
console.log(`╠${"═".repeat(54)}╣`);
console.log(`║  Chamadas:      ${String(entradas.length).padEnd(37)}║`);
console.log(`║  Tokens input:  ${String(totalTokensIn.toLocaleString()).padEnd(37)}║`);
console.log(`║  Tokens output: ${String(totalTokensOut.toLocaleString()).padEnd(37)}║`);
console.log(`║  Tokens total:  ${String(totalTokens.toLocaleString()).padEnd(37)}║`);
console.log(`║  Custo total:   $${String(totalCusto.toFixed(6)).padEnd(36)}║`);
console.log(`║  Tempo total:   ${String((totalDuracao / 1000).toFixed(1) + "s").padEnd(37)}║`);
console.log(`╠${"═".repeat(54)}╣`);

// Por ferramenta
console.log(`║  ${"POR FERRAMENTA".padEnd(52)}║`);
console.log(`╠${"═".repeat(54)}╣`);
const ferramentasOrdenadas = Object.entries(porFerramenta).sort((a, b) => b[1].custo - a[1].custo);
for (const [nome, dados] of ferramentasOrdenadas) {
  const linha = `  ${nome.slice(0, 28).padEnd(28)} ${String(dados.chamadas + "x").padStart(4)}  $${dados.custo.toFixed(6)}`;
  console.log(`║${linha.padEnd(54)}║`);
}

// Por modelo
console.log(`╠${"═".repeat(54)}╣`);
console.log(`║  ${"POR MODELO".padEnd(52)}║`);
console.log(`╠${"═".repeat(54)}╣`);
for (const [modelo, dados] of Object.entries(porModelo)) {
  const linha = `  ${modelo.slice(0, 28).padEnd(28)} ${String(dados.chamadas + "x").padStart(4)}  $${dados.custo.toFixed(6)}`;
  console.log(`║${linha.padEnd(54)}║`);
}

// Últimas 5 chamadas
console.log(`╠${"═".repeat(54)}╣`);
console.log(`║  ${"ÚLTIMAS 5 CHAMADAS".padEnd(52)}║`);
console.log(`╠${"═".repeat(54)}╣`);
const ultimas = entradas.slice(-5).reverse();
for (const e of ultimas) {
  const hora = e.ts.slice(11, 19);
  const linha = `  ${hora}  ${e.ferramenta.slice(0, 22).padEnd(22)}  ${String(e.total).padStart(6)}t  $${e.custo_usd.toFixed(5)}`;
  console.log(`║${linha.padEnd(54)}║`);
}

console.log(`╠${"═".repeat(54)}╣`);
console.log(`║  Ficheiro de log: logs/tokens.jsonl${" ".repeat(18)}║`);
console.log(`║  Comandos:  node ver-logs.js hoje | semana | limpar${" ".repeat(3)}║`);
console.log(`╚${"═".repeat(54)}╝\n`);
