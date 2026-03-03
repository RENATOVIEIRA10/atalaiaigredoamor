import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

/**
 * Returns the campo_id to filter queries by, or null for global view.
 * Also exposes `isMissingCampo` — true when user SHOULD have a campus but doesn't.
 */
export function useCampoFilter(): string | null {
  const { activeCampoId, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, isAdmin } = useRole();

  const canGlobal = isPastorSeniorGlobal || isAdmin;

  if (canGlobal && isGlobalView) return null;

  return activeCampoId;
}

/** Detailed version that also reports missing campus */
export function useCampoFilterDetailed() {
  const { activeCampoId, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, isAdmin } = useRole();

  const canGlobal = isPastorSeniorGlobal || isAdmin;
  const isGlobal = canGlobal && isGlobalView;

  return {
    campoId: isGlobal ? null : activeCampoId,
    isGlobal,
    /** True when user is NOT in global mode but has no campus set */
    isMissingCampo: !isGlobal && !activeCampoId,
  };
}
