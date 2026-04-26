// AUR.IOs HQ Event Bridge — chama a edge function aurios-bridge-emit
// no Supabase do Atalaia, que adiciona o x-bridge-secret server-side
// e reenvia para o agentes-hub. O segredo nunca vai para o bundle do browser.
//
// Uso:
//   import { emitToAuriosHQ } from '@/lib/aurios-bridge';
//   emitToAuriosHQ('vida_cadastrada', { vida_id, summary }).catch(() => {});
//
// Padrao fire-and-forget — falha de telemetria nao deve quebrar o fluxo do usuario.

import { supabase } from '@/integrations/supabase/client';

export async function emitToAuriosHQ(
  eventType: string,
  payload: Record<string, unknown> = {},
  sessionId?: string,
): Promise<void> {
  // DEBUG TEMP: log dispatch + outcome (remover apos confirmar funcionando)
  console.log("[aurios-bridge] emitToAuriosHQ START", { eventType, hasSessionId: !!sessionId });
  try {
    const { data, error } = await supabase.functions.invoke(
      'aurios-bridge-emit',
      {
        body: {
          event_type: eventType,
          payload,
          session_id: sessionId,
        },
      },
    );

    if (error && typeof console !== 'undefined') {
      console.error('[aurios-bridge] FAIL emit', error);
      return;
    }

    if (
      data &&
      typeof data === 'object' &&
      'ok' in data &&
      (data as { ok: boolean }).ok !== true &&
      typeof console !== 'undefined'
    ) {
      console.error('[aurios-bridge] FAIL hq rejected', data);
    }
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.error('[aurios-bridge] FAIL network error:', err);
    }
  }
}
