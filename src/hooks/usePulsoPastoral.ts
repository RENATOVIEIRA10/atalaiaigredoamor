/**
 * usePulsoPastoral – alias do engine unificado com escopo 'all' (rede completa).
 * Mantém retrocompatibilidade total com os imports existentes no PastorDashboard.
 */

import { usePulsoEngine, PulsoData, CelulaAlertaStatus } from './usePulsoEngine';

// Re-exporta o tipo para não quebrar imports existentes
export type { CelulaAlertaStatus as CelulaReportStatus };
export type { PulsoData as PulsoPastoralData };

export function usePulsoPastoral() {
  return usePulsoEngine({ scopeType: 'all' });
}
