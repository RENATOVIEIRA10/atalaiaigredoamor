# atalaiaigredoamor — contrato de sessao

> Este bloco e committed. Qualquer Claude em qualquer maquina (notebook, VPS, code-server) le isto na primeira tool call. A documentacao tecnica do projeto esta abaixo.

## Identidade do projeto

- **Nome:** atalaiaigredoamor (Atalaia OS — Sistema Operacional Pastoral da Rede Amor a Dois / Igreja do Amor)
- **Supabase (produto):** `yjwdlsjatqafzofgdyob` (Lovable Cloud)
- **Supabase (sync/comando):** `zwnlpumonvkrghoxnddd` (agentes-hub — painel multi-projeto, NAO e o banco do produto)
- **Repo:** github.com/RENATOVIEIRA10/atalaiaigredoamor (branch `main`)
- **Deploy:** Lovable Cloud (redeploy automatico a partir do push em `main`)
- **VPS (ops/push):** 104.131.187.118, `/root/atalaiaigredoamor`

## Abertura de sessao (OBRIGATORIO)

Na primeira resposta de TODA sessao nesta pasta, ANTES de qualquer outra coisa:

1. Ler ultimos 5 registros de `sync_context` no agentes-hub:
   ```sql
   SELECT source, event_type, content, created_at
   FROM sync_context
   WHERE metadata->>'project' = 'atalaia'
   ORDER BY created_at DESC
   LIMIT 5
   ```
2. Mostrar resumo em 3-5 linhas: o que foi feito na ultima sessao, commits pendentes, alertas.
3. So depois responder ao pedido.

## Fechamento de sessao (OBRIGATORIO)

1. `git commit` + `git push` (Lovable redeploya a partir do push).
2. Edge functions alteradas: `npx supabase functions deploy <nome> --project-ref yjwdlsjatqafzofgdyob`.
3. Migrations SQL: aplicar via `apply_migration` E commitar arquivo em `supabase/migrations/`.
4. Se notebook bloquear HTTPS push (403), usar VPS como intermediario (`/root/atalaiaigredoamor` ja tem PAT no remote).
5. Escrever session_summary no agentes-hub:
   ```sql
   INSERT INTO sync_context (source, event_type, content, metadata)
   VALUES (
     '<notebook|vps|code-server>',
     'session_summary',
     '<resumo do que foi feito>',
     jsonb_build_object(
       'project', 'atalaia',
       'tasks_done', '[...]'::jsonb,
       'commits', '[...]'::jsonb,
       'next_candidates', '[...]'::jsonb
     )
   )
   ```

## Idioma

Portugues. Codigo e termos tecnicos em ingles.

---

# CLAUDE.md — Atalaia OS: Guia para Assistentes de IA

> **Atualizado:** Março 2026
> **Repositório:** `atalaiaigredoamor`
> **Stack:** React 18 + Vite + TypeScript + Supabase (Lovable Cloud)

---

## 1. VISÃO GERAL

O **Atalaia** é um **Sistema Operacional Pastoral** para a **Rede Amor a Dois** (células da **Igreja do Amor**). Não é um CRM genérico — é um centro de comando pastoral com dashboards completamente distintos por papel ministerial, isolamento multicampus rigoroso e lógica de dados real em todos os componentes.

---

## 2. STACK E FERRAMENTAS

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui + Framer Motion |
| Estado servidor | TanStack React Query v5 |
| Estado cliente | Context API |
| Roteamento | React Router DOM v6 |
| Backend | Supabase (Lovable Cloud) |
| Banco | PostgreSQL com RLS |
| Auth | OAuth Google/Apple via Lovable Cloud |
| Edge Functions | Deno (Supabase) |
| PWA | vite-plugin-pwa |
| Gráficos | Recharts |
| PDF | jspdf + html2canvas |
| Planilhas | ExcelJS |

---

## 3. ESTRUTURA DE ARQUIVOS

```
src/
├── App.tsx                    # Router principal + todos os Providers
├── main.tsx                   # Entry point
├── index.css                  # Design tokens CSS + 3 temas
├── contexts/
│   ├── AuthContext.tsx         # Sessão OAuth
│   ├── RoleContext.tsx         # 20+ papéis, scopeType, scopeId, flags isXxx
│   ├── CampoContext.tsx        # Campus ativo (campo_id), isGlobalView
│   ├── RedeContext.tsx         # Rede ativa
│   ├── DemoModeContext.tsx     # Modo demo/validação
│   ├── ThemeContext.tsx        # padrao | amor | claro
│   └── TorreControleContext.tsx
├── hooks/                     # ~91 hooks de dados (React Query)
│   ├── useDemoScope.ts        # ⭐ Hook central — injeta campo_id em queries
│   ├── usePulsoEngine.ts      # Engine unificada de métricas pastorais
│   ├── useRedes.ts            # CRUD redes (inclui leadership_couple join)
│   ├── useCelulas.ts
│   ├── useWeeklyReports.ts
│   ├── useSupervisoes.ts
│   └── ...
├── components/
│   ├── dashboard/
│   │   ├── CellLeaderDashboard.tsx
│   │   ├── SupervisorDashboard.tsx
│   │   ├── CoordinatorDashboard.tsx
│   │   ├── NetworkLeaderDashboard.tsx
│   │   ├── PastorDashboard.tsx
│   │   ├── GlobalPastorDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── pwa/               # Versões mobile compactas
│   │       ├── CellLeaderPWADashboard.tsx
│   │       ├── SupervisorPWADashboard.tsx
│   │       ├── CoordinatorPWADashboard.tsx
│   │       ├── NetworkLeaderPWADashboard.tsx
│   │       └── AdminPWADashboard.tsx
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx     # Sidebar desktop por papel
│   │   ├── MobileBottomNav.tsx # Bottom nav PWA por papel
│   │   └── MobileMenuSheet.tsx # Menu lateral PWA
│   └── ui/                    # shadcn/ui + componentes customizados
├── pages/                     # Rotas React Router
│   ├── Dashboard.tsx          # Roteador de dashboards por papel
│   ├── Home.tsx / HomeConcierge.tsx
│   └── ...
├── lib/
│   ├── appMap.ts              # Mapa do produto (glossário, onboarding, módulos)
│   ├── roleUXConfig.ts        # Config de UX por papel (greeting, quickActions, alerts)
│   └── avatarPermissions.ts   # Permissões hierárquicas
├── services/
│   └── unifiedAI.ts           # Integração Lovable AI
└── integrations/
    ├── supabase/              # ⚠️ AUTO-GERADO — nunca editar manualmente
    │   ├── client.ts
    │   └── types.ts
    └── lovable/
```

---

## 4. HIERARQUIA E PAPÉIS

### Hierarquia Ministerial

```
Pastor Senior Global
  └── Pastor de Campo
        └── Líder de Rede          (scopeType: 'rede')
              └── Coordenador       (scopeType: 'coordenacao')
                    └── Supervisor  (scopeType: 'supervisor')
                          └── Líder de Célula (scopeType: 'celula')
                                └── Membros
```

### Flags do RoleContext

```typescript
const {
  isCelulaLeader, isSupervisor, isCoordenador, isRedeLeader,
  isPastorDeCampo, isPastorSeniorGlobal, isPastor,
  isAdmin, isDemoInstitucional,
  isRecomecoCadastro, isCentralCelulas, isLiderRecomecoCentral,
  isLiderBatismoAclamacao, isCentralBatismoAclamacao,
  isGuardioesCulto, isFinanceiroAny,
  scopeType, scopeId,   // 'rede' / 'coordenacao' / 'celula' etc + ID
} = useRole();
```

### Dashboard por Papel (src/pages/Dashboard.tsx)

```typescript
if (isRedeLeader) return isPWAMobile ? <NetworkLeaderPWADashboard /> : <NetworkLeaderDashboard />;
if (isCoordenador) return isPWAMobile ? <CoordinatorPWADashboard /> : <CoordinatorDashboard />;
// etc.
```

---

## 5. ESCOPO MULTICAMPUS — REGRAS CRÍTICAS

### Hook Central: `useDemoScope()`

```typescript
const { campoId, isMissingCampo, isTestData, queryKeyExtra } = useDemoScope();
```

**Sempre use este hook** para obter `campoId` em queries. Ele injeta automaticamente filtros de `campo_id` e `is_test_data`. Se `campoId` for nulo fora da visão global, injeta UUID impossível — **nenhum dado vaza**.

### Regras Invioláveis

1. **SEMPRE** filtre por `campo_id` em queries operacionais — use `useDemoScope()`
2. **NUNCA** assuma um campus padrão — use `ScopeMissingGate` para bloquear renderização
3. Papéis globais (Admin, Pastor Senior) podem ter `campo_id = null` com `isGlobalView = true`
4. Tabelas novas precisam de `campo_id NOT NULL` + RLS policies
5. Triggers de banco garantem herança automática (célula → membros, relatórios)

### Exemplo Correto de Query

```typescript
const { campoId, isMissingCampo } = useDemoScope();

useQuery({
  queryKey: ['celulas', campoId, ...queryKeyExtra],
  enabled: !isMissingCampo,
  queryFn: async () => {
    const { data } = await supabase
      .from('celulas')
      .select('*')
      .eq('campo_id', campoId!);
    return data;
  },
});
```

---

## 6. PWA — DASHBOARDS MOBILE

### Detecção

```typescript
const isPWA = useIsPWA();
const isMobile = useIsMobile();
const isPWAMobile = isPWA && isMobile;
```

### Tabs dos Dashboards PWA

Os dashboards PWA usam `searchParams.get('tab')` para controlar qual aba renderiza. Os tabs são controlados pelo `MobileBottomNav` via navegação de URL.

| Dashboard PWA | Tabs disponíveis |
|--------------|-----------------|
| `CellLeaderPWADashboard` | `inicio`, `historico` |
| `SupervisorPWADashboard` | `inicio`, `plano`, `acoes` |
| `CoordinatorPWADashboard` | `inicio`, `pulso`, `acoes` |
| `NetworkLeaderPWADashboard` | `inicio`, `pulso`, `acoes` |

### MobileBottomNav — Itens por Papel

```typescript
// Líder de Rede
{ label: 'Início', path: '/home' }
{ label: 'Visão',  path: '/dashboard' }           // tab: inicio
{ label: 'Pulso',  path: '/dashboard?tab=pulso' }
{ label: 'Ações',  path: '/dashboard?tab=acoes' }

// Coordenador (mesmo padrão)
{ label: 'Início', path: '/home' }
{ label: 'Visão',  path: '/dashboard' }
{ label: 'Pulso',  path: '/dashboard?tab=pulso' }
{ label: 'Ações',  path: '/dashboard?tab=acoes' }
```

### MobileMenuSheet — Extras por Papel

O botão **Menu** abre o `MobileMenuSheet` com ações complementares:
- Líder de Rede / Coordenador: Radar de Saúde, Organograma, Células
- Admin: Redes, Coordenações, Configurações, Ferramentas

### ⚠️ Anti-Pattern PWA

**NUNCA** navegue para tabs do dashboard desktop a partir de componentes PWA. Os tabs do desktop (`visao-geral`, `analises`, `multiplicacao`) não existem nas versões PWA e resultam em tela em branco.

---

## 7. FLUXO DE AUTENTICAÇÃO E ACESSO

```
1. OAuth Google/Apple
2. Verificar user_access_links → se 1: auto-redirect; se múltiplos: /trocar-funcao
3. Código de acesso → sessão 24h → scopeType + scopeId + campo_id definidos
4. ScopeMissingGate bloqueia renderização se campo_id nulo (exceto papéis globais)
5. Dashboard correto renderizado por papel
```

---

## 8. DESIGN SYSTEM

### Tokens Semânticos (src/index.css)

```css
--gold: 42 55% 50%;        /* Destaque premium */
--ruby: 0 50% 48%;         /* Alerta urgente */
--vida: 155 55% 42%;       /* Frutos espirituais */
--primary: azul (tema padrão) / verde (tema amor)
```

**Nunca use cores hardcoded** (`#fff`, `blue-500`). Use sempre tokens semânticos.

### Temas

| Tema | Variável CSS | Descrição |
|------|-------------|-----------|
| `padrao` | `:root` dark | Azul, fundo escuro |
| `amor` | `.theme-amor` | Verde, fundo escuro |
| `claro` | `.theme-claro` | Azul, fundo claro |

### Tipografia

- Display/Títulos: **Playfair Display**
- Interface: **Manrope**
- Base: **Inter**

### UX por Papel

Cada papel tem configuração em `src/lib/roleUXConfig.ts`:

```typescript
import { getRoleUXConfig } from '@/lib/roleUXConfig';
const config = getRoleUXConfig(scopeType); // greeting, quickActions, priorityAlerts
```

---

## 9. CONVENÇÕES DE DESENVOLVIMENTO

### React Query — Padrão de Invalidação

```typescript
const queryClient = useQueryClient();
// Após mutação:
queryClient.invalidateQueries({ queryKey: ['celulas'] });
```

### Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';
// NUNCA edite client.ts ou types.ts — são auto-gerados pelo Lovable
```

### Estrutura de Hook de Dados

```typescript
export function useMinhaTela() {
  const { campoId, isMissingCampo, queryKeyExtra } = useDemoScope();
  return useQuery({
    queryKey: ['minha-tabela', campoId, ...queryKeyExtra],
    enabled: !isMissingCampo,
    queryFn: async () => { /* query com campo_id */ },
  });
}
```

### Loading e Erro

Todo componente que consome dados deve tratar:
- `isLoading` → Skeleton ou `<Loader2 className="animate-spin" />`
- `error` → estado de erro visível
- `data` vazio → `<EmptyState />` com mensagem contextual

---

## 10. TABELAS PRINCIPAIS DO BANCO

| Tabela | Âncora | Descrição |
|--------|--------|-----------|
| `campos` | — | Campi/campus da igreja |
| `redes` | `campo_id` | Redes pastorais |
| `coordenacoes` | `campo_id`, `rede_id` | Coordenações |
| `celulas` | `campo_id`, `rede_id`, `coordenacao_id` | **Âncora primária** |
| `members` | herda de `celulas` | Membros |
| `weekly_reports` | `celula_id` | Relatórios semanais |
| `supervisoes` | `celula_id` | Supervisões presenciais |
| `novas_vidas` | `campo_id` | Pipeline de conversão |
| `leadership_couples` | — | Casais de liderança (spouse1_id, spouse2_id → profiles) |
| `culto_contagens` | `campo_id` | Contagens dos guardiões |
| `events_spiritual` | `campo_id` | Batismo/Aclamação |
| `fin_contas_pagar` | `campo_id` | Financeiro |
| `fin_conciliacoes` | `campo_id` | Conciliação bancária |

### Relacionamentos Chave

- `redes.leadership_couple_id` → `leadership_couples.id` (belongs_to, retorna objeto único)
- `celulas.leadership_couple_id` → `leadership_couples.id`
- `coordenacoes.leadership_couple_id` → `leadership_couples.id`
- Triggers garantem que `members.campo_id` herda de `celulas.campo_id`

---

## 11. ANTI-PATTERNS — NUNCA FAÇA

```typescript
// ❌ Query sem campo_id
const { data } = await supabase.from('celulas').select('*');

// ✅ Query com campo_id via useDemoScope
const { campoId } = useDemoScope();
const { data } = await supabase.from('celulas').select('*').eq('campo_id', campoId!);

// ❌ Usar supabase as any (indica tipo inexistente no schema)
await (supabase as any).from('tabela_que_nao_existe')...

// ❌ Cor hardcoded
<div className="bg-blue-500">

// ✅ Token semântico
<div className="bg-primary">

// ❌ Botão sem ação
<Button>Clique aqui</Button>

// ✅ Botão com ação real
<Button onClick={() => handleAction()}>Clique aqui</Button>

// ❌ Dados mockados
const data = [{ name: 'João' }, { name: 'Maria' }];

// ✅ Dados do banco via hook
const { data } = useMembers();

// ❌ Tab PWA inexistente
navigate('/dashboard?tab=visao-geral'); // ← existe só no desktop!

// ✅ Tab PWA correta
navigate('/dashboard?tab=pulso'); // ← existe em CoordinatorPWADashboard e NetworkLeaderPWADashboard
```

---

## 12. FLUXOS CRÍTICOS PARA PRESERVAR

### Pipeline Nova Vida
`Recomeço (cadastro) → Central de Células (triagem + match score) → Líder (encaminhamento) → Membro`

O match engine usa: localização 35% + tipo de célula 30% + idade 25% + horário 10%.

### Guardiões de Culto
Apenas **um culto ativo** por campus por vez. Dados salvos em `culto_contagens` com backup `localStorage`. Ao encerrar, Novas Vidas são registradas.

### Relatório Semanal
Semana operacional começa na **segunda-feira**. Hook `getDateString` padroniza o `week_start`.

---

## 13. ARQUIVOS AUTO-GERADOS — NUNCA EDITAR

```
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts
supabase/config.toml
.env (variáveis Lovable Cloud)
```

Alterações de schema → usar migrations Supabase.
Novas tabelas → sempre adicionar RLS policies.

---

## 14. COMANDOS DE DESENVOLVIMENTO

```bash
npm run dev          # Dev server (Vite)
npm run build        # Build de produção
npm run preview      # Preview do build
```

---

## 15. GLOSSÁRIO RÁPIDO

| Termo | Significado |
|-------|-------------|
| **Campo** | Campus/unidade da igreja |
| **Rede** | Conjunto de coordenações liderado por Líder de Rede |
| **Coordenação** | Conjunto de supervisores sob um coordenador |
| **Célula** | Grupo pequeno — unidade fundamental do sistema |
| **LIT** | Líder em Treinamento |
| **Nova Vida** | Pessoa em processo de conversão e integração |
| **Guardião** | Voluntário que conta público nos cultos |
| **Recomeço** | Ministério que cadastra novas vidas nos cultos |
| **Supervisão** | Visita presencial do supervisor à célula |
| **Pulso** | Métricas de saúde e engajamento em tempo real |
| **scopeType** | Tipo do escopo do usuário logado (`rede`, `coordenacao`, `celula`, etc.) |
| **scopeId** | UUID do objeto ao qual o usuário está vinculado |
