/**
 * usePulsoRede – alias do engine unificado para escopos de coordenação e rede.
 * Mantém retrocompatibilidade total com imports existentes.
 */

import { usePulsoEngine, PulsoData, PulsoStagnantMember, PulsoBirthday, CelulaAlertaStatus } from './usePulsoEngine';
import { useDemoScope } from './useDemoScope';

// Re-exporta tipos para compatibilidade
export type { PulsoStagnantMember as StagnantMemberScoped };
export type { PulsoBirthday as ScopedBirthday };
export type { CelulaAlertaStatus as CelulaReportStatus };
export type PulsoRedeData = PulsoData;

interface UsePulsoRedeOptions {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

export function usePulsoRede({ scopeType, scopeId }: UsePulsoRedeOptions) {
  const { campoId } = useDemoScope();
  return usePulsoEngine({ scopeType, scopeId, campoId, enabled: !!scopeId });
}
