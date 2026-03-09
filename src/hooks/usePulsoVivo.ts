/**
 * usePulsoVivo – Aggregates organogram structure + health status + member counts
 * into a flat list of nodes for the constellation visualization.
 */

import { useMemo } from 'react';
import { useOrganograma, OrgNode } from './useOrganograma';
import { useRadarSaude } from './useRadarSaude';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';

export type NodeHealth = 'saudavel' | 'acompanhamento' | 'critica' | 'sem_avaliacao';

export interface PulsoVivoNode {
  id: string;
  type: 'pastor' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
  name: string;
  coupleName: string | null;
  parentId: string | null;
  health: NodeHealth;
  memberCount: number;
  childrenCount: number;
  depth: number;
  // Position will be computed by the visualization
  spouse1?: { name?: string; avatar_url?: string | null } | null;
  spouse2?: { name?: string; avatar_url?: string | null } | null;
}

function flattenTree(
  nodes: OrgNode[],
  parentId: string | null,
  depth: number,
  healthMap: Map<string, NodeHealth>,
  memberCountMap: Map<string, number>,
  result: PulsoVivoNode[]
) {
  for (const node of nodes) {
    const health = healthMap.get(node.id) ?? 'sem_avaliacao';
    
    // For non-celula nodes, derive health from children
    let derivedHealth: NodeHealth = health;
    if (node.type !== 'celula' && node.children.length > 0) {
      const childHealths = node.children.map(c => healthMap.get(c.id) ?? 'sem_avaliacao');
      const criticas = childHealths.filter(h => h === 'critica').length;
      const saudaveis = childHealths.filter(h => h === 'saudavel').length;
      if (criticas > childHealths.length * 0.3) derivedHealth = 'critica';
      else if (saudaveis > childHealths.length * 0.6) derivedHealth = 'saudavel';
      else derivedHealth = 'acompanhamento';
    }

    result.push({
      id: node.id,
      type: node.type,
      name: node.name,
      coupleName: node.coupleName,
      parentId,
      health: derivedHealth,
      memberCount: memberCountMap.get(node.id) ?? 0,
      childrenCount: node.children.length,
      depth,
      spouse1: node.spouse1,
      spouse2: node.spouse2,
    });

    flattenTree(node.children, node.id, depth + 1, healthMap, memberCountMap, result);
  }
}

export function usePulsoVivo() {
  const { tree, isLoading: orgLoading } = useOrganograma();
  const { campoId, queryKeyExtra } = useDemoScope();
  const { data: radarData, isLoading: radarLoading } = useRadarSaude({ scopeType: 'all', campoId });

  // Member counts per celula
  const { data: memberCounts, isLoading: membersLoading } = useQuery({
    queryKey: ['pulso-vivo-members', campoId ?? 'global', ...queryKeyExtra],
    queryFn: async () => {
      let q = supabase
        .from('members')
        .select('celula_id')
        .eq('is_active', true);
      if (campoId) q = q.eq('campo_id', campoId);
      const { data } = await q;
      const map = new Map<string, number>();
      data?.forEach(m => {
        map.set(m.celula_id, (map.get(m.celula_id) ?? 0) + 1);
      });
      return map;
    },
  });

  const nodes = useMemo(() => {
    if (!tree.length) return [];

    const healthMap = new Map<string, NodeHealth>();
    radarData?.celulas?.forEach(c => {
      healthMap.set(c.celula_id, c.status);
    });

    const result: PulsoVivoNode[] = [];
    flattenTree(tree, null, 0, healthMap, memberCounts ?? new Map(), result);
    return result;
  }, [tree, radarData, memberCounts]);

  return {
    nodes,
    isLoading: orgLoading || radarLoading || membersLoading,
  };
}
