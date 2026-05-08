# AUR.IOS Engineering Governance — Atalaia

> Leia este arquivo no início de toda sessão neste repo.
> Atualizar ao fechar cada ciclo.

> 🪨 **Protocolo vinculante:** [Casa Firmada na Rocha](https://github.com/RENATOVIEIRA10/aurios-agents-workspace/blob/main/shared/protocols/casa-firmada-na-rocha.md) (ATIVO desde 2026-05-08). Fase atual = **fundação, não venda**. ATALAIA NÃO é vendido como SaaS — é setup interno Igreja do Amor. Foco: fechar capítulo WhatsApp (Ciclo 002), instaurar testes em `useDemoScope.ts` (49 dependentes), RLS testada. Transição comercial requer frase explícita do CEO.

---

## Registro de Ciclos

| # | Título | Status | Commits | Data |
|---|--------|--------|---------|------|
| 001 | WhatsApp `normalizePhone()` hardening | FECHADO | `1e85901` `2692897` `5b91a94` `e9be145` | 2026-05-07 |
| 002 | `BoasVindasWhatsApp.tsx` double-normalize fix | PENDENTE | — | — |
| 003 | `useDemoScope.ts` — suite de testes | PENDENTE | — | — |
| 004 | `ProximosPassosPanel` — guard botão WhatsApp inválido | PENDENTE | — | — |
| 005 | RLS policies — testes automatizados | PENDENTE | — | — |

---

## Ciclo fechado mais recente

### Ciclo 001 — WhatsApp `normalizePhone()` hardening

**Data:** 2026-05-07
**Escopo:** Função central de validação de telefone + enforcement em todos os pontos de uso

**O que entregou:**

| Commit | Mudança | Testes |
|--------|---------|--------|
| `1e85901` | 3 guards: reorder `0DDD`, rejeitar `+55` curto, rejeitar DDD fora de allowlist | 30/30 |
| `2692897` | 5 componentes migrados de `.replace(/\D/g,'')` para `buildWhatsAppLink()` / `openWhatsApp()` | 30/30 |
| `5b91a94` | Allowlist explícita de 67 DDDs Anatel substitui lower-bound `ddd < 11` | 34/34 |
| `e9be145` | Este arquivo — registro operacional do ciclo | — |

**Resultado:** `normalizePhone()` rejeita +55 sem DDD, 0DDD mal-formado, DDD inexistente no Brasil. Enforcement real em todos os callers — não apenas na função central.

**Agentes usados:** cartographer → product-architect → implementation (×3) → qa-reviewer → security-reviewer (×2) → codex:adversarial-review (×2)

**Codex findings:**
- R1 FLAG: `+55` curto → FECHADO commit `1e85901`
- R2 FLAG: lower-bound DDD insuficiente → FECHADO commit `5b91a94`
- R2 FLAG: 6 callers bypass → FECHADO commit `2692897`
- Nenhum BLOCK em nenhum round

---

## Ciclo atual

**Ciclo 002 — `BoasVindasWhatsApp.tsx` double-normalize**

**Status:** PENDENTE
**Tamanho:** trivial (< 5 min, 1 arquivo, 1 linha)
**Risco:** BAIXO
**Owner:** Renato + Claude
**Target date:** 2026-05-15 (D8 do War Room casa-firmada — encerra capítulo WhatsApp)
**Justificativa de fundação:** baixo risco, mas fecha o último ponto residual WhatsApp. Após este ciclo, ATALAIA não tem risco residual documentado em integração WhatsApp.

**Problema:** `BoasVindasWhatsApp.tsx` normaliza o número na linha 48, mas passa o valor raw (não normalizado) para `openWhatsApp` na linha 63. Se o número raw for inválido em um formato que `normalizePhone()` rejeitaria, o segundo call pode abrir wa.me errado.

**O que fazer:**
1. Ler `src/components/BoasVindasWhatsApp.tsx`
2. Na linha 63, passar o valor já normalizado (da linha 48) em vez do raw
3. Sem novos testes necessários — os 34 existentes cobrem `openWhatsApp`

**Gatilho Codex:** SIM — toca `openWhatsApp` (integração WhatsApp)

---

## Próxima task recomendada

**Ciclo 002** — `BoasVindasWhatsApp.tsx` double-normalize

Fecha o capítulo WhatsApp completamente. Após isso, nenhum ponto de entrada WhatsApp na app terá risco residual documentado.

---

## Backlog priorizado

| Ciclo | Título | Severidade | Esforço | Por quê agora |
|-------|--------|------------|---------|---------------|
| 002 | `BoasVindasWhatsApp.tsx` double-normalize | BAIXO | 5 min | Fecha capítulo WhatsApp |
| 003 | `useDemoScope.ts` suite de testes | ALTO | ~3h | 49 arquivos dependem, zero testes, mecanismo central de isolamento multicampus |
| 004 | `ProximosPassosPanel` guard WhatsApp inválido | BAIXO | 5 min | Botão visível com número inválido — UX enganosa |
| 005 | RLS policies — testes automatizados | ALTO | sessão dedicada | Sem testes, qualquer migration pode quebrar isolamento de dados sem aviso |
| 006 | Cobertura global de testes (~5% → meta 30%) | ALTO | trabalho contínuo | Cobertura atual não detecta regressões em módulos críticos |
| 007 | README.md — substituir placeholders | BAIXO | 10 min | `REPLACE_WITH_PROJECT_ID` e `<YOUR_GIT_URL>` ainda presentes |

---

## Riscos abertos

| Risco | Severidade | Origem | Ciclo alvo |
|-------|------------|--------|------------|
| `BoasVindasWhatsApp.tsx` double-normalize | BAIXO | security R1 | 002 |
| Anon key Supabase hardcoded em `client.ts` | MÉDIO | security R1 | — (padrão Lovable, risco condicional ao RLS) |
| `useDemoScope.ts` sem testes (49 dependentes) | ALTO | cartographer | 003 |
| RLS policies sem testes automatizados | ALTO | cartographer | 005 |
| Cobertura global ~5% | ALTO | cartographer | 006 |

---

## Ritual obrigatório — integrações sensíveis

Para qualquer mudança que toque `wa.me`, `whatsapp`, `supabase/client`, `auth`, `payment`, `webhook`, `rls`, `meta`:

```
1. implementação mínima
2. testes de borda na função central
3. aurios-security-reviewer
4. codex:adversarial-review --background
5. fechar todos os FLAGs relevantes
6. verificar enforcement em todos os callers
7. atualizar este arquivo
```

---

*Governança AUR.IOS — Atalaia. Última atualização: 2026-05-07 (Ciclo 001 fechado).*
