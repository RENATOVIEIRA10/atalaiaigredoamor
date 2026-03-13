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

type ScopeType = 'pastor' | 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula' | 'demo_institucional' | 'recomeco_operador' | 'recomeco_leitura' | 'recomeco_cadastro' | 'central_celulas' | 'lider_recomeco_central' | 'lider_batismo_aclamacao' | 'central_batismo_aclamacao' | 'pastor_senior_global' | 'pastor_de_campo' | 'financeiro_global' | 'financeiro_campo' | 'secretaria_admin' | 'guardioes_culto';
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
  recomeco_cadastro: 10,
  central_celulas: 15,
  lider_recomeco_central: 20,
  lider_batismo_aclamacao: 15,
  central_batismo_aclamacao: 10,
  pastor_senior_global: 95,
  pastor_de_campo: 90,
  financeiro_global: 30,
  financeiro_campo: 25,
  secretaria_admin: 20,
  guardioes_culto: 10,
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
