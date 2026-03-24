import { useMemo } from 'react';
import { Member } from '@/hooks/useMembers';

// ── Jornada Espiritual — ordem canônica dos marcos ──────────
export interface MarcoEspiritual {
  key: keyof Pick<Member, 'batismo' | 'encontro_com_deus' | 'renovo' | 'encontro_de_casais' | 'curso_lidere' | 'is_discipulado' | 'is_lider_em_treinamento'> | 'serve_ministerio';
  label: string;
  shortLabel: string;
  emoji: string;
  /** ordem na jornada (menor = mais básico) */
  order: number;
  /** Se true, só se aplica a casados */
  casaisOnly?: boolean;
}

export const MARCOS_JORNADA: MarcoEspiritual[] = [
  { key: 'batismo',                 label: 'Batismo / Aclamação',      shortLabel: 'Batismo',        emoji: '💧', order: 1 },
  { key: 'encontro_com_deus',       label: 'Encontro com Deus',        shortLabel: 'ECD',            emoji: '🔥', order: 2 },
  { key: 'renovo',                  label: 'Renovo',                   shortLabel: 'Renovo',         emoji: '🌿', order: 3 },
  { key: 'encontro_de_casais',      label: 'Encontro de Casais',       shortLabel: 'Casais',         emoji: '💑', order: 4, casaisOnly: true },
  { key: 'curso_lidere',            label: 'Curso Lídere',             shortLabel: 'Lídere',         emoji: '🎓', order: 5 },
  { key: 'is_discipulado',          label: 'Discipulado',              shortLabel: 'Discipulado',    emoji: '📖', order: 6 },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento',     shortLabel: 'LIT',            emoji: '⭐', order: 7 },
  { key: 'serve_ministerio',        label: 'Servindo em Ministério',   shortLabel: 'Ministério',     emoji: '🛡️', order: 8 },
];

export interface ProximoPasso {
  member: Member;
  memberName: string;
  completedCount: number;
  totalApplicable: number;
  percentage: number;
  nextStep: MarcoEspiritual | null;
  completedMarcos: MarcoEspiritual[];
  pendingMarcos: MarcoEspiritual[];
}

export interface FunilStage {
  marco: MarcoEspiritual;
  completed: number;
  total: number;
  percentage: number;
}

function getMemberMarcoValue(member: Member, key: MarcoEspiritual['key']): boolean {
  if (key === 'serve_ministerio') return !!member.serve_ministerio;
  return !!(member as any)[key];
}

export function analyzeProximosPassos(members: Member[]): ProximoPasso[] {
  return members.map(member => {
    const applicableMarcos = MARCOS_JORNADA.filter(m => !m.casaisOnly || true); // include all for now
    const completedMarcos = applicableMarcos.filter(m => getMemberMarcoValue(member, m.key));
    const pendingMarcos = applicableMarcos.filter(m => !getMemberMarcoValue(member, m.key));
    
    // Next step = first pending marco in order
    const nextStep = pendingMarcos.length > 0 ? pendingMarcos[0] : null;

    return {
      member,
      memberName: member.profile?.name || 'Sem nome',
      completedCount: completedMarcos.length,
      totalApplicable: applicableMarcos.length,
      percentage: applicableMarcos.length > 0 ? Math.round((completedMarcos.length / applicableMarcos.length) * 100) : 0,
      nextStep,
      completedMarcos,
      pendingMarcos,
    };
  }).sort((a, b) => {
    // Sort: members with pending steps first, then by completion %
    if (a.nextStep && !b.nextStep) return -1;
    if (!a.nextStep && b.nextStep) return 1;
    return a.percentage - b.percentage; // least complete first (need most attention)
  });
}

export function analyzeFunilFormacao(members: Member[]): FunilStage[] {
  const total = members.length;
  return MARCOS_JORNADA.map(marco => {
    const completed = members.filter(m => getMemberMarcoValue(m, marco.key)).length;
    return {
      marco,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export function useProximosPassos(members: Member[] | undefined) {
  return useMemo(() => {
    if (!members || members.length === 0) return { passos: [], funil: [], summary: null };
    
    const passos = analyzeProximosPassos(members);
    const funil = analyzeFunilFormacao(members);
    
    const needAttention = passos.filter(p => p.nextStep !== null).length;
    const fullyComplete = passos.filter(p => p.nextStep === null).length;
    const avgCompletion = passos.length > 0
      ? Math.round(passos.reduce((acc, p) => acc + p.percentage, 0) / passos.length)
      : 0;

    return {
      passos,
      funil,
      summary: {
        total: members.length,
        needAttention,
        fullyComplete,
        avgCompletion,
      },
    };
  }, [members]);
}
