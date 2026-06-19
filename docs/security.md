# Segurança — Atalaia OS

Este documento registra o contrato mínimo de segurança para desenvolvimento, deploy e manutenção do Atalaia OS.

## Secrets e variáveis de ambiente

- Nunca commitar valores reais de secrets, service-role keys, tokens, senhas ou chaves privadas.
- O frontend deve receber apenas chaves públicas/publishable, como `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Service-role keys só podem existir em ambientes server-side controlados: Supabase Edge Functions, Lovable/Vercel server-side ou operadores autorizados.
- Use `.env.example` como contrato de configuração local. O arquivo `.env` real continua ignorado pelo Git.

## Supabase client do frontend

`src/integrations/supabase/client.ts` exige explicitamente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` ou, por compatibilidade, `VITE_SUPABASE_ANON_KEY`

Não deve haver fallback hardcoded para produção dentro do bundle. Isso reduz o risco de um deploy local/staging apontar acidentalmente para o banco de produção.

## Incidente encerrado: função temporária de revelação de chave

A função `supabase/functions/temp-key-reveal` foi removida do código porque expunha variáveis sensíveis mediante senha temporária hardcoded.

Ações operacionais recomendadas:

1. Confirmar no painel/CLI da Supabase se a função ainda está deployada no projeto `yjwdlsjatqafzofgdyob`.
2. Se estiver deployada, remover imediatamente.
3. Rotacionar a `SUPABASE_SERVICE_ROLE_KEY` caso a função tenha sido acessível fora de uma janela controlada.
4. Revisar logs de invocação da função removida.
5. Não criar funções de debug que retornem secrets. Para diagnóstico, usar logs server-side sanitizados ou acesso administrativo temporário e auditável.

## Autorização e escopo

- Estado em `localStorage` é apenas conveniência de UX, nunca fonte final de autorização.
- Toda autorização sensível precisa ser reforçada por RLS, policies e/ou Edge Functions server-side.
- Rotas operacionais devem ter uma matriz explícita de papéis permitidos.
- Queries operacionais devem filtrar por `campo_id`, exceto em visão global autorizada.
- O hook `useDemoScope()` deve ser o caminho padrão para filtros de campus/rede em hooks de dados.

## Rotas e papéis

Manter uma revisão periódica de rotas em `src/App.tsx` e `src/components/RoleProtectedRoute.tsx`:

- rotas públicas: conteúdo institucional e login;
- rotas autenticadas sem papel: entrada/seleção de função;
- rotas com papel: dashboards e módulos operacionais;
- rotas ministeriais especiais: Recomeço, Central de Células, Guardiões, Financeiro.

Sempre que uma rota operacional nova for criada, registrar:

- papéis permitidos;
- se exige `campo_id`;
- se permite visão global;
- comportamento PWA/mobile;
- quais tabelas Supabase são acessadas.

## Checklist para mudanças de schema

- Criar migration em `supabase/migrations/`.
- Habilitar RLS quando a tabela armazenar dados operacionais ou pessoais.
- Adicionar policies compatíveis com escopo ministerial.
- Regenerar tipos Supabase quando o workflow permitir.
- Evitar `(supabase as any)` como solução permanente.

## Validação mínima antes de deploy

```bash
npx tsc --noEmit --pretty false
npm run test -- --run
npm run build
```

Quando lint completo for lento, rodar lint focado nos arquivos alterados e registrar a limitação.
