# WhatsApp Ops Runbook

## Objetivo

Operar a Central WhatsApp do Atalaia integrada ao `agente-celulas`.

## Deploy normal

1. Mergear o PR do Atalaia no GitHub.
2. Confirmar no Lovable que o deploy do projeto terminou sem erro.
3. Mergear o PR do `agente-celulas`.
4. Na VPS:

```bash
cd /root/agente-celulas
git pull --ff-only origin master
node --check server.js
pm2 restart agente-celulas
pm2 status agente-celulas
curl -s http://127.0.0.1:3000/health
```

## Supabase

- Migration obrigatoria: `supabase/migrations/20260619090000_whatsapp_ops.sql`
- Edge Function obrigatoria: `supabase/functions/whatsapp-ops/index.ts`
- Secret obrigatorio: `AGENTE_CELULAS_BASE_URL`
- `verify_jwt` deve ficar `true` para `whatsapp-ops`.

## Smoke

```bash
npm run smoke:whatsapp-ops
```

Com URL da Edge Function:

```bash
$env:WHATSAPP_OPS_URL="https://<project>.supabase.co/functions/v1/whatsapp-ops"
npm run smoke:whatsapp-ops
```

Resultado esperado:

- `/health` do bot retorna JSON com `connection`, fila, confirmacoes e `commit_sha`.
- Edge Function sem JWT retorna `401`.
- Na UI, acessar Central WhatsApp com funcao autorizada e validar:
  - cards de conexao, pendencias, confirmar, sem relatorio e ultima mensagem;
  - QR abre quando `has_qr=true`;
  - envio manual cria mensagem outbound;
  - mudanca de status exige nota;
  - detalhe da mensagem abre historico/eventos.

## Rollback

1. Reverter o PR do `agente-celulas` e aplicar na VPS:

```bash
cd /root/agente-celulas
git pull --ff-only origin master
pm2 restart agente-celulas
```

2. Reverter o PR do Atalaia se a Central quebrar no Lovable.
3. Nao dropar tabelas `whatsapp_messages` e `whatsapp_events`; elas sao trilha de auditoria.
