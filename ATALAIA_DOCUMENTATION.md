# ATALAIA OS — Dossiê Completo do Produto

> **Versão:** Março 2026  
> **Propósito:** Documentação arquitetural e funcional para contexto de IA (Claude Cloud)  
> **Lema:** *"A tecnologia que cuida do que é eterno"*

---

## 1. IDENTIDADE DO ATALAIA

### O que é

O **Atalaia** é um **Sistema Operacional Pastoral** (Atalaia OS) — não um CRM, não um ERP eclesiástico, não um sistema de gestão genérico. É um **Centro de Comando Pastoral** projetado para transformar dados frios em ações pastorais intencionais.

### Proposta Central

Servir como o **hub de inteligência e cuidado** da **Rede Amor a Dois** (braço de células da **Igreja do Amor**), permitindo que cada líder — do Líder de Célula ao Pastor Global — tenha visibilidade exata do que precisa de sua atenção, no momento certo, com o contexto correto.

### Problema que resolve

Igrejas em células operam com centenas de líderes voluntários, milhares de membros e dezenas de métricas semanais. Sem um sistema integrado:
- Líderes não sabem quem precisa de cuidado
- Pastores não têm visibilidade real do que acontece nas células
- Novas vidas se perdem entre o culto e a célula
- Dados existem em planilhas desconectadas
- Decisões pastorais são baseadas em intuição, não em evidência

O Atalaia resolve isso com **dados reais, em tempo real, filtrados por papel ministerial**.

### Por que não é um CRM/ERP comum

| Aspecto | CRM/ERP comum | Atalaia |
|---------|---------------|---------|
| Foco | Dados e processos | Pessoas e missão |
| UX | Genérica | Personalizada por papel ministerial |
| Dados | Relatórios estáticos | Inteligência contextual ativa |
| Escopo | Único banco de dados | Isolamento multicampus rigoroso |
| Ação | "Veja os dados" | "Isso precisa da sua atenção agora" |
| Filosofia | Burocracia organizada | Cuidado pastoral inteligente |

### Visão do Produto

> Ser a **plataforma mission-critical** para igrejas multicampus, unindo gestão, discipulado, financeiro, culto e crescimento em uma experiência premium que parece um app nativo — não um sistema administrativo.

### Filosofia

- **Ação antes de dashboard** — O sistema sugere o que fazer, não apenas mostra números
- **Inteligência antes de burocracia** — Cada tela resolve um problema real
- **Escopo correto sempre** — Cada líder vê apenas o que é relevante para sua missão
- **Nada pode ser só visual** — Todo botão dispara uma ação, todo dado vem do banco
- **Premium e nativo** — Experiência cinematográfica, não genérica

---

## 2. ESTRUTURA ORGANIZACIONAL

### Hierarquia Ministerial (top → bottom)

```
Pastor Senior Global (Visão de todos os campi)
  └── Pastor de Campo (Visão do campus)
        └── Líder de Rede (Gestão de coordenações)
              └── Coordenador (Gestão de supervisores e células)
                    └── Supervisor (Cuidado de líderes de célula)
                          └── Líder de Célula (Cuidado de pessoas)
                                └── Membros
                                      └── Novas Vidas (funil de conversão)
```

### Ministérios Especializados (paralelos à hierarquia)

| Papel | Função |
|-------|--------|
| **Recomeço (Porta de Entrada)** | Cadastra novas vidas no culto |
| **Central de Células** | Triagem e encaminhamento de vidas para células |
| **Líder Recomeço Central** | Gestão consolidada do funil de conversão |
| **Líder Batismo/Aclamação** | Gestão de eventos espirituais |
| **Central Batismo/Aclamação** | Operação de inscrições em eventos |
| **Guardião de Culto** | Contagem de público e conversões nos cultos |
| **Financeiro Global/Campo** | Gestão financeira institucional |
| **Secretaria Administrativa** | Apoio administrativo financeiro |

### Papéis Administrativos

| Papel | Função |
|-------|--------|
| **Administrador** | Acesso total: configurações, lideranças, campos, auditoria |
| **Demo Institucional** | Visão guiada para treinamento |
| **Leitura Pastoral** | Visualização sem edição para auditoria |

### Fluxo de dados na hierarquia

```
Líder de Célula → preenche relatório semanal (membros, visitantes, discipulados)
      ↓
Supervisor → vê saúde das células, faz supervisões presenciais
      ↓
Coordenador → consolida métricas, identifica pendências
      ↓
Líder de Rede → visão de crescimento, multiplicação, mentoria
      ↓
Pastor de Campo → panorama do campus, redes, conversões
      ↓
Pastor Global → comparativo entre campi, expansão do Reino
```

Cada nível **consome dados do nível abaixo** e **gera orientação para o nível acima**.

---

## 3. ARQUITETURA MULTICAMPUS

### Conceito

O Atalaia foi desenhado para operar com **múltiplos campi** (campos) de uma mesma igreja, com **isolamento absoluto de dados** entre eles.

### Identificadores Estruturais

| Coluna | Função |
|--------|--------|
| `campo_id` | Identifica o campus. Obrigatório em TODAS as tabelas operacionais. |
| `rede_id` | Identifica a rede dentro do campus. |
| `coordenacao_id` | Identifica a coordenação dentro da rede. |
| `supervisor_id` | Identifica o supervisor dentro da coordenação. |
| `celula_id` | A **âncora primária** — Single Source of Truth. |

### Regras de Isolamento (Zero Fallback Rule)

1. **Nenhum dado pode vazar entre campi** — Toda query filtra por `campo_id`
2. **A Célula é a âncora** — Membros, relatórios, encaminhamentos herdam `campo_id` e `rede_id` da célula
3. **Triggers de banco** garantem herança automática (ex: `trg_auto_campo_id_novas_vidas`)
4. **ScopeMissingGate** bloqueia renderização se `campo_id` for nulo
5. **UUID impossível** (`00000000-...`) é injetado em queries quando escopo está indefinido
6. **RLS (Row Level Security)** reforça isolamento no nível do banco de dados

### Visão Global vs. Local

- **Visão Global** (Pastor Senior Global, Admin): Aggrega dados de todos os campi, com drill-down por campus
- **Visão Local** (todos os outros papéis): Dados filtrados exclusivamente pelo campo ativo
- **`isGlobalView`** é persistido via `CampoContext` e controla o comportamento de todas as queries

### Hook Central de Escopo: `useDemoScope`

Injeta automaticamente filtros de `campo_id` e `is_test_data` em todas as queries. Se `campo_id` for nulo fora da visão global, força filtro por UUID inexistente — **nenhum dado vaza**.

---

## 4. MÓDULOS DO SISTEMA

### 4.1 Pastoral e Liderança

#### Dashboards por Papel
Cada papel ministerial tem um **dashboard completamente diferente**:

| Papel | Dashboard | Foco |
|-------|-----------|------|
| Líder de Célula | `CellLeaderDashboard` | Cuidado pessoal: membros, relatório, discipulado |
| Supervisor | `SupervisorDashboard` | Acompanhamento: saúde das células, supervisões |
| Coordenador | `CoordinatorDashboard` | Organização: pendências, supervisores, encaminhamentos |
| Líder de Rede | `NetworkLeaderDashboard` | Gestão estratégica: coordenações, multiplicação, mentoria |
| Pastor de Campo | `PastorDashboard` | Governo pastoral: vitalidade, crescimento, redes |
| Pastor Global | `GlobalPastorDashboard` | Visão do Reino: comparativo de campi, expansão |
| Admin | `AdminDashboard` | Torre de Controle: governança, estrutura, monitoramento |

Cada dashboard tem variante **PWA/mobile** otimizada (`*PWADashboard`).

#### Concierge (Home Personalizada)
A tela `/home` (HomeConcierge) é personalizada por papel com:
- **Hero** contextual (título, subtítulo, chips de contexto)
- **Ações rápidas** relevantes ao papel
- **Alertas prioritários** (novas vidas aguardando, relatórios pendentes, etc.)
- Configuração centralizada em `roleUXConfig.ts`

#### Torre de Controle (Admin)
Centro de governança para administradores:
- Navegação por toda a hierarquia (Campus → Rede → Coordenação → Célula)
- **Simulação de 12 papéis** sem troca de login
- Sincronização de contextos com invalidação de cache
- Hub exclusivo no PWA (`AdminPWADashboard`)

#### Organograma
Visualização hierárquica interativa:
- Pastor Senior (topo fixo) → Rede → Coordenações → Supervisores → Células
- Ordenação por campo `ordem`
- Exportação PDF via `html2canvas` + `jspdf`

#### Saúde da Rede (Radar)
Identifica automaticamente células e líderes que precisam de atenção:
- Frequência de relatórios
- Presença
- Supervisões realizadas
- Indicadores de engajamento

#### Pulso Pastoral (Pulse Engine)
Engine unificada (`usePulsoEngine`) que centraliza:
- Métricas de engajamento
- Marcos espirituais
- Aniversariantes
- Alertas pastorais
- Padronização de semana operacional (início segunda-feira)

#### Vitalidade Relacional
Mede a qualidade dos relacionamentos e cuidado dentro da rede.

#### Cuidado Espiritual
Painel de acompanhamento individual de membros com marcos espirituais.

### 4.2 Células e Discipulado

#### Gestão de Células
- CRUD completo com filtros por rede, coordenação, supervisor
- Campos: nome, endereço, bairro, dia/horário, tipo, faixa etária, perfil
- Vinculação a casal de liderança (`leadership_couple_id`)
- Aceite de novas vidas (flag `aceita_novas_vidas`)

#### Relatório Semanal (`weekly_reports`)
Base de dados fundamental do sistema:
- Presentes, visitantes, crianças, líderes em treinamento, discipulados
- Foto da célula, mensagem WhatsApp
- Compartilhamento via WhatsApp com template formatado
- Semana operacional com início segunda-feira

#### Membros (`members`)
- Perfil completo: nome, WhatsApp, bairro, estado civil, data de nascimento
- Marcos espirituais: batismo, encontro com Deus, discipulado, escola de líderes
- Flag `disponivel_para_servir` para identificar potenciais servidores
- Timeline espiritual visual (`SpiritualTimeline`)

#### Supervisões (`supervisoes`)
- Visita presencial do supervisor à célula
- Pontos positivos, pontos a alinhar, nota geral
- Planejamento bimestral (`PlanejamentoBimestralPanel`)
- Radar de saúde por supervisor

#### Discipulado (`discipulado_encontros`)
- Registro de encontros com data, participantes, observações
- Presença individual por encontro
- Visões por célula, coordenação, rede e pastor
- Integridade multicampus via triggers

#### Casais (`casais`)
- Vinculação de membros como casal dentro da célula
- Upload de foto do casal com compressão automática

### 4.3 Jornada da Nova Vida (Pipeline de Conversão)

O pipeline completo:

```
CULTO (guardião conta) → CADASTRO (Recomeço) → TRIAGEM (Central) → ENCAMINHAMENTO → CONTATO → INTEGRAÇÃO → MEMBRO
```

#### Porta de Entrada (Recomeço)
- Formulário de cadastro otimizado para uso durante o culto
- Campos: nome, WhatsApp, bairro, cidade, estado civil, faixa etária
- Operador identificado obrigatoriamente (`OperatorNameGate`)
- Mensagem de boas-vindas via WhatsApp (`BoasVindasWhatsApp`)

#### Central de Células (Triagem)
- Match engine com score (0-100%):
  - Localização: 35%
  - Tipo de célula: 30%
  - Idade: 25%
  - Horário: 10%
- Encaminhamento para célula com melhor match
- Anti-vazamento: validação de que célula destino é do mesmo campus
- Trilha de auditoria (`novas_vidas_events`)

#### Funil Recomeço
- Dashboard com KPIs por estágio
- Visão por Rede, Coordenação, Célula
- Tabs para Pastor, Rede, Coordenador
- Métricas: fila, tempo de triagem, eficácia

### 4.4 Eventos Espirituais

#### Batismo e Aclamação
- Gestão de eventos (`events_spiritual`)
- Inscrições por membro ou nova vida (`event_registrations`)
- Dashboard do líder de evento
- Central de batismo/aclamação

#### Guardiões de Culto
- **Contagem em tempo real** de público nos cultos
- Interface otimizada para mobile com botões +1, +10, -1
- Persistência em `culto_contagens` com suporte offline (localStorage)
- Registro de Novas Vidas ao encerrar
- Fluxo: Iniciar → Contar → Encerrar → Histórico
- Dados alimentam dashboard pastoral (`GuardioesPanel`)
- Proteção: apenas um culto ativo por campus

### 4.5 Inteligência Pastoral

#### Funis de Conversão
Pipeline visual: culto → nova vida → célula → membro

#### Pipeline Conversão Culto
Integração entre contagem do guardião e cadastros do Recomeço

#### Radar de Saúde
Indicadores automáticos de atenção para células e líderes

#### Vitalidade Relacional
Qualidade de relacionamentos e cuidado pastoral

#### AI Insights (Lovable AI)
- Orientações contextuais geradas por IA
- Baseadas em dados reais do `usePastoralContext`
- Modelos suportados: Gemini, GPT-5
- Edge function: `ai-insights`, `guide-ai`, `unified-ai`

#### Assistente Pastoral (Guide AI)
Chatbot integrado para orientação pastoral baseada nos dados do sistema

### 4.6 Administrativo e Financeiro

#### Contas a Pagar (`fin_contas_pagar`)
- CRUD com categorias, fornecedores, centros de custo
- Recorrência automática (mensal, semanal, etc.)
- Status: pendente → pago

#### Contas a Receber (`fin_contas_receber`)
- Mesmo modelo com origens (dízimo, oferta, evento)
- Recorrência automática

#### Fluxo de Caixa
- Projeção de saldo
- Visão temporal (diário, semanal, mensal)

#### Fornecedores (`fin_fornecedores`)
- Cadastro com categoria, cidade, contato

#### Centros de Custo (`fin_centros_custo`)
- Classificação por área (dízimo, manutenção, eventos)

#### Conciliação Bancária (`fin_conciliacoes` + `fin_extrato_items`)
- Importação de extrato (XLSX, CSV, PDF via IA, texto)
- Match inteligente com score:
  - ≥70: conciliação automática
  - ≥40: sugestão
  - Transferências internas: penalidade de 50%
- Status: pendente → conciliado → divergente → ignorado

#### Open Finance
- Integração via Pluggy para sincronização bancária
- Edge function: `open-finance-proxy`

#### Trilha de Auditoria (`fin_audit_log`)
- Log de todas as operações financeiras

#### Importação Inteligente
- XLSX via ExcelJS
- CSV direto
- PDF e imagem via IA (`parse-financial` edge function)
- Normalização monetária robusta (`parseCurrencyValue`)
- Deduplicação rigorosa (data|valor|descrição)

### 4.7 PWA / App Mobile

#### Experiência Mobile-First
- PWA com Service Worker (`vite-plugin-pwa`)
- Pull-to-refresh (`PullToRefresh`)
- Magic FAB contextual (`MagicFAB`)
- Skeletons de carregamento (`PWASkeleton`)
- Update Banner para novas versões

#### Dashboards PWA por Papel
- `CellLeaderPWADashboard`
- `SupervisorPWADashboard`
- `CoordinatorPWADashboard`
- `NetworkLeaderPWADashboard`
- `AdminPWADashboard`

#### Navegação Mobile
- Bottom navigation bar (`MobileBottomNav`)
- Menu lateral em sheet (`MobileMenuSheet`)
- Detecção de PWA vs browser (`useIsPWA`)

---

## 5. FEATURES POR ESTÁGIO

### ✅ Implementado

- Autenticação OAuth (Google/Apple) via Lovable Cloud
- Sistema de códigos de acesso com 20+ papéis ministeriais
- Sessão com expiração 24h e proteção brute-force (5 tentativas)
- Dashboards completos para 7 papéis principais + variantes PWA
- Home personalizada (Concierge) por papel
- Torre de Controle com simulação de papéis
- CRUD completo de Campos, Redes, Coordenações, Supervisores, Células, Membros
- Relatório semanal com compartilhamento WhatsApp
- Pipeline Recomeço completo (cadastro → triagem → match → encaminhamento)
- Match engine com score (localização, tipo, idade, horário)
- Guardiões de Culto com contagem em tempo real
- Eventos espirituais (Batismo/Aclamação)
- Organograma hierárquico com exportação PDF
- Radar de saúde das células
- Pulso Pastoral (engine unificada)
- Discipulado com presença por encontro
- Módulo financeiro completo (contas, fluxo, conciliação, fornecedores)
- Importação inteligente (XLSX, CSV, PDF/IA)
- Open Finance via Pluggy
- PWA com Service Worker
- Barra de comandos universal (⌘K)
- Memória de navegação persistente
- Glossário integrado
- Manual do usuário e do líder
- Guia do Admin
- Onboarding progressivo por papel
- 3 temas: Padrão (dark), Claro, Amor
- Demo institucional guiado
- Seed data para testes
- Versionamento com gate de atualização
- Políticas de privacidade com aceite obrigatório
- Compressão automática de imagens
- AI Insights via Lovable AI
- Assistente Pastoral (Guide AI)

### 🔧 Parcialmente Implementado

- Multiplicações (registro existe, visual de timeline em construção)
- Liderança em formação (flag existe em relatórios, dashboard específico pendente)
- Planejamento bimestral de supervisões (formulário existe, automação pendente)
- Recomendações de liderança por IA (dialog existe, engine de ML pendente)
- Integração Guardiões ↔ Recomeço (colunas existem, link automático pendente)
- Email de relatório da Rede (dialog existe, envio real pendente)

### 🎯 Visão Futura

- Notificações push via PWA
- Integração WhatsApp Business API
- Dashboard de voluntariado
- Módulo de EBD (Escola Bíblica)
- Gamificação para líderes (conquistas, badges)
- App nativo (React Native)
- Integração com plataformas de streaming (culto online)
- IA preditiva (churn de membros, potencial de multiplicação)
- Multi-idioma (inglês, espanhol)

---

## 6. FLUXOS CRÍTICOS

### Fluxo de Acesso

```
1. Usuário faz login (Google/Apple OAuth)
2. Sistema verifica links de acesso vinculados (user_access_links)
3. Se 1 link: auto-redirect para dashboard correto
4. Se múltiplos: tela de seleção de função (/trocar-funcao)
5. Se nenhum: tela de código de acesso (/)
6. Código validado → sessão criada (24h) → escopo definido
7. Campo resolvido automaticamente → Dashboard renderizado
```

### Fluxo Nova Vida (Pipeline Completo)

```
1. CULTO: Guardião inicia contagem de público
2. CADASTRO: Operador Recomeço cadastra decisão de fé
3. WHATSAPP: Mensagem de boas-vindas automática
4. TRIAGEM: Central de Células recebe na fila
5. MATCH: Engine calcula score (localização 35%, tipo 30%, idade 25%, horário 10%)
6. ENCAMINHAMENTO: Triador encaminha para célula com melhor match
7. CONTATO: Líder de célula entra em contato via WhatsApp
8. INTEGRAÇÃO: Nova vida participa da célula
9. MEMBRO: Promovida a membro ativo com perfil completo
10. DASHBOARDS: Todos os níveis veem as métricas atualizadas
```

### Fluxo de Culto (Guardiões)

```
1. Guardião faz login com código de acesso (scope: guardioes_culto)
2. Abre dashboard do Guardião (/guardioes)
3. Clica "Iniciar Contagem" → define horário do culto
4. Durante o culto: conta público (+1, +10, -1) com haptic feedback
5. Dados sincronizam com banco em tempo real + backup localStorage
6. Ao encerrar: informa Novas Vidas e observações
7. Contagem congelada com status "encerrado"
8. Dados alimentam GuardioesPanel no dashboard pastoral
9. Pode iniciar nova contagem (novo horário do mesmo dia)
```

### Fluxo Financeiro

```
1. Lançamento manual de conta a pagar/receber
   OU Importação inteligente (XLSX, CSV, PDF, texto)
2. Normalização monetária e deduplicação automática
3. Categorização e vinculação a centro de custo
4. Recorrências geram parcelas automaticamente
5. Extrato bancário importado (ou sincronizado via Open Finance)
6. Conciliação com match inteligente (score ≥70 = auto)
7. Dashboard financeiro com projeções e tendências
8. Trilha de auditoria registra todas as operações
```

### Fluxo de Relatório Semanal

```
1. Líder de célula abre Dashboard → Aba "Ações"
2. Preenche: presentes, visitantes, crianças, LITs, discipulados
3. Adiciona foto e mensagem de WhatsApp (opcional)
4. Salva relatório → dados vinculados a celula_id + week_start
5. Supervisor vê no seu dashboard quais células enviaram
6. Coordenador consolida métricas de todas as células
7. Líder de Rede vê tendências e comparativos
8. Pastor vê panorama geral do campus
```

---

## 7. IDENTIDADE VISUAL E FILOSOFIA DE UX

### Design Cinematográfico

O Atalaia não parece um sistema — parece um **centro de comando espacial**:

- **Gradientes radiais sutis** em gold e primary como camadas ambientais
- **Grid sutil de fundo** (80px) para textura
- **Animações Framer Motion** para transições fluidas
- **Microinterações** com haptic feedback (vibração) nos contadores
- **Celebração visual** para marcos espirituais (CelebrationGlow)

### Temas

| Tema | Background | Primary | Vibe |
|------|-----------|---------|------|
| **Padrão** (dark) | HSL 225 44% 5% | HSL 220 65% 55% (azul) | Comando noturno |
| **Amor** (dark-alt) | HSL 225 44% 5% | HSL 155 45% 45% (verde) | Esperança pastoral |
| **Claro** | HSL 210 25% 97% | HSL 220 60% 48% (azul) | Clareza diurna |

### Tokens Semânticos (index.css)

```css
--gold: 42 55% 50%;        /* Destaque premium, ações especiais */
--ruby: 0 50% 48%;          /* Alertas, atenção urgente */
--vida: 155 55% 42%;        /* Conversões, frutos espirituais */
--success: 155 55% 42%;     /* Ações concluídas */
--warning: 38 85% 52%;      /* Atenção moderada */
--destructive: 0 62% 50%;   /* Erros, ações destrutivas */
```

### Tipografia

- **Display/Títulos:** Playfair Display (serifada, elegante)
- **Interface:** Manrope (geométrica, moderna)
- **Base:** Inter (legibilidade)

### UX por Papel Ministerial

Cada papel tem personalização definida em `roleUXConfig.ts`:

| Papel | Greeting | Subtítulo | Accent |
|-------|----------|-----------|--------|
| Líder de Célula | "Sua Célula Hoje" | "Cuide de quem Deus colocou em suas mãos." | primary |
| Supervisor | "Sua Supervisão Hoje" | "Cuide dos líderes que cuidam de pessoas." | primary |
| Coordenador | "Sua Coordenação Hoje" | "Organize para que o Reino avance." | primary |
| Líder de Rede | "Sua Rede Hoje" | "Desenvolva líderes que multiplicam." | primary |
| Pastor de Campo | "Seu Campus Hoje" | "Governe com sabedoria, cuide com amor." | gold |
| Pastor Global | "Visão Global do Reino" | "Discerna o movimento de Deus entre as nações." | gold |
| Admin | "Torre de Controle" | "Visão completa. Controle total." | primary |
| Guardião | "Guardião do Culto" | "Registre a presença e os frutos do culto de hoje." | primary |

### PWA vs Desktop

| Aspecto | Desktop | PWA/Mobile |
|---------|---------|------------|
| Sidebar | Completa com seções | Bottom nav + sheet |
| Dashboards | Full com múltiplas tabs | Versão compacta PWA |
| Tabelas | Colunas completas | Cards empilhados |
| Ações | Botões inline | FAB flutuante contextual |

---

## 8. PRINCÍPIOS DE PRODUTO

1. **Ação antes de dashboard** — Cada tela começa com "o que precisa da minha atenção"
2. **Inteligência antes de burocracia** — IA gera orientações, não apenas gráficos
3. **Escopo correto sempre** — Zero Fallback Rule impede vazamento de dados
4. **Nada pode ser só visual** — Todo componente consome dados reais do banco
5. **Cada função deve consumir dados reais** — Sem mocks em produção
6. **Cada papel vê o que faz sentido** — UX totalmente personalizada
7. **O sistema deve reduzir trabalho humano** — Automações (recorrências, herança de campos, match)
8. **O sistema deve parecer premium e nativo** — Cinematográfico, não genérico
9. **Tudo precisa estar conectado** — Dados fluem entre módulos automaticamente
10. **Célula é a âncora** — Toda atividade se vincula a uma célula

---

## 9. O QUE O CLOUD PRECISA ENTENDER ANTES DE DESENVOLVER

### Regras de Escopo

- **SEMPRE** filtre por `campo_id` em queries de dados operacionais
- Use `useDemoScope()` para obter `campoId` e `isTestData` automaticamente
- **NUNCA** assuma um campus padrão — use ScopeMissingGate
- Papéis globais (Admin, Pastor Senior) podem ter `campo_id = null` com `isGlobalView = true`
- Papéis locais **DEVEM** ter `campo_id` definido ou a UI bloqueia

### Lógica Multicampus

- `campo_id` é **NOT NULL** em todas as tabelas operacionais
- Triggers de banco garantem herança automática (célula → membros, relatórios, etc.)
- RLS policies reforçam isolamento no nível do banco
- **NUNCA** misture dados de campi diferentes em uma mesma view

### Integração Real com o Backend

- Use `supabase` client de `@/integrations/supabase/client`
- **NUNCA** edite `client.ts`, `types.ts` ou `.env` — são auto-gerados
- Use migrations para alterações de schema
- Use edge functions para lógica server-side
- Tabelas novas precisam de RLS policies adequadas

### Full-Stack Real

- **NUNCA** crie botões sem ação funcional
- **NUNCA** crie telas com dados mockados em produção
- **SEMPRE** persista dados no banco de dados
- **SEMPRE** invalide queries após mutações
- **SEMPRE** trate estados de loading e erro

### Respeito à Hierarquia

- Líder de célula NÃO vê dados de outras células
- Supervisor NÃO vê células fora de sua supervisão
- Coordenador NÃO vê dados de outras coordenações
- Líder de Rede NÃO vê dados de outras redes
- Pastor de Campo NÃO vê dados de outros campi

### UX Coerente por Papel

- Use `getRoleUXConfig(scopeType)` para personalização
- Dashboards PWA são versões compactas, não cópias
- Sidebar items variam por papel (`AppSidebar.tsx`)
- Bottom nav varia por papel (`MobileBottomNav.tsx`)

---

## 10. RISCOS DE DESENVOLVIMENTO (Anti-Patterns)

### ❌ NUNCA faça:

1. **Criar botão sem ação** — Todo botão deve disparar uma operação real
2. **Criar tela sem leitura do banco** — Todo dado exibido deve vir de uma query real
3. **Misturar dados entre campos** — Zero Fallback Rule é inviolável
4. **Mostrar dados errados por papel** — Cada papel tem seu dashboard específico
5. **Fazer experiência genérica** — Cada papel tem personalização em `roleUXConfig.ts`
6. **Criar algo só bonito e não funcional** — Estética sem função é proibida
7. **Duplicar lógica** — Use hooks existentes, não recrie queries
8. **Quebrar fluxo existente** — Teste regressão antes de alterar
9. **Usar `(supabase as any)`** — Indica que o tipo não existe no schema; crie migration primeiro
10. **Usar cores hardcoded** — Use tokens semânticos do design system
11. **Editar arquivos auto-gerados** — `client.ts`, `types.ts`, `.env`, `config.toml`
12. **Criar tabelas sem RLS** — Toda tabela precisa de políticas de segurança
13. **Usar CHECK constraints com `now()`** — Use validation triggers
14. **Modificar schemas reservados** — `auth`, `storage`, `realtime`, etc.
15. **Armazenar roles em `profiles`** — Use `user_roles` separada com `has_role()`

---

## 11. VISÃO DE FUTURO

### Curto Prazo (2026)
- Consolidar integração Guardiões ↔ Recomeço
- Notificações push (PWA)
- Dashboard de multiplicações visual
- Relatório pastoral por email
- Plano de discipulado integrado ao livro do ano

### Médio Prazo (2026-2027)
- Integração WhatsApp Business API
- IA preditiva (churn de membros, potencial de multiplicação)
- Dashboard de voluntariado e ministérios
- Módulo de EBD (Escola Bíblica Dominical)
- Multi-idioma (inglês, espanhol)

### Longo Prazo (2027+)
- Plataforma white-label para outras igrejas
- App nativo (React Native)
- Marketplace de integrações
- Análise de sentimento em relatórios
- Planejamento estratégico assistido por IA
- Integração com plataformas de streaming
- Certificação de segurança para dados sensíveis

### Ambição

> O Atalaia aspira ser o **sistema operacional pastoral de referência** para igrejas multicampus, transformando a gestão eclesiástica de um fardo administrativo em uma **experiência de inteligência espiritual** — onde cada dado conta uma história de vidas transformadas.

---

## 12. STACK TECNOLÓGICO

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui + Framer Motion |
| Estado | TanStack React Query + Context API |
| Roteamento | React Router DOM v6 |
| Backend | Lovable Cloud (Supabase) |
| Banco | PostgreSQL com RLS |
| Auth | OAuth (Google/Apple) via Lovable Cloud Auth |
| Edge Functions | Deno (Supabase Edge Functions) |
| IA | Lovable AI (Gemini, GPT-5) |
| PWA | vite-plugin-pwa |
| Gráficos | Recharts |
| PDF | jspdf + html2canvas |
| Planilhas | ExcelJS |
| QR Code | qrcode.react |

---

## 13. ESTRUTURA DE ARQUIVOS

```
src/
├── App.tsx                    # Router + Providers
├── main.tsx                   # Entry point
├── index.css                  # Design tokens + themes
├── contexts/                  # Global state
│   ├── AuthContext.tsx         # OAuth session
│   ├── RoleContext.tsx         # 20+ papéis ministeriais
│   ├── CampoContext.tsx        # Campus ativo
│   ├── RedeContext.tsx         # Rede ativa
│   ├── DemoModeContext.tsx     # Modo validação
│   ├── ThemeContext.tsx        # 3 temas
│   └── TorreControleContext.tsx # Admin tower
├── hooks/                     # 80+ hooks de dados
│   ├── useDemoScope.ts        # Escopo central (campo_id filter)
│   ├── usePulsoEngine.ts      # Engine de métricas unificada
│   ├── useGuardioesCulto.ts   # Contagem de culto
│   ├── useRecomecoFunnel.ts   # Pipeline de conversão
│   └── ...
├── components/
│   ├── dashboard/             # Dashboards por papel
│   ├── layout/                # AppLayout, Sidebar, MobileNav
│   ├── ui/                    # shadcn/ui components
│   └── ...
├── pages/                     # Rotas
├── lib/                       # Utilitários
│   ├── appMap.ts              # Mapa do produto (SSoT)
│   ├── roleUXConfig.ts        # UX por papel
│   ├── avatarPermissions.ts   # Permissões hierárquicas
│   └── ...
├── services/
│   └── unifiedAI.ts           # Integração IA
└── integrations/
    ├── supabase/              # Auto-gerado
    └── lovable/               # Cloud auth
```

---

*Documento gerado em Março de 2026 como referência arquitetural completa do Atalaia OS.*
