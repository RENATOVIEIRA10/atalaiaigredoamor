const botUrl = process.env.AGENTE_CELULAS_BASE_URL || 'http://104.131.187.118:3000';
const edgeUrl = process.env.WHATSAPP_OPS_URL;

async function readJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

const health = await readJson(`${botUrl.replace(/\/$/, '')}/health`);
console.log('[bot health]', health.res.status, health.body?.connection, {
  queue_pending: health.body?.queue_pending,
  pending_confirmations: health.body?.pending_confirmations,
  database_write_ok: health.body?.database_write_ok,
  commit_sha: health.body?.commit_sha,
});

if (!health.body || typeof health.body.connection !== 'string') {
  throw new Error('Bot health nao retornou payload esperado');
}

if (edgeUrl) {
  const edge = await readJson(edgeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'overview' }),
  });
  console.log('[edge unauth]', edge.res.status, edge.body);
  if (edge.res.status !== 401) {
    throw new Error(`Edge Function sem JWT deveria retornar 401, retornou ${edge.res.status}`);
  }
} else {
  console.log('[edge unauth] pulado: defina WHATSAPP_OPS_URL para validar 401');
}
