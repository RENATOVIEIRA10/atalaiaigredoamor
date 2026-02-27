import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

/**
 * Returns the campo_id to filter queries by, or null for global view.
 * 
 * Logic:
 * - pastor_senior_global / admin with global view → null (no filter)
 * - pastor_senior_global / admin with campo selected → campo_id
 * - All other roles → campo_id from their context (falls back to access_key campo)
 */
export function useCampoFilter(): string | null {
  const { activeCampoId, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, isAdmin } = useRole();

  const canGlobal = isPastorSeniorGlobal || isAdmin;

  if (canGlobal && isGlobalView) return null;

  return activeCampoId;
}
