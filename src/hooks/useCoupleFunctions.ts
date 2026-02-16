import { useQuery } from '@tanstack/react-query';
import { useRedes } from './useRedes';
import { useCoordenacoes } from './useCoordenacoes';
import { useSupervisores } from './useSupervisoes';
import { useCelulas } from './useCelulas';

export interface CoupleFunction {
  role: 'rede_leader' | 'coordenador' | 'supervisor' | 'celula_leader';
  roleLabel: string;
  entityName: string;
  entityId: string;
  /** for supervisor, the coordenacao name */
  parentName?: string;
}

export interface CoupleWithFunctions {
  coupleId: string;
  spouse1: { id: string; name: string; avatar_url: string | null } | null;
  spouse2: { id: string; name: string; avatar_url: string | null } | null;
  functions: CoupleFunction[];
}

export function useCoupleFunctions() {
  const { data: redes, isLoading: l1 } = useRedes();
  const { data: coordenacoes, isLoading: l2 } = useCoordenacoes();
  const { data: supervisores, isLoading: l3 } = useSupervisores();
  const { data: celulas, isLoading: l4 } = useCelulas();

  const isLoading = l1 || l2 || l3 || l4;

  const couples: CoupleWithFunctions[] = [];

  if (!isLoading && redes && coordenacoes && supervisores && celulas) {
    const coupleMap = new Map<string, CoupleWithFunctions>();

    const getOrCreate = (coupleId: string, spouse1: any, spouse2: any): CoupleWithFunctions => {
      if (!coupleMap.has(coupleId)) {
        coupleMap.set(coupleId, {
          coupleId,
          spouse1: spouse1 ? { id: spouse1.id, name: spouse1.name, avatar_url: spouse1.avatar_url } : null,
          spouse2: spouse2 ? { id: spouse2.id, name: spouse2.name, avatar_url: spouse2.avatar_url } : null,
          functions: [],
        });
      }
      return coupleMap.get(coupleId)!;
    };

    // Redes
    for (const rede of redes) {
      if (rede.leadership_couple_id && rede.leadership_couple) {
        const lc = rede.leadership_couple as any;
        const entry = getOrCreate(rede.leadership_couple_id, lc.spouse1, lc.spouse2);
        entry.functions.push({
          role: 'rede_leader',
          roleLabel: 'Líder de Rede',
          entityName: rede.name,
          entityId: rede.id,
        });
      }
    }

    // Coordenações
    for (const coord of coordenacoes) {
      if (coord.leadership_couple_id && coord.leadership_couple) {
        const lc = coord.leadership_couple as any;
        const entry = getOrCreate(coord.leadership_couple_id, lc.spouse1, lc.spouse2);
        entry.functions.push({
          role: 'coordenador',
          roleLabel: 'Coordenador',
          entityName: coord.name,
          entityId: coord.id,
          parentName: coord.rede?.name,
        });
      }
    }

    // Supervisores
    for (const sup of supervisores) {
      if (sup.leadership_couple_id && sup.leadership_couple) {
        const lc = sup.leadership_couple as any;
        const entry = getOrCreate(sup.leadership_couple_id, lc.spouse1, lc.spouse2);
        entry.functions.push({
          role: 'supervisor',
          roleLabel: 'Supervisor',
          entityName: lc.spouse1?.name && lc.spouse2?.name 
            ? `${lc.spouse1.name} & ${lc.spouse2.name}` 
            : sup.profile?.name || 'Supervisor',
          entityId: sup.id,
          parentName: sup.coordenacao?.name,
        });
      }
    }

    // Células
    for (const cel of celulas) {
      if (cel.leadership_couple_id && cel.leadership_couple) {
        const lc = cel.leadership_couple as any;
        const entry = getOrCreate(cel.leadership_couple_id, lc.spouse1, lc.spouse2);
        entry.functions.push({
          role: 'celula_leader',
          roleLabel: 'Líder de Célula',
          entityName: cel.name,
          entityId: cel.id,
          parentName: cel.coordenacao?.name,
        });
      }
    }

    couples.push(...Array.from(coupleMap.values()));
    // Sort by number of functions desc, then by name
    couples.sort((a, b) => {
      if (b.functions.length !== a.functions.length) return b.functions.length - a.functions.length;
      const nameA = a.spouse1?.name || '';
      const nameB = b.spouse1?.name || '';
      return nameA.localeCompare(nameB);
    });
  }

  return { couples, isLoading };
}
