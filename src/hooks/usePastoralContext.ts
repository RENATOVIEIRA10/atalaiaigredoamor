import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useRede } from '@/contexts/RedeContext';
import { useDashboardStats } from './useDashboardStats';
import { useNovasVidas } from './useNovasVidas';
import { useWeeklyReports } from './useWeeklyReports';
import { useCelulas } from './useCelulas';
import { useCoordenacoes } from './useCoordenacoes';
import { useMembers } from './useMembers';

/**
 * Hook que coleta o contexto pastoral completo baseado no papel do usuário
 * para alimentar a IA com dados reais e gerar orientações personalizadas
 */
export function usePastoralContext() {
  const {
    isPastor, isPastorSeniorGlobal, isPastorDeCampo,
    isRedeLeader, isCoordenador, isSupervisor, isCelulaLeader,
    scopeType, scopeId
  } = useRole();
  
  const { activeCampo, isGlobalView } = useCampo();
  const { activeRede } = useRede();
  
  // Dados estruturais
  const { data: stats } = useDashboardStats();
  const { data: novasVidas } = useNovasVidas();
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: members } = useMembers();
  
  // Dados operacionais da semana
  const { data: weeklyReports } = useWeeklyReports();

  // Detectar papel principal
  const roleLabel = isPastorSeniorGlobal 
    ? 'Pastor Global'
    : isPastorDeCampo || isPastor
    ? 'Pastor de Campo'
    : isRedeLeader
    ? 'Líder de Rede'
    : isCoordenador
    ? 'Coordenador'
    : isSupervisor
    ? 'Supervisor'
    : 'Líder de Célula';

  // Contexto geográfico
  const campusName = activeCampo?.nome || 'Não definido';
  const redeName = activeRede?.name || null;

  // Preparar métricas contextuais por papel
  const metrics: Record<string, any> = {};

  if (isPastorSeniorGlobal) {
    // Pastor Global: visão de múltiplos campos
    metrics.totalRedes = stats?.totalNetworks || 0;
    metrics.totalCelulas = stats?.totalCelulas || 0;
    metrics.totalMembros = stats?.totalMembers || 0;
    metrics.novasVidasPendentes = novasVidas?.filter(v => v.status === 'nova').length || 0;
  } else if (isPastorDeCampo || isPastor) {
    // Pastor de Campo: foco nas redes do campus
    metrics.totalRedes = stats?.totalNetworks || 0;
    metrics.totalCelulas = stats?.totalCelulas || 0;
    metrics.totalMembros = stats?.totalMembers || 0;
    metrics.novasVidasPendentes = novasVidas?.filter(v => v.status === 'nova').length || 0;
    metrics.celulasSemanaSemRelatorio = celulas?.filter(c => {
      const hasReport = weeklyReports?.some(r => r.celula_id === c.id);
      return !hasReport;
    }).length || 0;
  } else if (isRedeLeader) {
    // Líder de Rede: foco nas coordenações
    metrics.totalCoordenacoes = coordenacoes?.length || 0;
    metrics.totalCelulas = celulas?.length || 0;
    metrics.totalMembros = members?.filter(m => m.is_active).length || 0;
    metrics.celulasSemanaSemRelatorio = celulas?.filter(c => {
      const hasReport = weeklyReports?.some(r => r.celula_id === c.id);
      return !hasReport;
    }).length || 0;
    metrics.novasVidasPendentes = novasVidas?.filter(v => v.status === 'nova').length || 0;
  } else if (isCoordenador) {
    // Coordenador: foco nas células
    metrics.totalCelulas = celulas?.length || 0;
    metrics.totalMembros = members?.filter(m => m.is_active).length || 0;
    metrics.celulasSemanaSemRelatorio = celulas?.filter(c => {
      const hasReport = weeklyReports?.some(r => r.celula_id === c.id);
      return !hasReport;
    }).length || 0;
    metrics.novasVidasPendentes = novasVidas?.filter(v => v.status === 'nova').length || 0;
  } else if (isSupervisor || isCelulaLeader) {
    // Líder de Célula / Supervisor: foco em pessoas
    const myCelula = celulas?.[0]; // Assumindo primeira célula é a dele
    metrics.totalMembros = members?.filter(m => m.is_active && m.celula_id === myCelula?.id).length || 0;
    metrics.membrosDisponiveis = members?.filter(m => m.is_active && m.disponivel_para_servir).length || 0;
    metrics.novasVidasPendentes = novasVidas?.filter(v => v.status === 'nova').length || 0;
    metrics.relatorioSemanaEnviado = weeklyReports?.some(r => r.celula_id === myCelula?.id) || false;
    metrics.membrosDiscipulado = members?.filter(m => m.is_active && m.is_discipulado).length || 0;
  }

  // Pendências gerais
  const pendencias: string[] = [];

  if (metrics.celulasSemanaSemRelatorio > 0) {
    pendencias.push(`${metrics.celulasSemanaSemRelatorio} célula(s) sem relatório`);
  }
  if (metrics.novasVidasPendentes > 0) {
    pendencias.push(`${metrics.novasVidasPendentes} nova(s) vida(s) aguardando`);
  }
  if (isCelulaLeader && !metrics.relatorioSemanaEnviado) {
    pendencias.push('Relatório da semana pendente');
  }

  return {
    roleLabel,
    scopeType,
    campusName,
    redeName,
    metrics,
    pendencias,
    isGlobalView,
  };
}
