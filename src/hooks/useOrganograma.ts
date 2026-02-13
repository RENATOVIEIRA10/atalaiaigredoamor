import { useRedes } from './useRedes';
import { useCoordenacoes } from './useCoordenacoes';
import { useSupervisores } from './useSupervisoes';
import { useCelulas } from './useCelulas';
import { useMemo } from 'react';

export interface OrgNode {
  id: string;
  type: 'pastor' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
  name: string;
  coupleName: string | null;
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

export function useOrganograma() {
  const { data: redes, isLoading: l1 } = useRedes();
  const { data: coordenacoes, isLoading: l2 } = useCoordenacoes();
  const { data: supervisores, isLoading: l3 } = useSupervisores();
  const { data: celulas, isLoading: l4 } = useCelulas();

  const isLoading = l1 || l2 || l3 || l4;

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
            childrenCount: 0,
            children: [],
          }));

          return {
            id: sup.id,
            type: 'supervisor',
            name: getCoupleDisplayName(sup.leadership_couple) || sup.profile?.name || 'Supervisor',
            coupleName: getCoupleDisplayName(sup.leadership_couple),
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
          childrenCount: 0,
          children: [],
        }));

        const allChildren = [...supervisorNodes, ...unassignedNodes];

        return {
          id: coord.id,
          type: 'coordenacao',
          name: coord.name,
          coupleName: getCoupleDisplayName(coord.leadership_couple),
          childrenCount: allChildren.length,
          children: allChildren,
        };
      });

      return {
        id: rede.id,
        type: 'rede',
        name: rede.name,
        coupleName: getCoupleDisplayName(rede.leadership_couple),
        childrenCount: coordNodes.length,
        children: coordNodes,
      };
    });

    // Wrap everything under Pastores Sêniores
    const pastorNode: OrgNode = {
      id: 'pastores-seniores',
      type: 'pastor',
      name: 'Pastores Sêniores',
      coupleName: 'Pr. Arthur & Pra. Talitha',
      childrenCount: redeNodes.length,
      children: redeNodes,
    };

    return [pastorNode];
  }, [redes, coordenacoes, supervisores, celulas]);

  return { tree, isLoading };
}
