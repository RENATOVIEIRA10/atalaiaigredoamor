import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Heart, Users, Home, ClipboardCheck,
  GitBranch, Activity, BookOpen, Network, Settings, Eye,
  Layers, BarChart3, Map, Radar, Search, ShieldCheck,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';

// ── Nível hierárquico por scopeType ──────────────────────
const SCOPE_LEVEL: Record<string, number> = {
  celula: 1,
  supervisor: 2,
  coordenacao: 3,
  rede: 4,
  pastor: 5,
  pastor_de_campo: 5,
  pastor_senior_global: 6,
  admin: 6,
  // Ministérios especializados — nível 3 (equivalente a coordenador)
  recomeco_operador: 3,
  recomeco_leitura: 3,
  recomeco_cadastro: 2,
  central_celulas: 3,
  lider_recomeco_central: 4,
  lider_batismo_aclamacao: 3,
  central_batismo_aclamacao: 3,
  financeiro_global: 6,
  financeiro_campo: 5,
  secretaria_admin: 6,
  guardioes_culto: 1,
  demo_institucional: 0,
};

// ── Catálogo de ações filtradas por nível ─────────────────
interface CmdAction {
  label: string;
  path: string;
  icon: React.ElementType;
  category: 'quick' | 'page';
  minLevel: number;
}

const ALL_ACTIONS: CmdAction[] = [
  // Ações rápidas
  { label: 'Registrar Presença',    path: '/dashboard?tab=acoes',    icon: ClipboardCheck, category: 'quick', minLevel: 1 },
  { label: 'Nova Vida',             path: '/recomeco-cadastro',      icon: Heart,          category: 'quick', minLevel: 1 },
  { label: 'Ver Relatório',         path: '/dashboard?tab=historico',icon: BarChart3,      category: 'quick', minLevel: 1 },
  { label: 'Radar de Saúde',        path: '/radar',                  icon: Radar,          category: 'quick', minLevel: 2 },
  { label: 'Pulso Vivo',            path: '/pulso-vivo',             icon: Eye,            category: 'quick', minLevel: 3 },

  // Páginas
  { label: 'Início',                path: '/home',                   icon: LayoutDashboard, category: 'page', minLevel: 1 },
  { label: 'Dashboard',             path: '/dashboard',              icon: ClipboardCheck,  category: 'page', minLevel: 1 },
  { label: 'Glossário',             path: '/glossario',              icon: BookOpen,        category: 'page', minLevel: 1 },
  { label: 'Células',               path: '/celulas',                icon: Home,            category: 'page', minLevel: 2 },
  { label: 'Membros',               path: '/membros',                icon: Users,           category: 'page', minLevel: 2 },
  { label: 'Organograma',           path: '/organograma',            icon: GitBranch,       category: 'page', minLevel: 3 },
  { label: 'Coordenações',          path: '/coordenacoes',           icon: Layers,          category: 'page', minLevel: 3 },
  { label: 'Redes',                 path: '/redes',                  icon: Network,         category: 'page', minLevel: 4 },
  { label: 'Dados',                 path: '/dados',                  icon: BarChart3,       category: 'page', minLevel: 4 },
  { label: 'Configurações',         path: '/configuracoes',          icon: Settings,        category: 'page', minLevel: 6 },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { scopeType } = useRole();

  const userLevel = SCOPE_LEVEL[scopeType ?? ''] ?? 0;

  // Busca por intenção SÓ ativa para nível >= 3 (coordenador+)
  const searchEnabled = userLevel >= 3;

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (searchEnabled) setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [searchEnabled]);

  const filteredActions = useMemo(() =>
    ALL_ACTIONS.filter(a => a.minLevel <= userLevel),
    [userLevel]
  );

  const quickActions = filteredActions.filter(a => a.category === 'quick');
  const pages = filteredActions.filter(a => a.category === 'page');

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  if (!searchEnabled) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Navegar por intenção… (ex: Nova Vida, Relatório)" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {quickActions.length > 0 && (
          <CommandGroup heading="Ações Rápidas">
            {quickActions.map((a) => (
              <CommandItem key={a.path} onSelect={() => go(a.path)} className="gap-3 py-2.5">
                <a.icon className="h-4 w-4 text-primary shrink-0" />
                <span>{a.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {quickActions.length > 0 && pages.length > 0 && <CommandSeparator />}

        {pages.length > 0 && (
          <CommandGroup heading="Páginas">
            {pages.map((p) => (
              <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-3 py-2.5">
                <p.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{p.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Floating search trigger for mobile — only shows for level >= 3 */
export function CommandBarTrigger({ className }: { className?: string }) {
  const { scopeType } = useRole();
  const userLevel = SCOPE_LEVEL[scopeType ?? ''] ?? 0;

  if (userLevel < 3) return null;

  const openBar = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <button
      onClick={openBar}
      className={cn(
        'flex items-center gap-2 h-9 px-3 rounded-xl border border-border/40 bg-secondary/50 text-muted-foreground text-sm transition-all',
        'hover:bg-secondary hover:text-foreground hover:border-border/60',
        'active:scale-95',
        className
      )}
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Buscar…</span>
      <kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border border-border/40 bg-muted px-1.5 text-[10px] font-mono text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}
