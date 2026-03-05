/**
 * APP_MAP — Single source of truth for the Atalaia product map.
 * Used by: Onboarding Guide, Admin Guide, Glossary, AI Guide.
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Heart, Users, BookOpen, ClipboardCheck, Home,
  Activity, GitBranch, Network, Layers, Settings, Database, Eye,
  Droplets, TrendingUp, ShieldCheck, HelpCircle, Key
} from 'lucide-react';

// ─── Glossary Terms ────────────────────────────────────
export interface GlossaryTerm {
  term: string;
  shortDescription: string;
  longDescription: string;
  icon: LucideIcon;
  relatedScopes: string[];
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Pulso Pastoral',
    shortDescription: 'Indicadores gerais de saúde e movimento da igreja',
    longDescription: 'O Pulso Pastoral é um conjunto de métricas que mostra, de forma resumida, como está a saúde geral do seu escopo de atuação. Ele combina dados de presença, crescimento, engajamento e cuidado pastoral para dar uma visão rápida do que está indo bem e o que precisa de atenção.',
    icon: Activity,
    relatedScopes: ['rede', 'coordenacao', 'pastor', 'pastor_senior_global', 'admin'],
  },
  {
    term: 'Radar',
    shortDescription: 'Pontos de atenção e cuidado pastoral',
    longDescription: 'O Radar identifica automaticamente células e líderes que precisam de acompanhamento. Ele analisa frequência de relatórios, presença, supervisões e outros indicadores para destacar onde está precisando de mais atenção e cuidado.',
    icon: Eye,
    relatedScopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'pastor_senior_global', 'admin'],
  },
  {
    term: 'Discipulado',
    shortDescription: 'Acompanhamento baseado no livro do ano',
    longDescription: 'O módulo de Discipulado registra os encontros de discipulado realizados com membros da célula, coordenação ou rede. Cada encontro é marcado com data, participantes e observações, permitindo acompanhar o progresso espiritual de cada pessoa.',
    icon: BookOpen,
    relatedScopes: ['celula', 'coordenacao', 'rede', 'pastor'],
  },
  {
    term: 'Relatório Semanal',
    shortDescription: 'Registro operacional da reunião de célula',
    longDescription: 'O relatório semanal é preenchido pelo líder de célula após cada reunião. Registra número de presentes, visitantes, crianças, líderes em treinamento e discipulados. É a base de dados para todas as métricas do sistema.',
    icon: ClipboardCheck,
    relatedScopes: ['celula', 'supervisor', 'coordenacao', 'rede', 'pastor'],
  },
  {
    term: 'Nova Vida (Conversão)',
    shortDescription: 'Pessoa que aceitou Jesus e foi cadastrada no sistema',
    longDescription: 'Uma "Nova Vida" é alguém que fez uma decisão de fé e foi cadastrada no Atalaia para receber acompanhamento. Ela passa por um funil: cadastro → triagem → encaminhamento para célula → contato → integração → membro.',
    icon: Heart,
    relatedScopes: ['celula', 'recomeco_cadastro', 'central_celulas', 'lider_recomeco_central', 'pastor'],
  },
  {
    term: 'Membro',
    shortDescription: 'Pessoa que participa ativamente de uma célula',
    longDescription: 'Um membro é alguém que frequenta regularmente uma célula e está vinculado a ela no sistema. Membros podem ter status de batismo, discipulado, encontro com Deus, entre outros marcos espirituais.',
    icon: Users,
    relatedScopes: ['celula', 'supervisor', 'coordenacao', 'rede', 'pastor'],
  },
  {
    term: 'Supervisão',
    shortDescription: 'Visita do supervisor à reunião da célula',
    longDescription: 'A supervisão é uma visita presencial do supervisor à célula para avaliar e orientar. O supervisor registra pontos positivos, pontos a alinhar e uma nota geral sobre a qualidade da reunião.',
    icon: ShieldCheck,
    relatedScopes: ['supervisor', 'coordenacao', 'rede', 'pastor'],
  },
  {
    term: 'Multiplicação',
    shortDescription: 'Quando uma célula se divide para criar outra',
    longDescription: 'A multiplicação acontece quando uma célula cresce o suficiente e se divide em duas. É o principal indicador de crescimento saudável da igreja em células.',
    icon: GitBranch,
    relatedScopes: ['celula', 'coordenacao', 'rede', 'pastor'],
  },
];

// ─── Onboarding Steps by Scope ────────────────────────
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  icon: LucideIcon;
}

export const ONBOARDING_STEPS: Record<string, OnboardingStep[]> = {
  celula: [
    { id: 'cel-relatorio', title: 'Registrar reunião', description: 'Preencha o relatório semanal da sua célula', actionLabel: 'Ir para Relatório', actionPath: '/dashboard?tab=acoes', icon: ClipboardCheck },
    { id: 'cel-membros', title: 'Ver membros', description: 'Conheça e gerencie os membros da sua célula', actionLabel: 'Ver Membros', actionPath: '/dashboard?tab=membros', icon: Users },
    { id: 'cel-discipulado', title: 'Iniciar discipulado', description: 'Registre encontros de discipulado com seus membros', actionLabel: 'Discipulado', actionPath: '/dashboard?tab=acoes', icon: BookOpen },
    { id: 'cel-novas-vidas', title: 'Contatar nova vida', description: 'Veja as novas vidas encaminhadas para sua célula', actionLabel: 'Novas Vidas', actionPath: '/dashboard?tab=novas-vidas', icon: Heart },
  ],
  supervisor: [
    { id: 'sup-celulas', title: 'Ver suas células', description: 'Acompanhe as células sob sua supervisão', actionLabel: 'Ver Células', actionPath: '/dashboard', icon: Home },
    { id: 'sup-pendencias', title: 'Pendências de relatório', description: 'Identifique células que não enviaram relatório', actionLabel: 'Ver Pendências', actionPath: '/home', icon: ClipboardCheck },
    { id: 'sup-supervisao', title: 'Registrar supervisão', description: 'Registre sua visita à célula', actionLabel: 'Supervisionar', actionPath: '/dashboard', icon: ShieldCheck },
  ],
  coordenacao: [
    { id: 'coord-celulas', title: 'Células da coordenação', description: 'Veja todas as células da sua coordenação', actionLabel: 'Ver Células', actionPath: '/celulas', icon: Home },
    { id: 'coord-pendencias', title: 'Pendências prioritárias', description: 'Identifique o que precisa de atenção', actionLabel: 'Ver Pendências', actionPath: '/home', icon: Eye },
    { id: 'coord-lideres', title: 'Acompanhar líderes', description: 'Veja o desempenho dos líderes de célula', actionLabel: 'Ver Líderes', actionPath: '/dashboard', icon: Users },
  ],
  rede: [
    { id: 'rede-saude', title: 'Saúde da rede', description: 'Veja os indicadores gerais da sua rede', actionLabel: 'Ver Saúde', actionPath: '/radar', icon: Activity },
    { id: 'rede-celulas', title: 'Células em atenção', description: 'Identifique células que precisam de cuidado', actionLabel: 'Ver Radar', actionPath: '/radar', icon: Eye },
    { id: 'rede-multiplicacao', title: 'Multiplicação', description: 'Acompanhe o crescimento e multiplicações', actionLabel: 'Ver Dados', actionPath: '/dashboard', icon: GitBranch },
  ],
  pastor: [
    { id: 'past-campus', title: 'Visão do Campus', description: 'Veja o resumo geral do seu campus', actionLabel: 'Ver Campus', actionPath: '/dashboard', icon: LayoutDashboard },
    { id: 'past-redes', title: 'Redes em crescimento', description: 'Acompanhe o desempenho de cada rede', actionLabel: 'Ver Redes', actionPath: '/redes', icon: Network },
    { id: 'past-reuniao', title: 'Preparar reunião', description: 'Tópicos sugeridos para reunião com líderes', actionLabel: 'Ver Dados', actionPath: '/dados', icon: ClipboardCheck },
  ],
  global: [
    { id: 'glob-campus', title: 'Resumo por campus', description: 'Visão comparativa de todos os campi', actionLabel: 'Ver Campi', actionPath: '/dashboard', icon: LayoutDashboard },
    { id: 'glob-atencao', title: 'Campus em atenção', description: 'Identifique campi que precisam de suporte', actionLabel: 'Ver Radar', actionPath: '/radar', icon: Eye },
    { id: 'glob-reuniao', title: 'Preparar reunião', description: 'Dados para reunião com pastores de campo', actionLabel: 'Ver Dados', actionPath: '/dados', icon: TrendingUp },
  ],
  ministerio: [
    { id: 'min-cadastro', title: 'Cadastrar nova vida', description: 'Registre uma nova decisão de fé', actionLabel: 'Cadastrar', actionPath: '/recomeco-cadastro', icon: Heart },
    { id: 'min-triagem', title: 'Triagem e encaminhamento', description: 'Encaminhe novas vidas para uma célula', actionLabel: 'Encaminhar', actionPath: '/recomeco', icon: Droplets },
    { id: 'min-eventos', title: 'Eventos do campus', description: 'Gerencie inscrições do seu campus', actionLabel: 'Ver Eventos', actionPath: '/dashboard', icon: Activity },
  ],
};

// ─── Admin Product Map ────────────────────────────────
export interface ModuleInfo {
  name: string;
  description: string;
  path: string;
  scopes: string[];
  icon: LucideIcon;
}

export const ADMIN_PRODUCT_MAP: ModuleInfo[] = [
  { name: 'Home / Concierge', description: 'Tela inicial com ações prioritárias do dia', path: '/home', scopes: ['todos'], icon: LayoutDashboard },
  { name: 'Dashboard', description: 'Painel principal com métricas, relatórios e ações por escopo', path: '/dashboard', scopes: ['celula', 'supervisor', 'coordenacao', 'rede', 'pastor', 'global'], icon: ClipboardCheck },
  { name: 'Novas Vidas (Recomeço)', description: 'Funil de conversão: cadastro → triagem → encaminhamento → integração', path: '/recomeco', scopes: ['celula', 'coordenacao', 'rede', 'pastor', 'ministerio'], icon: Heart },
  { name: 'Membros', description: 'Lista de membros ativos com filtros por célula, rede e campus', path: '/membros', scopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'admin'], icon: Users },
  { name: 'Células', description: 'Lista e gestão de células do escopo ativo', path: '/celulas', scopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'admin'], icon: Home },
  { name: 'Radar', description: 'Saúde das células: frequência, relatórios, supervisões', path: '/radar', scopes: ['supervisor', 'coordenacao', 'rede', 'pastor', 'admin'], icon: Activity },
  { name: 'Organograma', description: 'Visualização hierárquica: campus → redes → coordenações → células', path: '/organograma', scopes: ['coordenacao', 'rede', 'pastor', 'admin'], icon: GitBranch },
  { name: 'Redes', description: 'Gestão de redes do campus', path: '/redes', scopes: ['rede', 'pastor', 'admin'], icon: Network },
  { name: 'Coordenações', description: 'Gestão de coordenações dentro de cada rede', path: '/coordenacoes', scopes: ['coordenacao', 'rede', 'pastor', 'admin'], icon: Layers },
  { name: 'Dados', description: 'Exportação e análise de dados consolidados', path: '/dados', scopes: ['rede', 'pastor', 'admin'], icon: Database },
  { name: 'Configurações', description: 'Chaves de acesso, lideranças, campos e auditoria', path: '/configuracoes', scopes: ['admin'], icon: Settings },
];

export const SCOPE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  celula: { label: 'Líder de Célula', description: 'Registra reuniões, acompanha membros, faz discipulado e recebe novas vidas encaminhadas.' },
  supervisor: { label: 'Supervisor', description: 'Supervisiona um grupo de células, avalia reuniões e acompanha relatórios dos líderes.' },
  coordenacao: { label: 'Coordenador', description: 'Coordena múltiplas células, acompanha pendências e orienta supervisores e líderes.' },
  rede: { label: 'Líder de Rede', description: 'Lidera toda a rede, acompanha saúde das células, multiplicação e crescimento.' },
  pastor: { label: 'Pastor de Campo', description: 'Visão completa do campus: redes, coordenações, células e indicadores de crescimento.' },
  global: { label: 'Pastor Global', description: 'Visão comparativa de todos os campi, com drill-down por campus e rede.' },
  ministerio: { label: 'Ministério', description: 'Funções especializadas: Recomeço (cadastro de novas vidas), Central de Células (triagem) e Batismo.' },
  admin: { label: 'Administrador', description: 'Acesso total ao sistema: configurações, lideranças, campos e auditoria de integridade.' },
};

export const ADMIN_TRAINING_SCRIPT = [
  { step: 1, title: 'Apresentar o Atalaia', description: 'Explique que o Atalaia é o sistema de gestão pastoral da igreja, acessível pelo celular (PWA) ou computador.' },
  { step: 2, title: 'Código de Acesso', description: 'Cada líder recebe um código que define seu papel (líder de célula, supervisor, coordenador, etc.).' },
  { step: 3, title: 'Home / Concierge', description: 'A tela inicial mostra "o que precisa da minha atenção agora" — personalizado por função.' },
  { step: 4, title: 'Relatório Semanal', description: 'Líderes de célula preenchem após cada reunião. É a base de tudo.' },
  { step: 5, title: 'Novas Vidas', description: 'Cadastradas no culto, triadas pela Central e encaminhadas para células próximas.' },
  { step: 6, title: 'Radar e Saúde', description: 'Supervisores e coordenadores veem quais células precisam de atenção.' },
  { step: 7, title: 'Glossário', description: 'Abra o Glossário no menu para tirar dúvidas sobre qualquer termo.' },
];
