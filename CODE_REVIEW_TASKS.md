# Revisão da base de código — tarefas recomendadas

## 1) Tarefa de correção de digitação/texto
**Problema encontrado:** o `README.md` ainda contém placeholders (`REPLACE_WITH_PROJECT_ID`, `<YOUR_GIT_URL>`, `<YOUR_PROJECT_NAME>`) do template inicial, o que passa a impressão de texto “não finalizado”.

**Tarefa sugerida:** substituir placeholders por valores reais do projeto (ou instruções genéricas corretas sem placeholders), revisando também o título e a seção de onboarding para refletir o nome real do sistema.

**Impacto:** reduz ambiguidade para novos colaboradores e evita erros de cópia/cola ao seguir o setup.

---

## 2) Tarefa de correção de bug
**Problema encontrado:** em `src/lib/whatsapp.ts`, a função `normalizePhone` não valida regras de telefone móvel/DDD com o nível de detalhe descrito no cabeçalho. Na prática, números apenas pelo tamanho podem passar pela normalização sem validação mais precisa de estrutura.

**Tarefa sugerida:** implementar validação explícita por formato brasileiro (DDI + DDD + 8/9 dígitos), incluindo regras para distinguir fixo/móvel e cenários inválidos (ex.: comprimento incorreto após normalização).

**Impacto:** evita geração de links `wa.me` inválidos e melhora a qualidade dos contatos processados.

---

## 3) Tarefa de ajuste de comentário/discrepância de documentação
**Problema encontrado:** existe discrepância entre o que o comentário de `normalizePhone` afirma (regras detalhadas) e o comportamento efetivo implementado.

**Tarefa sugerida:** após corrigir a validação, alinhar o comentário com o comportamento real (ou, se a regra desejada for mais simples, simplificar o comentário para não prometer validações não implementadas).

**Impacto:** evita entendimento incorreto por quem mantém o código e reduz risco de regressão.

---

## 4) Tarefa para melhorar teste
**Problema encontrado:** a suíte atual tem apenas um teste genérico (`src/test/example.test.ts`) que não cobre comportamento crítico de negócio.

**Tarefa sugerida:** criar testes unitários para `src/lib/whatsapp.ts`, cobrindo pelo menos:
- normalização com/sem DDI;
- números inválidos (curtos, longos, caracteres inesperados);
- geração de link com mensagem (`buildWhatsAppLink`) e codificação de texto;
- caminho de falha (retorno `null`/`false`).

**Impacto:** aumenta confiança em uma função usada por múltiplos módulos e diminui chance de regressões.
