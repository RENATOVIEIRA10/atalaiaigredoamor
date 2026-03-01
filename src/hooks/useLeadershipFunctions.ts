import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeadershipFunction {
  id: string;
  leadership_couple_id: string | null;
  profile_id: string | null;
  function_type: string;
  scope_entity_id: string | null;
  scope_entity_type: string | null;
  campo_id: string | null;
  rede_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnifiedLeader {
  /** leadership_couple_id or profile_id (prefixed) */
  key: string;
  coupleId: string | null;
  profileId: string | null;
  isCouple: boolean;
  person1: { id: string; name: string; avatar_url: string | null } | null;
  person2: { id: string; name: string; avatar_url: string | null } | null;
  functions: UnifiedFunction[];
}

export interface UnifiedFunction {
  id: string; // leadership_functions.id
  functionType: string;
  functionLabel: string;
  scopeEntityId: string | null;
  scopeEntityType: string | null;
  scopeEntityName: string;
  parentName?: string;
  campoId: string | null;
  campoName: string;
  accessCode?: string;
  accessKeyId?: string;
  accessKeyActive?: boolean;
}

const FUNCTION_LABELS: Record<string, string> = {
  celula_leader: 'Líder de Célula',
  supervisor: 'Supervisor',
  coordenador: 'Coordenador',
  rede_leader: 'Líder de Rede',
  pastor_de_campo: 'Pastor de Campo',
  pastor_senior_global: 'Pastor Sênior Global',
  admin: 'Administrador',
  lider_recomeco_central: 'Líder Recomeço + Central',
  lider_batismo_aclamacao: 'Líder Batismo / Aclamação',
  central_batismo_aclamacao: 'Central Batismo / Aclamação',
  central_celulas: 'Central de Células',
  recomeco_cadastro: 'Recomeço (Cadastro)',
  recomeco_operador: 'Operador Recomeço',
  recomeco_leitura: 'Leitura Pastoral',
  demo_institucional: 'Demo Institucional',
};

const SCOPE_TYPE_FOR_ACCESS_KEY: Record<string, string> = {
  celula_leader: 'celula',
  supervisor: 'supervisor',
  coordenador: 'coordenacao',
  rede_leader: 'rede',
  pastor_de_campo: 'pastor_de_campo',
  pastor_senior_global: 'pastor_senior_global',
  admin: 'admin',
  lider_recomeco_central: 'lider_recomeco_central',
  lider_batismo_aclamacao: 'lider_batismo_aclamacao',
  central_batismo_aclamacao: 'central_batismo_aclamacao',
  central_celulas: 'central_celulas',
  recomeco_cadastro: 'recomeco_cadastro',
  recomeco_operador: 'recomeco_operador',
  recomeco_leitura: 'recomeco_leitura',
  demo_institucional: 'demo_institucional',
};

/** Functions that are truly global and don't require campus */
export const GLOBAL_FUNCTION_TYPES = ['pastor_senior_global', 'admin'];

export function getFunctionLabel(ft: string) {
  return FUNCTION_LABELS[ft] || ft;
}

export function getScopeTypeForAccessKey(ft: string) {
  return SCOPE_TYPE_FOR_ACCESS_KEY[ft] || ft;
}

export function useLeadershipFunctions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leadership_functions_unified'],
    queryFn: async () => {
      // 1) Fetch all active leadership_functions
      const { data: funcs, error: fErr } = await supabase
        .from('leadership_functions')
        .select('*')
        .eq('active', true)
        .order('created_at');
      if (fErr) throw fErr;

      // 2) Fetch all campos for name resolution
      const { data: allCampos } = await supabase.from('campos').select('id, nome').eq('ativo', true);
      const campoNameMap = new Map<string, string>();
      for (const c of (allCampos || [])) campoNameMap.set(c.id, c.nome);

      // 3) Fetch all leadership_couples with profiles
      const coupleIds = [...new Set((funcs || []).filter(f => f.leadership_couple_id).map(f => f.leadership_couple_id!))];
      const profileIds = [...new Set((funcs || []).filter(f => f.profile_id && !f.leadership_couple_id).map(f => f.profile_id!))];

      let couplesMap = new Map<string, { spouse1: any; spouse2: any }>();

      let profilesMap = new Map<string, any>();

      // 4) Fetch access keys to match codes
      const { data: accessKeys } = await supabase
        .from('access_keys')
        .select('id, scope_type, scope_id, code, active, campo_id')
        .order('created_at', { ascending: false });

      // 5) Fetch entity names
      const entityNameCache = new Map<string, string>();
      const parentNameCache = new Map<string, string>();

      const celulaIds = (funcs || []).filter(f => f.scope_entity_type === 'celula' && f.scope_entity_id).map(f => f.scope_entity_id!);
      const coordIds = (funcs || []).filter(f => f.scope_entity_type === 'coordenacao' && f.scope_entity_id).map(f => f.scope_entity_id!);
      const redeIds = (funcs || []).filter(f => f.scope_entity_type === 'rede' && f.scope_entity_id).map(f => f.scope_entity_id!);
      const supIds = (funcs || []).filter(f => f.scope_entity_type === 'supervisor' && f.scope_entity_id).map(f => f.scope_entity_id!);
      const campoIds = (funcs || []).filter(f => f.scope_entity_type === 'campo' && f.scope_entity_id).map(f => f.scope_entity_id!);

      // 5b) Also fetch ALL structural leaders (redes, coordenacoes, celulas) 
      // to discover those without leadership_functions entries
      const [allRedes, allCoords, allCelulas] = await Promise.all([
        supabase.from('redes').select('id, name, campo_id, leader_id, leadership_couple_id').eq('ativa', true),
        supabase.from('coordenacoes').select('id, name, campo_id, rede_id, leader_id, leadership_couple_id'),
        supabase.from('celulas').select('id, name, campo_id, coordenacao_id, leader_id, leadership_couple_id'),
      ]);

      // Build sets of scope_entity_ids already tracked in leadership_functions
      const trackedRedeIds = new Set((funcs || []).filter(f => f.function_type === 'rede_leader' && f.scope_entity_id).map(f => f.scope_entity_id!));
      const trackedCoordIds = new Set((funcs || []).filter(f => f.function_type === 'coordenador' && f.scope_entity_id).map(f => f.scope_entity_id!));
      const trackedCelulaIds = new Set((funcs || []).filter(f => f.function_type === 'celula_leader' && f.scope_entity_id).map(f => f.scope_entity_id!));

      // Discover structural leaders NOT in leadership_functions
      type StructuralLeader = { 
        entityId: string; entityName: string; entityType: string; functionType: string;
        coupleId: string | null; profileId: string | null; campoId: string; parentName?: string;
      };
      const structuralLeaders: StructuralLeader[] = [];

      for (const r of (allRedes.data || [])) {
        if (trackedRedeIds.has(r.id)) continue;
        if (!r.leader_id && !r.leadership_couple_id) continue;
        structuralLeaders.push({
          entityId: r.id, entityName: r.name, entityType: 'rede', functionType: 'rede_leader',
          coupleId: r.leadership_couple_id, profileId: r.leader_id, campoId: r.campo_id,
        });
        entityNameCache.set(r.id, r.name);
      }
      for (const co of (allCoords.data || [])) {
        if (trackedCoordIds.has(co.id)) continue;
        if (!co.leader_id && !co.leadership_couple_id) continue;
        const parentRede = (allRedes.data || []).find(r => r.id === co.rede_id);
        structuralLeaders.push({
          entityId: co.id, entityName: co.name, entityType: 'coordenacao', functionType: 'coordenador',
          coupleId: co.leadership_couple_id, profileId: co.leader_id, campoId: co.campo_id,
          parentName: parentRede?.name,
        });
        entityNameCache.set(co.id, co.name);
        if (parentRede) parentNameCache.set(co.id, parentRede.name);
      }
      for (const cel of (allCelulas.data || [])) {
        if (trackedCelulaIds.has(cel.id)) continue;
        if (!cel.leader_id && !cel.leadership_couple_id) continue;
        const parentCoord = (allCoords.data || []).find(c => c.id === cel.coordenacao_id);
        structuralLeaders.push({
          entityId: cel.id, entityName: cel.name, entityType: 'celula', functionType: 'celula_leader',
          coupleId: cel.leadership_couple_id, profileId: cel.leader_id, campoId: cel.campo_id,
          parentName: parentCoord?.name,
        });
        entityNameCache.set(cel.id, cel.name);
        if (parentCoord) parentNameCache.set(cel.id, parentCoord.name);
      }

      // Collect all couple/profile IDs including structural
      for (const sl of structuralLeaders) {
        if (sl.coupleId) coupleIds.push(sl.coupleId);
        if (sl.profileId && !sl.coupleId) profileIds.push(sl.profileId);
      }

      // Deduplicate
      const uniqueCoupleIds = [...new Set(coupleIds)];
      const uniqueProfileIds = [...new Set(profileIds)];

      if (uniqueCoupleIds.length > 0) {
        const { data: couples } = await supabase
          .from('leadership_couples')
          .select('id, spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url), spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url)')
          .in('id', uniqueCoupleIds);
        for (const c of (couples || [])) {
          couplesMap.set(c.id, { spouse1: c.spouse1, spouse2: c.spouse2 });
        }
      }

      if (uniqueProfileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', uniqueProfileIds);
        for (const p of (profiles || [])) {
          profilesMap.set(p.id, p);
        }
      }

      // Resolve remaining entity names from leadership_functions
      const [celulas, coords, redes, sups, campos] = await Promise.all([
        celulaIds.length > 0 ? supabase.from('celulas').select('id, name, coordenacao_id').in('id', celulaIds) : { data: [] },
        coordIds.length > 0 ? supabase.from('coordenacoes').select('id, name, rede_id').in('id', coordIds) : { data: [] },
        redeIds.length > 0 ? supabase.from('redes').select('id, name').in('id', redeIds) : { data: [] },
        supIds.length > 0 ? supabase.from('supervisores').select('id, coordenacao_id').in('id', supIds) : { data: [] },
        campoIds.length > 0 ? supabase.from('campos').select('id, nome').in('id', campoIds) : { data: [] },
      ]);

      for (const c of (celulas.data || [])) entityNameCache.set(c.id, c.name);
      for (const c of (coords.data || [])) entityNameCache.set(c.id, c.name);
      for (const r of (redes.data || [])) entityNameCache.set(r.id, r.name);
      for (const c of (campos.data || [])) entityNameCache.set(c.id, c.nome);

      for (const s of (sups.data || [])) {
        const coord = (coords.data || []).find(c => c.id === s.coordenacao_id);
        if (coord) {
          entityNameCache.set(s.id, coord.name);
          parentNameCache.set(s.id, coord.name);
        }
      }

      for (const cel of (celulas.data || [])) {
        const coord = (coords.data || []).find(c => c.id === cel.coordenacao_id);
        if (coord) parentNameCache.set(cel.id, coord.name);
      }

      const allRedeIdsForNames = [...new Set((coords.data || []).map(c => c.rede_id).filter(Boolean))];
      if (allRedeIdsForNames.length > 0 && !(redes.data || []).length) {
        const { data: extraRedes } = await supabase.from('redes').select('id, name').in('id', allRedeIdsForNames);
        for (const r of (extraRedes || [])) entityNameCache.set(r.id, r.name);
      }
      for (const c of (coords.data || [])) {
        const rede = (redes.data || []).find(r => r.id === c.rede_id);
        if (rede) parentNameCache.set(c.id, rede.name);
      }

      // 6) Build unified leaders map
      const leadersMap = new Map<string, UnifiedLeader>();

      for (const f of (funcs || [])) {
        let key: string;
        let leader: UnifiedLeader;

        if (f.leadership_couple_id) {
          key = `couple:${f.leadership_couple_id}`;
          if (!leadersMap.has(key)) {
            const couple = couplesMap.get(f.leadership_couple_id);
            leadersMap.set(key, {
              key,
              coupleId: f.leadership_couple_id,
              profileId: null,
              isCouple: true,
              person1: couple?.spouse1 || null,
              person2: couple?.spouse2 || null,
              functions: [],
            });
          }
          leader = leadersMap.get(key)!;
        } else if (f.profile_id) {
          key = `profile:${f.profile_id}`;
          if (!leadersMap.has(key)) {
            const profile = profilesMap.get(f.profile_id);
            leadersMap.set(key, {
              key,
              coupleId: null,
              profileId: f.profile_id,
              isCouple: false,
              person1: profile || null,
              person2: null,
              functions: [],
            });
          }
          leader = leadersMap.get(key)!;
        } else {
          continue;
        }

        // Find matching access key
        const akScopeType = SCOPE_TYPE_FOR_ACCESS_KEY[f.function_type];
        let matchedKey: any = null;
        if (akScopeType && accessKeys) {
          if (f.scope_entity_id) {
            matchedKey = accessKeys.find(k => k.scope_type === akScopeType && k.scope_id === f.scope_entity_id && k.active);
            if (!matchedKey) matchedKey = accessKeys.find(k => k.scope_type === akScopeType && k.scope_id === f.scope_entity_id);
          } else {
            matchedKey = accessKeys.find(k => k.scope_type === akScopeType && !k.scope_id && k.active && (
              !f.campo_id || k.campo_id === f.campo_id
            ));
            if (!matchedKey) matchedKey = accessKeys.find(k => k.scope_type === akScopeType && !k.scope_id);
          }
        }

        const entityName = f.scope_entity_id ? (entityNameCache.get(f.scope_entity_id) || '') : '';
        const parentName = f.scope_entity_id ? parentNameCache.get(f.scope_entity_id) : undefined;
        const campoName = f.campo_id ? (campoNameMap.get(f.campo_id) || 'Campus indefinido') : '';

        leader.functions.push({
          id: f.id,
          functionType: f.function_type,
          functionLabel: FUNCTION_LABELS[f.function_type] || f.function_type,
          scopeEntityId: f.scope_entity_id,
          scopeEntityType: f.scope_entity_type,
          scopeEntityName: entityName,
          parentName,
          campoId: f.campo_id,
          campoName,
          accessCode: matchedKey?.code,
          accessKeyId: matchedKey?.id,
          accessKeyActive: matchedKey?.active,
        });
      }

      // 7) Add structural leaders (from redes/coordenacoes/celulas without leadership_functions)
      for (const sl of structuralLeaders) {
        let key: string;
        let leader: UnifiedLeader;

        if (sl.coupleId) {
          key = `couple:${sl.coupleId}`;
          if (!leadersMap.has(key)) {
            const couple = couplesMap.get(sl.coupleId);
            leadersMap.set(key, {
              key, coupleId: sl.coupleId, profileId: null, isCouple: true,
              person1: couple?.spouse1 || null, person2: couple?.spouse2 || null, functions: [],
            });
          }
          leader = leadersMap.get(key)!;
        } else if (sl.profileId) {
          key = `profile:${sl.profileId}`;
          if (!leadersMap.has(key)) {
            const profile = profilesMap.get(sl.profileId);
            leadersMap.set(key, {
              key, coupleId: null, profileId: sl.profileId, isCouple: false,
              person1: profile || null, person2: null, functions: [],
            });
          }
          leader = leadersMap.get(key)!;
        } else {
          continue;
        }

        // Find matching access key
        const akScopeType = SCOPE_TYPE_FOR_ACCESS_KEY[sl.functionType];
        let matchedKey: any = null;
        if (akScopeType && accessKeys) {
          matchedKey = accessKeys.find(k => k.scope_type === akScopeType && k.scope_id === sl.entityId && k.active);
          if (!matchedKey) matchedKey = accessKeys.find(k => k.scope_type === akScopeType && k.scope_id === sl.entityId);
        }

        const campoName = sl.campoId ? (campoNameMap.get(sl.campoId) || 'Campus indefinido') : '';

        leader.functions.push({
          id: `structural:${sl.entityType}:${sl.entityId}`,
          functionType: sl.functionType,
          functionLabel: (FUNCTION_LABELS[sl.functionType] || sl.functionType) + ' ⚠️',
          scopeEntityId: sl.entityId,
          scopeEntityType: sl.entityType,
          scopeEntityName: sl.entityName,
          parentName: sl.parentName,
          campoId: sl.campoId,
          campoName,
          accessCode: matchedKey?.code,
          accessKeyId: matchedKey?.id,
          accessKeyActive: matchedKey?.active,
        });
      }

      const leaders = Array.from(leadersMap.values());
      leaders.sort((a, b) => {
        if (b.functions.length !== a.functions.length) return b.functions.length - a.functions.length;
        const nameA = a.person1?.name || '';
        const nameB = b.person1?.name || '';
        return nameA.localeCompare(nameB);
      });

      return leaders;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['leadership_functions_unified'] });
    queryClient.invalidateQueries({ queryKey: ['access_keys'] });
    queryClient.invalidateQueries({ queryKey: ['celulas'] });
    queryClient.invalidateQueries({ queryKey: ['supervisores'] });
    queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
    queryClient.invalidateQueries({ queryKey: ['redes'] });
    queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });
  };

  return { leaders: query.data || [], isLoading: query.isLoading, invalidateAll };
}
