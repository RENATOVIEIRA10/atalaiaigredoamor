import {
  Crown, Map, Layers, Shield, Home, User, Settings,
  LayoutDashboard, Activity, FileText, Clock, TrendingUp,
  GitBranch, Users, Key, Hash, Repeat, Eye,
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Check, X, SendHorizontal, Share2,
  CheckCircle, AlertCircle, AlertTriangle, PauseCircle,
  Network, FolderTree, ClipboardCheck, Database, Moon, Heart,
  LogOut, Search, FileDown, Loader2, Lock,
  type LucideIcon
} from 'lucide-react';

// ========================================
// A) ROLE ICONS — ícones por função
// ========================================
export const roleIcons: Record<string, LucideIcon> = {
  pastor: Crown,
  pastor_senior: Crown,
  pastor_senior_global: Crown,
  pastor_de_campo: Crown,
  admin: Settings,
  rede_leader: Map,
  coordenador: Layers,
  supervisor: Shield,
  celula_leader: Home,
  membro: User,
};

// ========================================
// B) MODULE / NAV ICONS — ícones por tela
// ========================================
export const moduleIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  radar_pastoral: Activity,
  relatorios: FileText,
  historico: Clock,
  ranking: TrendingUp,
  organograma: GitBranch,
  gestao_funcoes: Users,
  redes: Network,
  coordenacoes: FolderTree,
  celulas: Home,
  membros: Users,
  presenca: ClipboardCheck,
  dados: Database,
  configuracoes: Settings,
};

// ========================================
// C) ACTION ICONS — ícones por ação
// ========================================
export const actionIcons: Record<string, LucideIcon> = {
  create: Plus,
  edit: Pencil,
  view: Eye,
  delete: Trash2,
  expand: ChevronDown,
  collapse: ChevronUp,
  save: Check,
  cancel: X,
  send: SendHorizontal,
  share: Share2,
  login: Key,
  access_code: Hash,
  demo_mode: Repeat,
  search: Search,
  export: FileDown,
  logout: LogOut,
  loading: Loader2,
  lock: Lock,
};

// ========================================
// D) STATUS ICONS — ícones por status
// ========================================
export const statusIcons: Record<string, LucideIcon> = {
  ok: CheckCircle,
  warning: AlertCircle,
  critical: AlertTriangle,
  inactive: PauseCircle,
};

// ========================================
// STYLE TOKENS
// ========================================
export const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export const iconColors = {
  default: 'text-muted-foreground',
  active: 'text-primary',
  destructive: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
} as const;

// ========================================
// ROLE LABELS
// ========================================
export const roleLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  pastor_senior: 'Pastor Sênior',
  admin: 'Administrador',
  rede_leader: 'Líder de Rede',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  celula_leader: 'Líder de Célula',
  membro: 'Membro',
  demo_institucional: 'Demonstração Institucional',
  recomeco_operador: 'Recomeço (Operador)',
  recomeco_leitura: 'Recomeço (Leitura)',
  recomeco_cadastro: 'Recomeço (Cadastro)',
  central_celulas: 'Central de Células',
  lider_recomeco_central: 'Líder Recomeço + Central',
  lider_batismo_aclamacao: 'Líder de Batismo / Aclamação',
  central_batismo_aclamacao: 'Central do Batismo / Aclamação',
  pastor_senior_global: 'Pastor Sênior Global',
  pastor_de_campo: 'Pastor de Campo',
  financeiro_global: 'Financeiro Global',
  financeiro_campo: 'Financeiro de Campo',
  secretaria_admin: 'Secretaria Administrativa',
};

// ========================================
// THEME ICONS
// ========================================
export const themeIcons = {
  amor: Heart,
  padrao: Moon,
} as const;
