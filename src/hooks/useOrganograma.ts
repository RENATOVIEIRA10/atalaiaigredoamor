import { useRedes } from './useRedes';
import { useCoordenacoes } from './useCoordenacoes';
import { useSupervisores } from './useSupervisoes';
import { useCelulas } from './useCelulas';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrgNode {
  id: string;
  type: 'pastor' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
  name: string;
  coupleName: string | null;
  coupleId?: string | null;
  spouse1?: { id?: string; name?: string; avatar_url?: string | null } | null;
  spouse2?: { id?: string; name?: string; avatar_url?: string | null } | null;
  childrenCount: number;
  children: OrgNode[];
}

function getCoupleDisplayName(couple: any): string | null {
  if (!couple) return null;
  const s1 = couple.spouse1?.name;
  const s2 = couple.spouse2?.name;
  if (s1 && s2) return `${s1} & ${s2}`;
  return s1 || s2 || null;
}

function getCoupleSpouses(couple: any) {
  return {
    spouse1: couple?.spouse1 ? { id: couple.spouse1.id, name: couple.spouse1.name, avatar_url: couple.spouse1.avatar_url } : null,
    spouse2: couple?.spouse2 ? { id: couple.spouse2.id, name: couple.spouse2.name, avatar_url: couple.spouse2.avatar_url } : null,
  };
}

export function useOrganograma() {
  const { data: redes, isLoading: l1 } = useRedes();
  const { data: coordenacoes, isLoading: l2 } = useCoordenacoes();
  const { data: supervisores, isLoading: l3 } = useSupervisores();
  const { data: celulas, isLoading: l4 } = useCelulas();

  // Fetch pastor couple from access_keys with scope_type='pastor'
  const { data: pastorCouple, isLoading: l5 } = useQuery({
    queryKey: ['pastor-couple'],
    queryFn: async () => {
      // Get the pastor access key to find the couple ID
      const { data: ak } = await supabase
        .from('access_keys')
        .select('scope_id')
        .eq('scope_type', 'pastor')
        .limit(1)
        .single();

      if (!ak?.scope_id) return null;

      const { data: couple } = await supabase
        .from('leadership_couples')
        .select('id, spouse1:profiles!leadership_couples_spouse1_id_fkey(id, name, avatar_url), spouse2:profiles!leadership_couples_spouse2_id_fkey(id, name, avatar_url)')
        .eq('id', ak.scope_id)
        .single();

      return couple;
    },
  });

  const isLoading = l1 || l2 || l3 || l4 || l5;

  const tree = useMemo(() => {
    if (!redes || !coordenacoes || !celulas) return [];

    const redeNodes = redes.map((rede): OrgNode => {
      const redeCoords = coordenacoes
        .filter(c => c.rede_id === rede.id)
        .sort((a, b) => ((a as any).ordem || 0) - ((b as any).ordem || 0));

      const coordNodes: OrgNode[] = redeCoords.map((coord): OrgNode => {
        const coordSupervisors = (supervisores || [])
          .filter(s => s.coordenacao_id === coord.id)
          .sort((a, b) => ((a as any).ordem || 0) - ((b as any).ordem || 0));

        const coordCelulas = celulas
          .filter(c => c.coordenacao_id === coord.id)
          .sort((a, b) => ((a as any).ordem || 0) - ((b as any).ordem || 0));

        // Group cells by supervisor_id
        const cellsBySupervisor = new Map<string, typeof coordCelulas>();
        const unassignedCells: typeof coordCelulas = [];

        coordCelulas.forEach(cel => {
          const supId = (cel as any).supervisor_id;
          if (supId) {
            if (!cellsBySupervisor.has(supId)) cellsBySupervisor.set(supId, []);
            cellsBySupervisor.get(supId)!.push(cel);
          } else {
            unassignedCells.push(cel);
          }
        });

        // Build supervisor nodes with their cells as children
        const supervisorNodes: OrgNode[] = coordSupervisors.map((sup): OrgNode => {
          const supCells = cellsBySupervisor.get(sup.id) || [];
          const celulaChildren: OrgNode[] = supCells.map((cel): OrgNode => ({
            id: cel.id,
            type: 'celula',
            name: cel.name,
            coupleName: getCoupleDisplayName(cel.leadership_couple),
            coupleId: cel.leadership_couple_id,
            ...getCoupleSpouses(cel.leadership_couple),
            childrenCount: 0,
            children: [],
          }));

          return {
            id: sup.id,
            type: 'supervisor',
            name: getCoupleDisplayName(sup.leadership_couple) || sup.profile?.name || 'Supervisor',
            coupleName: getCoupleDisplayName(sup.leadership_couple),
            coupleId: sup.leadership_couple_id,
            ...getCoupleSpouses(sup.leadership_couple),
            childrenCount: celulaChildren.length,
            children: celulaChildren,
          };
        });

        // Unassigned cells go directly under coordenação
        const unassignedNodes: OrgNode[] = unassignedCells.map((cel): OrgNode => ({
          id: cel.id,
          type: 'celula',
          name: cel.name,
          coupleName: getCoupleDisplayName(cel.leadership_couple),
          coupleId: cel.leadership_couple_id,
          ...getCoupleSpouses(cel.leadership_couple),
          childrenCount: 0,
          children: [],
        }));

        const allChildren = [...supervisorNodes, ...unassignedNodes];

        return {
          id: coord.id,
          type: 'coordenacao',
          name: coord.name,
          coupleName: getCoupleDisplayName(coord.leadership_couple),
          coupleId: coord.leadership_couple_id,
          ...getCoupleSpouses(coord.leadership_couple),
          childrenCount: allChildren.length,
          children: allChildren,
        };
      });

      return {
        id: rede.id,
        type: 'rede',
        name: rede.name,
        coupleName: getCoupleDisplayName(rede.leadership_couple),
        coupleId: rede.leadership_couple_id,
        ...getCoupleSpouses(rede.leadership_couple),
        childrenCount: coordNodes.length,
        children: coordNodes,
      };
    });

    // Look up pastor couple from access_keys with scope_type='pastor'
    const pastorCoupleId = pastorCouple?.id || null;
    const pastorSpouses = pastorCouple
      ? {
          spouse1: pastorCouple.spouse1 ? { id: (pastorCouple.spouse1 as any).id, name: (pastorCouple.spouse1 as any).name, avatar_url: (pastorCouple.spouse1 as any).avatar_url } : null,
          spouse2: pastorCouple.spouse2 ? { id: (pastorCouple.spouse2 as any).id, name: (pastorCouple.spouse2 as any).name, avatar_url: (pastorCouple.spouse2 as any).avatar_url } : null,
        }
      : { spouse1: null, spouse2: null };

    const pastorCoupleName = pastorSpouses.spouse1 && pastorSpouses.spouse2
      ? `${pastorSpouses.spouse1.name} & ${pastorSpouses.spouse2.name}`
      : 'Pr. Arthur & Pra. Talitha';

    // Wrap everything under Pastores Sêniores
    const pastorNode: OrgNode = {
      id: 'pastores-seniores',
      type: 'pastor',
      name: 'Pastores Sêniores',
      coupleName: pastorCoupleName,
      coupleId: pastorCoupleId,
      ...pastorSpouses,
      childrenCount: redeNodes.length,
      children: redeNodes,
    };

    return [pastorNode];
  }, [redes, coordenacoes, supervisores, celulas, pastorCouple]);

  return { tree, isLoading };
}
