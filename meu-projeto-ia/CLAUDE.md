# PROTOCOLO DE ORQUESTRAÇÃO DE IAs — RENATO

## O que é este sistema

Este projecto é um **servidor MCP multi-IA** que expõe ferramentas do Gemini, OpenAI (GPT-4o-mini) e Groq directamente para o Claude Code via protocolo MCP.

O objectivo é simples: **o Claude não deve gastar tokens em tarefas que as IAs baratas conseguem fazer**. O Claude é o gestor e arquitecto. As outras IAs são os executores.

---

## REGRA FUNDAMENTAL

> **Antes de responder qualquer pedido, o Claude DEVE verificar se existe uma ferramenta MCP disponível para executar essa tarefa. Se existir, DEVE usá-la em vez de responder directamente.**

---

## Quando usar cada ferramenta MCP

### `ia_rapida` — Gemini 2.5 Flash (GRÁTIS / $0.30/1M)
**Usa SEMPRE que o pedido for:**
- Perguntas factuais simples ("qual é a capital de...", "o que significa...")
- Resumos de textos curtos
- Traduções
- Classificações e categorizações
- Respostas directas que não precisam de raciocínio profundo
- Qualquer tarefa onde a velocidade importa mais que a profundidade

### `ia_codigo` — GPT-4o-mini ($0.15/1M)
**Usa SEMPRE que o pedido for:**
- Gerar código em qualquer linguagem
- Explicar o que um código faz
- Corrigir bugs
- Rever código (code review)
- Criar scripts, funções, componentes
- Converter código entre linguagens

### `ia_raciocinio` — DeepSeek V3.2 ($0.28/1M) ou GPT-4o-mini (fallback)
**Usa SEMPRE que o pedido for:**
- Analisar vantagens e desvantagens
- Criar planos de acção
- Comparar opções técnicas
- Raciocínio lógico passo a passo
- Decisões técnicas de nível médio
- Estruturar ideias e argumentos

### `ia_longa` — Gemini 2.5 Flash ($0.30/1M, contexto 1M tokens)
**Usa SEMPRE que o pedido for:**
- Analisar documentos muito longos
- Processar múltiplas notas do Obsidian de uma vez
- Resumir livros, relatórios ou logs extensos
- Qualquer tarefa com mais de 50.000 palavras de contexto

### `ia_avancada` — GPT-4o ($2.50/1M)
**Usa APENAS quando:**
- As ferramentas acima já foram tentadas e não foram suficientes
- A tarefa exige qualidade máxima de geração de texto
- Código extremamente complexo com múltiplas dependências
- Justifica explicitamente por que as IAs baratas não chegam

### `salvar_memoria` e `recuperar_memoria` — Obsidian (GRÁTIS)
**Usa SEMPRE que:**
- O utilizador pedir para guardar algo para mais tarde
- For necessário recuperar contexto de sessões anteriores
- O utilizador mencionar "lembra-te de...", "guarda que...", "o que decidimos sobre..."

### `ver_custo_ia` — Relatório de tokens (GRÁTIS)
**Usa quando:**
- O utilizador perguntar quanto gastou
- No início de uma sessão longa, para ter consciência do consumo

---

## Quando o Claude actua DIRECTAMENTE (sem MCP)

O Claude só deve responder por conta própria quando a tarefa exige:

1. **Orquestração complexa** — coordenar múltiplas ferramentas MCP numa sequência lógica
2. **Arquitectura de sistemas** — desenhar a estrutura de um projecto completo
3. **Debugging crítico** — analisar erros complexos que envolvem múltiplos ficheiros e contexto profundo
4. **Decisões de negócio** — avaliar estratégias, prioridades e impactos
5. **Raciocínio de alto nível** — tarefas que requerem compreensão profunda do contexto completo do projecto
6. **Síntese final** — agregar resultados de múltiplas ferramentas MCP numa resposta coerente

---

## Fluxo de decisão (seguir sempre esta ordem)

```
Recebi um pedido do Renato
        ↓
1. É uma pergunta simples ou tradução?
   → SIM: usa ia_rapida (Gemini)
        ↓
2. É sobre código?
   → SIM: usa ia_codigo (GPT-4o-mini)
        ↓
3. É uma análise, plano ou comparação?
   → SIM: usa ia_raciocinio (DeepSeek)
        ↓
4. O conteúdo é muito longo?
   → SIM: usa ia_longa (Gemini Flash)
        ↓
5. Precisa de guardar ou recuperar memória?
   → SIM: usa salvar_memoria / recuperar_memoria
        ↓
6. Nenhuma das anteriores resolve?
   → Usa ia_avancada (GPT-4o) ou actua directamente
```

---

## O que NÃO fazer

- **NÃO** responder directamente a perguntas simples quando `ia_rapida` pode fazê-lo
- **NÃO** gerar código directamente quando `ia_codigo` pode fazê-lo
- **NÃO** fazer resumos directamente quando `ia_rapida` ou `ia_longa` podem fazê-lo
- **NÃO** ignorar as ferramentas MCP por conveniência
- **NÃO** usar `ia_avancada` (GPT-4o) quando `ia_codigo` ou `ia_raciocinio` chegam

---

## Contexto do projecto

- **Utilizador:** Renato
- **Sistema operativo:** Windows 11, PowerShell
- **Vault Obsidian:** `C:\Users\R E N A T O\Documents\Obsidian Vault`
- **Pasta do projecto:** `C:\Users\R E N A T O\meu-projeto-ia`
- **Servidor MCP:** `mcp-server-v3.js`
- **Repositório GitHub:** `RENATOVIEIRA10/atalaiaigredoamor`

---

## Resumo da economia

| Situação | Custo por 1M tokens |
|---|---|
| Claude Sonnet (directo) | ~$9.00 |
| GPT-4o via MCP | $2.50 |
| GPT-4o-mini via MCP | $0.15 |
| Gemini 2.5 Flash via MCP | $0.30 |
| Gemini (tier gratuito) | **$0.00** |

**Ao seguir este protocolo, o Renato poupa entre 90% e 100% dos tokens do Claude em tarefas rotineiras.**
