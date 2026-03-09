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
  Layers, BarChart3, Map, Radar, Search,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { ADMIN_PRODUCT_MAP } from '@/lib/appMap';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  '/home': LayoutDashboard,
  '/dashboard': ClipboardCheck,
  '/celulas': Home,
  '/membros': Users,
  '/redes': Network,
  '/coordenacoes': Layers,
  '/radar': Activity,
  '/organograma': GitBranch,
  '/dados': BarChart3,
  '/configuracoes': Settings,
  '/recomeco-cadastro': Heart,
  '/pulso-vivo': Map,
  '/glossario': BookOpen,
};

const QUICK_ACTIONS = [
  { label: 'Registrar Presença', path: '/dashboard?tab=acoes', icon: ClipboardCheck },
  { label: 'Nova Vida', path: '/recomeco-cadastro', icon: Heart },
  { label: 'Ver Relatório', path: '/dashboard?tab=historico', icon: BarChart3 },
  { label: 'Radar de Saúde', path: '/radar', icon: Radar },
  { label: 'Pulso Vivo', path: '/pulso-vivo', icon: Eye },
];

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { scopeType } = useRole();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const pages = useMemo(() =>
    ADMIN_PRODUCT_MAP.map((m) => ({
      label: m.name,
      path: m.path,
      description: m.description,
      Icon: ICON_MAP[m.path] || LayoutDashboard,
    })),
    []
  );

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Navegar por intenção… (ex: Nova Vida, Relatório, João)" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Ações Rápidas">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem key={a.path} onSelect={() => go(a.path)} className="gap-3 py-2.5">
              <a.icon className="h-4 w-4 text-primary shrink-0" />
              <span>{a.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Páginas">
          {pages.map((p) => (
            <CommandItem key={p.path} onSelect={() => go(p.path)} className="gap-3 py-2.5">
              <p.Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{p.label}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{p.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Floating search trigger for mobile */
export function CommandBarTrigger({ className }: { className?: string }) {
  const [, setOpen] = useState(false);

  const openBar = () => {
    // Dispatch the same keyboard event to open the dialog
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
