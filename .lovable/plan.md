

# Plano: Importacao Completa + Organograma com Pastores Seniores

## Resumo

Este plano cobre 4 grandes frentes: migracao de banco de dados, importacao completa dos dados da Rede Amor A 2, reestruturacao do organograma com Pastores Seniores no topo, e ajustes no frontend para suportar a hierarquia Supervisor -> Celulas.

---

## Parte 1 -- Migracao de Banco de Dados

Alteracoes necessarias nas tabelas:

### 1.1 Tabela `supervisores`
- Adicionar `leadership_couple_id UUID` (FK para `leadership_couples`)
- Adicionar `ordem INTEGER DEFAULT 0`

### 1.2 Tabela `coordenacoes`
- Adicionar `ordem INTEGER DEFAULT 0`

### 1.3 Tabela `celulas`
- Adicionar `ordem INTEGER DEFAULT 0`
- Adicionar `supervisor_id UUID` (FK para `supervisores`) -- vincula celula ao seu supervisor

### 1.4 RLS
- Manter as politicas atuais (tudo publico).

---

## Parte 2 -- Importacao de Dados (Idempotente)

A importacao sera feita via chamadas SQL sequenciais. Para cada coordenacao:

1. Atualizar nome da coordenacao (se necessario) e definir `ordem`
2. Criar casais (profiles + leadership_couples) para supervisores e lideres de celula
3. Criar/atualizar supervisores com `leadership_couple_id`
4. Criar/atualizar celulas com `leadership_couple_id`, `supervisor_id` e `ordem`

### Dados a importar:

**Renomeacoes de coordenacoes:**
- "Ilimitada" -> "Ilimitados"
- "RECOMEÇO" -> "Recomeço"

**Coordenacao 1: Aceleracao** (Davidson e Cassia, ordem 1)
- 2 supervisores: Jose Roberto e Ana Carolina; Renato e Mayara
- 14 celulas com respectivos casais lideres

**Coordenacao 2: Ilimitados** (Kleber e Kesia, ordem 2)
- 2 supervisores: Brivaldo e Naara; Junior e Karol
- 12 celulas

**Coordenacao 3: Recomeco** (Renato e Fabiana, ordem 3)
- 2 supervisores: Renan e Thaisa; Tulio e Keity
- 12 celulas + celula base Monte Siao

**Coordenacao 4: Consolidacao** (Thomaz e Dan, ordem 4)
- 2 supervisores: Silas e Midian; Shelton e Karla
- 20 celulas

**Coordenacao 5: Porcao Dobrada** (Paulo Vitor e Fran, ordem 5)
- Sem supervisores listados na importacao
- Sem celulas listadas (a definir futuramente)

### Celulas existentes no Recomeco
As 13 celulas ja cadastradas serao reutilizadas (atualizando nomes/casais conforme necessario) e novas serao criadas para as demais coordenacoes.

### Logica de supervisor + celula
Um mesmo casal pode ser supervisor E lider de celula. O vinculo e feito por `supervisor_id` na celula. As primeiras 1-2 celulas de cada coordenacao sao as que tem supervisores nomeados -- o campo `supervisor_id` nelas aponta para o registro do supervisor correspondente.

---

## Parte 3 -- Organograma com Pastores Seniores

### 3.1 Topo visual (hardcoded)
- Adicionar um no fixo "Pastores Seniores: Pr. Arthur e Pra. Talitha" no topo do organograma
- Tipo novo no `OrgNode`: `'pastor'`
- Estilo diferenciado (icone de coroa/igreja, cor dourada)
- NAO vai para o banco de dados, e apenas visual

### 3.2 Hierarquia correta no organograma
Reorganizar a arvore para:

```text
Pastores Seniores (Pr. Arthur e Pra. Talitha)
  |
  Rede Amor A 2 (Kleber e Kesia)
    |
    Coordenacao: Aceleracao (Davidson e Cassia)
      |
      Supervisor: Jose Roberto e Ana Carolina
        |-- Celula: Aquieta Minh'Alma (Jose Roberto e Ana Carolina)
        |-- Celula: Amor Eterno (Aurelino e Raquel)
        |-- ...
      Supervisor: Renato e Mayara
        |-- Celula: Familia (Renato e Mayara)
        |-- ...
```

### 3.3 Logica de agrupamento
- No `useOrganograma`, agrupar celulas por `supervisor_id`
- Celulas sem supervisor aparecem diretamente sob a coordenacao
- Supervisores mostram seus casais via `leadership_couple`
- Ordenar por campo `ordem`

---

## Parte 4 -- Ajustes no Frontend

### 4.1 Hook `useOrganograma.ts`
- Adicionar tipo `'pastor'` ao `OrgNode`
- Inserir no pastor fixo como raiz
- Agrupar celulas dentro dos seus supervisores
- Respeitar campo `ordem` para ordenacao

### 4.2 Componente `OrgNode.tsx`
- Adicionar configuracao visual para tipo `'pastor'` (icone Crown, cor dourada)
- Ajustar nivel de indentacao

### 4.3 Hook `useSupervisoes.ts`
- Atualizar interface `Supervisor` para incluir `leadership_couple_id` e dados do casal
- Atualizar queries para buscar `leadership_couple` com `spouse1` e `spouse2`

### 4.4 Hook `useCelulas.ts`
- Incluir `supervisor_id` e `ordem` nas queries

### 4.5 Hook `useCoordenacoes.ts`
- Incluir `ordem` nas queries, ordenar por `ordem`

---

## Secao Tecnica -- Ordem de Execucao

1. Executar migracao SQL (adicionar colunas `ordem`, `supervisor_id`, `leadership_couple_id`)
2. Atualizar coordenacoes existentes (nomes, ordem, casais)
3. Criar casais para todos os supervisores e lideres de celula (usando `useCreateCoupleFromNames` pattern)
4. Inserir supervisores com `leadership_couple_id` e `ordem`
5. Inserir celulas com `leadership_couple_id`, `supervisor_id` e `ordem`
6. Limpar celulas/supervisores antigos que nao fazem parte da estrutura final
7. Atualizar `useOrganograma` para nova hierarquia
8. Atualizar `OrgNode` para tipo pastor
9. Atualizar queries nos hooks

### SQL de Migracao (resumo):

```sql
-- Supervisores: adicionar couple e ordem
ALTER TABLE supervisores ADD COLUMN IF NOT EXISTS leadership_couple_id UUID REFERENCES leadership_couples(id);
ALTER TABLE supervisores ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Coordenacoes: adicionar ordem
ALTER TABLE coordenacoes ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Celulas: adicionar ordem e supervisor
ALTER TABLE celulas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE celulas ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES supervisores(id);
```

### Importacao de dados
Sera feita em lotes via SQL INSERT/UPDATE, criando primeiro os profiles e casais, depois os supervisores, e por fim as celulas com todos os vinculos corretos.

---

## Resultado Esperado

- Organograma completo com Pastores Seniores no topo
- Todas as 5 coordenacoes com seus supervisores e celulas importadas
- Supervisores exibidos como casais com suas celulas vinculadas abaixo
- Ordem visual preservada conforme especificado
- Um mesmo casal pode ser supervisor e lider de celula simultaneamente

