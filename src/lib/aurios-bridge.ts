// AUR.IOs HQ Event Bridge — emit eventos para a edge function ingest-event
// no agentes-hub Supabase. Configuracao via env Vite VITE_AURIOS_HQ_BRIDGE_SECRET
// (Lovable Cloud secret).
//
// Uso:
//   import { emitToAuriosHQ } from '@/lib/aurios-bridge';
//   emitToAuriosHQ('vida_cadastrada', { vida_id, summary }).catch(() => {});
//
// Padrao fire-and-forget — falha de telemetria nao deve quebrar o fluxo do usuario.

const BRIDGE_URL = 'https://zwnlpumonvkrghoxnddd.supabase.co/functions/v1/ingest-event';
// NOTE: hardcoded por decisao do usuario (frontend bundle ja exporia VITE_*).
// Se precisar rotacionar, troque aqui ou migre para edge function.
const BRIDGE_SECRET =
  (import.meta.env?.VITE_AURIOS_HQ_BRIDGE_SECRET as string | undefined) ??
  '0b1f8015513d475f200f545c1d8038eb875f3ee89183f6255ee75f67217e4e6f';

export async function emitToAuriosHQ(
  eventType: string,
  payload: Record<string, unknown> = {},
  sessionId?: string,
): Promise<void> {
  if (!BRIDGE_SECRET) {
    if (typeof console !== 'undefined') {
      console.warn('[aurios-bridge] VITE_AURIOS_HQ_BRIDGE_SECRET nao definido — skip');
    }
    return;
  }

  try {
    const res = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': BRIDGE_SECRET,
      },
      body: JSON.stringify({
        station_slug: 'atalaia',
        event_type: eventType,
        session_id: sessionId,
        payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok && typeof console !== 'undefined') {
      const body = await res.text().catch(() => '');
      console.warn('[aurios-bridge] emit failed', res.status, body);
    }
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[aurios-bridge] network error (silent):', err);
    }
  }
}
