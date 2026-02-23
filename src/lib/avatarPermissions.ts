/**
 * Hierarchical avatar editing permissions.
 *
 * Rules:
 *  - Admin can edit ALL.
 *  - Each level can edit levels BELOW it.
 *  - "Self" means the viewer's scopeType matches the entity's type
 *    (actual scope match is handled by the caller via canEdit prop).
 *
 * Hierarchy (top → bottom):
 *   pastor > rede > coordenacao > supervisor > celula > membro
 */

type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura';
type EntityType = 'celula' | 'supervisor' | 'coordenacao' | 'rede' | 'pastor' | 'membro';

// Numeric rank: higher = more authority
const SCOPE_RANK: Record<ScopeType, number> = {
  admin: 100,
  pastor: 90,
  rede: 80,
  coordenacao: 70,
  supervisor: 60,
  celula: 50,
  demo_institucional: 0,
  recomeco_operador: 10,
  recomeco_leitura: 5,
};

// The minimum viewer rank required to edit a given entity type
const ENTITY_MIN_RANK: Record<EntityType, number> = {
  membro: 50,       // celula_leader and above
  celula: 60,       // supervisor and above (or self)
  supervisor: 70,   // coordenador and above (or self)
  coordenacao: 80,  // rede_leader and above (or self)
  rede: 100,        // admin only (or self)
  pastor: 100,      // admin only (or self)
};

/**
 * Returns true if the current viewer can edit the avatar of the given entity.
 *
 * @param viewerScopeType  The scopeType of the current session (from RoleContext)
 * @param entityType       The type of entity whose photo is being viewed
 * @param isSelf           Whether the viewer IS the entity (same couple/person)
 */
export function canEditAvatar(
  viewerScopeType: ScopeType | null,
  entityType: EntityType,
  isSelf: boolean = false,
): boolean {
  if (!viewerScopeType) return false;

  // Admin can always edit
  if (viewerScopeType === 'admin') return true;

  // Self can always edit their own photo
  if (isSelf) return true;

  const viewerRank = SCOPE_RANK[viewerScopeType] ?? 0;
  const requiredRank = ENTITY_MIN_RANK[entityType] ?? 999;

  return viewerRank >= requiredRank;
}
