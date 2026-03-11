/**
 * roleUXConfig – Centralized configuration for role-specific UX personalization.
 * Each role gets custom titles, descriptions, context chips, and visual emphasis.
 */

import {
  Heart, Users, ClipboardCheck, BookOpen, Cake, Home,
  Network, Layers, Eye, TrendingUp, Shield, AlertTriangle,
  Activity, Building2, Crown, Sparkles, Compass, Map,
  MessageSquare, UserCheck, ArrowRightLeft, BarChart3,
  type LucideIcon
} from 'lucide-react';

export interface RoleHeroConfig {
  greeting: string;
  subtitle: string;
  contextChips: Array<{ icon: LucideIcon; label: string }>;
  accentColor: string; // semantic class like 'primary' | 'gold' | 'vida'
}

export interface RoleActionConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  description?: string;
}

export interface RolePriorityAlert {
  key: string;
  icon: LucideIcon;
  iconColor: string;
  labelSingular: string;
  labelPlural: string;
  description: string;
  actionLabel: string;
  actionPath: string;
}

export interface RoleUXConfig {
  hero: RoleHeroConfig;
  sectionLabel: string;
  quickActions: RoleActionConfig[];
  priorityAlerts: RolePriorityAlert[];
  hiddenSections?: string[];
}

// ═══════════════════════════════════════════════════════════════════
// LÍDER DE CÉLULA — UX de Cuidado Pessoal
// ═══════════════════════════════════════════════════════════════════
const cellLeaderConfig: RoleUXConfig = {
  hero: {
    greeting: 'Sua Célula Hoje',
    subtitle: 'Cuide de quem Deus colocou em suas mãos.',
    contextChips: [
      { icon: Heart, label: 'Cuidado pessoal' },
      { icon: Users, label: 'Pessoas próximas' },
      { icon: BookOpen, label: 'Discipulado' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Ações prioritárias da célula',
  quickActions: [
    { id: 'relatorio', label: 'Enviar Relatório', icon: ClipboardCheck, path: '/dashboard?tab=acoes&view=relatorio' },
    { id: 'membros', label: 'Ver Membros', icon: Users, path: '/dashboard?tab=acoes&view=membros' },
    { id: 'novas-vidas', label: 'Falar com Nova Vida', icon: Heart, path: '/dashboard?tab=novas-vidas' },
    { id: 'discipulado', label: 'Discipulado', icon: BookOpen, path: '/dashboard?tab=acoes&view=discipulado' },
  ],
  priorityAlerts: [
    { key: 'vidas-aguardando', icon: Heart, iconColor: 'text-ruby', labelSingular: 'nova vida aguardando contato', labelPlural: 'novas vidas aguardando contato', description: 'Faça o primeiro contato', actionLabel: 'Falar agora', actionPath: '/dashboard?tab=novas-vidas' },
    { key: 'relatorio-pendente', icon: ClipboardCheck, iconColor: 'text-primary', labelSingular: 'relatório da semana pendente', labelPlural: 'relatório da semana pendente', description: 'Registre a reunião desta semana', actionLabel: 'Registrar', actionPath: '/dashboard?tab=acoes' },
    { key: 'discipulado-pendente', icon: BookOpen, iconColor: 'text-vida', labelSingular: 'membro pronto para discipulado', labelPlural: 'membros prontos para discipulado', description: 'Batizados aguardando acompanhamento', actionLabel: 'Iniciar', actionPath: '/dashboard?tab=acoes' },
    { key: 'aniversariante', icon: Cake, iconColor: 'text-gold', labelSingular: 'aniversariante da semana', labelPlural: 'aniversariantes da semana', description: 'Celebre com sua célula', actionLabel: 'Ver', actionPath: '/dashboard?tab=pulso' },
  ],
  hiddenSections: ['rede-metrics', 'global-metrics', 'organograma-complexo'],
};

// ═══════════════════════════════════════════════════════════════════
// SUPERVISOR — UX de Acompanhamento
// ═══════════════════════════════════════════════════════════════════
const supervisorConfig: RoleUXConfig = {
  hero: {
    greeting: 'Sua Supervisão Hoje',
    subtitle: 'Cuide dos líderes que cuidam de pessoas.',
    contextChips: [
      { icon: Shield, label: 'Cuidado de líderes' },
      { icon: Activity, label: 'Saúde das células' },
      { icon: ClipboardCheck, label: 'Supervisões' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Ações de acompanhamento',
  quickActions: [
    { id: 'supervisao', label: 'Fazer Supervisão', icon: ClipboardCheck, path: '/dashboard?tab=cuidado' },
    { id: 'celulas', label: 'Ver Células', icon: Home, path: '/dashboard?tab=visao-geral' },
    { id: 'lideres', label: 'Ver Líderes', icon: UserCheck, path: '/organograma' },
  ],
  priorityAlerts: [
    { key: 'celula-sem-reuniao', icon: Home, iconColor: 'text-ruby', labelSingular: 'célula sem reunião registrada', labelPlural: 'células sem reunião registrada', description: 'Verifique o que aconteceu', actionLabel: 'Ver células', actionPath: '/dashboard' },
    { key: 'supervisao-pendente', icon: ClipboardCheck, iconColor: 'text-warning', labelSingular: 'supervisão pendente', labelPlural: 'supervisões pendentes', description: 'Acompanhe sua agenda', actionLabel: 'Fazer supervisão', actionPath: '/dashboard?tab=cuidado' },
    { key: 'celula-atencao', icon: AlertTriangle, iconColor: 'text-warning', labelSingular: 'célula em atenção', labelPlural: 'células em atenção', description: 'Saúde abaixo da média', actionLabel: 'Ver saúde', actionPath: '/radar' },
  ],
  hiddenSections: ['global-metrics', 'campus-metrics'],
};

// ═══════════════════════════════════════════════════════════════════
// COORDENADOR — UX de Organização
// ═══════════════════════════════════════════════════════════════════
const coordinatorConfig: RoleUXConfig = {
  hero: {
    greeting: 'Sua Coordenação Hoje',
    subtitle: 'Organize para que o Reino avance.',
    contextChips: [
      { icon: Layers, label: 'Organização' },
      { icon: Users, label: 'Supervisores' },
      { icon: ArrowRightLeft, label: 'Encaminhamentos' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Visão da coordenação',
  quickActions: [
    { id: 'celulas', label: 'Ver Células', icon: Home, path: '/dashboard?tab=acoes&view=celulas' },
    { id: 'supervisores', label: 'Ver Supervisores', icon: Shield, path: '/dashboard?tab=acoes&view=supervisores' },
    { id: 'novas-vidas', label: 'Encaminhar Vidas', icon: Heart, path: '/dashboard?tab=acoes&view=novas-vidas' },
    { id: 'lideres', label: 'Líderes', icon: UserCheck, path: '/dashboard?tab=acoes&view=lideres' },
  ],
  priorityAlerts: [
    { key: 'celulas-sem-supervisao', icon: ClipboardCheck, iconColor: 'text-ruby', labelSingular: 'célula sem supervisão', labelPlural: 'células sem supervisão', description: 'Acompanhamento atrasado', actionLabel: 'Ver células', actionPath: '/dashboard' },
    { key: 'vidas-aguardando', icon: Heart, iconColor: 'text-ruby', labelSingular: 'nova vida aguardando célula', labelPlural: 'novas vidas aguardando célula', description: 'Encaminhe para uma célula', actionLabel: 'Encaminhar', actionPath: '/recomeco-cadastro' },
    { key: 'supervisor-inativo', icon: Shield, iconColor: 'text-warning', labelSingular: 'supervisor sem atividade recente', labelPlural: 'supervisores sem atividade recente', description: 'Verifique o que aconteceu', actionLabel: 'Ver supervisores', actionPath: '/dashboard' },
  ],
  hiddenSections: ['global-metrics'],
};

// ═══════════════════════════════════════════════════════════════════
// LÍDER DE REDE — UX de Gestão de Liderança
// ═══════════════════════════════════════════════════════════════════
const networkLeaderConfig: RoleUXConfig = {
  hero: {
    greeting: 'Sua Rede Hoje',
    subtitle: 'Desenvolva líderes que multiplicam.',
    contextChips: [
      { icon: Network, label: 'Coordenações' },
      { icon: TrendingUp, label: 'Multiplicação' },
      { icon: UserCheck, label: 'Mentoria' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Visão estratégica da rede',
  quickActions: [
    { id: 'coordenacoes', label: 'Ver Coordenações', icon: Layers, path: '/dashboard?tab=visao-geral' },
    { id: 'celulas', label: 'Ver Células', icon: Home, path: '/dashboard?tab=acoes&view=celulas' },
    { id: 'membros', label: 'Ver Membros', icon: Users, path: '/dashboard?tab=acoes&view=membros' },
    { id: 'multiplicacao', label: 'Planejar Multiplicação', icon: TrendingUp, path: '/dashboard?tab=analises' },
    { id: 'radar', label: 'Radar de Saúde', icon: BarChart3, path: '/radar' },
  ],
  priorityAlerts: [
    { key: 'coordenacao-estagnada', icon: AlertTriangle, iconColor: 'text-ruby', labelSingular: 'coordenação estagnada', labelPlural: 'coordenações estagnadas', description: 'Sem crescimento recente', actionLabel: 'Ver detalhes', actionPath: '/dashboard' },
    { key: 'lider-mentoria', icon: UserCheck, iconColor: 'text-warning', labelSingular: 'líder precisando mentoria', labelPlural: 'líderes precisando mentoria', description: 'Acompanhamento necessário', actionLabel: 'Ver líderes', actionPath: '/organograma' },
    { key: 'celula-multiplicar', icon: TrendingUp, iconColor: 'text-vida', labelSingular: 'célula pronta para multiplicar', labelPlural: 'células prontas para multiplicar', description: 'Crescimento sustentável', actionLabel: 'Planejar', actionPath: '/dashboard?tab=analises' },
  ],
  hiddenSections: [],
};

// ═══════════════════════════════════════════════════════════════════
// PASTOR DE CAMPO — UX de Visão de Reino Local
// ═══════════════════════════════════════════════════════════════════
const pastorCampoConfig: RoleUXConfig = {
  hero: {
    greeting: 'Seu Campus Hoje',
    subtitle: 'Governe com sabedoria, cuide com amor.',
    contextChips: [
      { icon: Crown, label: 'Governo pastoral' },
      { icon: Activity, label: 'Vitalidade espiritual' },
      { icon: Compass, label: 'Direção estratégica' },
    ],
    accentColor: 'gold',
  },
  sectionLabel: 'Panorama do campus',
  quickActions: [
    { id: 'visao', label: 'Visão do Campus', icon: Eye, path: '/dashboard?tab=visao-geral' },
    { id: 'redes', label: 'Ver Redes', icon: Network, path: '/dashboard?tab=visao-geral' },
    { id: 'crescimento', label: 'Crescimento', icon: TrendingUp, path: '/dashboard?tab=movimento' },
    { id: 'reuniao', label: 'Preparar Reunião', icon: MessageSquare, path: '/dashboard?tab=pastoral' },
  ],
  priorityAlerts: [
    { key: 'rede-atencao', icon: AlertTriangle, iconColor: 'text-ruby', labelSingular: 'rede em atenção', labelPlural: 'redes em atenção', description: 'Saúde abaixo da média', actionLabel: 'Ver redes', actionPath: '/dashboard' },
    { key: 'crescimento-baixo', icon: TrendingUp, iconColor: 'text-warning', labelSingular: 'crescimento abaixo da média', labelPlural: 'crescimento abaixo da média', description: 'Analise as tendências', actionLabel: 'Ver análise', actionPath: '/dashboard?tab=movimento' },
    { key: 'conversoes-recentes', icon: Heart, iconColor: 'text-vida', labelSingular: 'conversão recente', labelPlural: 'conversões recentes', description: 'O Reino está crescendo!', actionLabel: 'Celebrar', actionPath: '/dashboard?tab=movimento' },
  ],
  hiddenSections: ['relatorios-operacionais', 'tarefas-admin'],
};

// ═══════════════════════════════════════════════════════════════════
// PASTOR GLOBAL — UX de Visão Estratégica do Reino
// ═══════════════════════════════════════════════════════════════════
const pastorGlobalConfig: RoleUXConfig = {
  hero: {
    greeting: 'Visão Global do Reino',
    subtitle: 'Discerna o movimento de Deus entre as nações.',
    contextChips: [
      { icon: Sparkles, label: 'Expansão do Reino' },
      { icon: Map, label: 'Visão estratégica' },
      { icon: Crown, label: 'Governo espiritual' },
    ],
    accentColor: 'gold',
  },
  sectionLabel: 'Panorama estratégico',
  quickActions: [
    { id: 'visao', label: 'Visão Global', icon: Eye, path: '/dashboard?tab=visao-geral' },
    { id: 'campos', label: 'Ver Campos', icon: Map, path: '/dashboard?tab=visao-geral' },
    { id: 'expansao', label: 'Expansão', icon: TrendingUp, path: '/dashboard?tab=movimento' },
    { id: 'conselho', label: 'Preparar Conselho', icon: MessageSquare, path: '/dashboard?tab=pastoral' },
  ],
  priorityAlerts: [
    { key: 'campus-atencao', icon: AlertTriangle, iconColor: 'text-ruby', labelSingular: 'campus em atenção', labelPlural: 'campi em atenção', description: 'Requer acompanhamento pastoral', actionLabel: 'Ver campos', actionPath: '/dashboard' },
    { key: 'expansao-regional', icon: TrendingUp, iconColor: 'text-vida', labelSingular: 'expansão regional', labelPlural: 'expansões regionais', description: 'Crescimento significativo', actionLabel: 'Ver análise', actionPath: '/dashboard?tab=movimento' },
    { key: 'vitalidade', icon: Activity, iconColor: 'text-primary', labelSingular: 'sinal de vitalidade espiritual', labelPlural: 'sinais de vitalidade espiritual', description: 'O Espírito está movendo', actionLabel: 'Ver movimento', actionPath: '/dashboard?tab=movimento' },
  ],
  hiddenSections: ['relatorios-semanais', 'tarefas-operacionais'],
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN — UX de Torre de Controle
// ═══════════════════════════════════════════════════════════════════
const adminConfig: RoleUXConfig = {
  hero: {
    greeting: 'Torre de Controle',
    subtitle: 'Visão completa. Controle total.',
    contextChips: [
      { icon: Shield, label: 'Governança' },
      { icon: Building2, label: 'Estrutura' },
      { icon: Eye, label: 'Monitoramento' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Gestão do sistema',
  quickActions: [
    { id: 'campos', label: 'Campos', icon: Building2, path: '/configuracoes?tab=campos' },
    { id: 'redes', label: 'Redes', icon: Network, path: '/redes' },
    { id: 'liderancas', label: 'Lideranças', icon: Users, path: '/configuracoes?tab=liderancas' },
    { id: 'novas-vidas', label: 'Novas Vidas', icon: Heart, path: '/recomeco-cadastro' },
  ],
  priorityAlerts: [],
  hiddenSections: [],
};

// ═══════════════════════════════════════════════════════════════════
// GUARDIÃO DE CULTO — UX de Contagem de Público
// ═══════════════════════════════════════════════════════════════════
const guardioesCultoConfig: RoleUXConfig = {
  hero: {
    greeting: 'Guardião do Culto',
    subtitle: 'Registre a presença e os frutos do culto de hoje.',
    contextChips: [
      { icon: UserCheck, label: 'Contagem ativa' },
      { icon: Activity, label: 'Tempo real' },
      { icon: Heart, label: 'Frutos espirituais' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Ações do Culto',
  quickActions: [
    { id: 'contagem', label: 'Iniciar Contagem', icon: UserCheck, path: '/guardioes', description: 'Abrir contador de público' },
  ],
  priorityAlerts: [],
  hiddenSections: ['celulas', 'financeiro', 'lideranca', 'rede-metrics', 'global-metrics'],
};

// ═══════════════════════════════════════════════════════════════════
// DEFAULT FALLBACK
// ═══════════════════════════════════════════════════════════════════
const defaultConfig: RoleUXConfig = {
  hero: {
    greeting: 'Centro de Comando Pastoral',
    subtitle: 'Seu painel de missão está vivo.',
    contextChips: [
      { icon: Compass, label: 'Direção' },
      { icon: Shield, label: 'Cuidado' },
      { icon: Activity, label: 'Ação' },
    ],
    accentColor: 'primary',
  },
  sectionLabel: 'Ações prioritárias',
  quickActions: [],
  priorityAlerts: [],
  hiddenSections: [],
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════
export function getRoleUXConfig(scopeType: string | null): RoleUXConfig {
  switch (scopeType) {
    case 'celula':
      return cellLeaderConfig;
    case 'supervisor':
      return supervisorConfig;
    case 'coordenacao':
      return coordinatorConfig;
    case 'rede':
      return networkLeaderConfig;
    case 'pastor_de_campo':
      return pastorCampoConfig;
    case 'pastor':
    case 'pastor_senior_global':
      return pastorGlobalConfig;
    case 'admin':
      return adminConfig;
    case 'guardioes_culto':
      return guardioesCultoConfig;
    default:
      return defaultConfig;
  }
}

export const roleUXConfigs = {
  celula: cellLeaderConfig,
  supervisor: supervisorConfig,
  coordenacao: coordinatorConfig,
  rede: networkLeaderConfig,
  pastor_de_campo: pastorCampoConfig,
  pastor: pastorGlobalConfig,
  pastor_senior_global: pastorGlobalConfig,
  admin: adminConfig,
  guardioes_culto: guardioesCultoConfig,
};
