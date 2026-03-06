import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { roleLabels } from '@/lib/icons';
import {
  ShieldCheck, LogOut, RefreshCw, HelpCircle,
  LayoutDashboard, Heart, Users, Home, ClipboardCheck,
  GitBranch, Activity, Droplets, BookOpen, Network,
  Layers, Settings, Key, Database, PlayCircle, Moon,
  ChevronDown, Map, MessageCircle
} from 'lucide-react';
import logoIgreja from '@/assets/logo-igreja-do-amor-new.png';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import { AtalaiaIcon } from '@/components/institutional/AtalaiaLogoHeader';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DemoModeDialog } from '@/components/demo/DemoModeDialog';
import { CampoSelector } from '@/components/campo/CampoSelector';
import { usePastoralTour } from '@/hooks/usePastoralTour';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';

interface NavGroup {
  label: string;
  items: { title: string; href: string; icon: React.ElementType }[];
  defaultOpen?: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedRole, clearAccess, isAdmin, isRedeLeader, isCoordenador,
    isSupervisor, isCelulaLeader, isPastor, isDemoInstitucional,
    isPastorSeniorGlobal, isPastorDeCampo
  } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const { openTour } = usePastoralTour();

  const isOriginalAdmin = (isAdmin || isDemoActive) && !isDemoInstitucional;
  const showAdminItems = (isOriginalAdmin || isRedeLeader) && !isDemoInstitucional;
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  // Build nav groups based on role
  const navGroups: NavGroup[] = [];

  // Home is always first
  navGroups.push({
    label: '',
    items: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
    ],
    defaultOpen: true,
  });

  // Pessoas group
  if (!isDemoInstitucional) {
    const pessoasItems: NavGroup['items'] = [];
    pessoasItems.push({ title: 'Novas Vidas', href: '/recomeco', icon: Heart });
    if (!isCellLeaderOnly) {
      pessoasItems.push({ title: 'Membros', href: '/membros', icon: Users });
    }
    pessoasItems.push({ title: 'Discipulado', href: '/dashboard?tab=acoes', icon: BookOpen });
    navGroups.push({ label: 'Pessoas', items: pessoasItems });
  }

  // Células group
  if (!isDemoInstitucional) {
    const celulasItems: NavGroup['items'] = [
      { title: 'Relatórios', href: '/dashboard', icon: ClipboardCheck },
    ];
    if (!isCellLeaderOnly) {
      celulasItems.unshift({ title: 'Lista de Células', href: '/celulas', icon: Home });
    }
    navGroups.push({ label: 'Células', items: celulasItems });
  }

  // Radar
  if (!isDemoInstitucional && !isCellLeaderOnly) {
    navGroups.push({
      label: 'Radar',
      items: [
        { title: 'Saúde das Células', href: '/radar', icon: Activity },
        { title: 'Organograma', href: '/organograma', icon: GitBranch },
      ],
    });
  }

  // Admin group
  if (showAdminItems && !isDemoActive) {
    navGroups.push({
      label: 'Admin',
      items: [
        { title: 'Redes', href: '/redes', icon: Network },
        { title: 'Coordenações', href: '/coordenacoes', icon: Layers },
        { title: 'Dados', href: '/dados', icon: Database },
        { title: 'Configurações', href: '/configuracoes', icon: Settings },
      ],
    });
  }

  const handleLogout = () => {
    if (isDemoActive) deactivateDemo();
    clearAccess();
    navigate('/');
  };

  const handleSwitchRole = () => {
    clearAccess();
    navigate('/trocar-funcao');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border/50 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <AtalaiaIcon className="h-8 w-auto" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoIgreja} alt="Igreja do Amor" className="h-8 w-auto object-contain" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoRedeAmor} alt="Rede Amor a Dois" className="h-8 w-auto object-contain" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-2">
          {/* Campo Selector */}
          {(isPastorSeniorGlobal || isAdmin || isPastorDeCampo) && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-3 py-2">
                  <CampoSelector />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Demo Mode Button */}
          {isOriginalAdmin && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setDemoDialogOpen(true)}
                      className="h-11 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-[0_10px_26px_-18px_hsl(142_70%_45%)] hover:bg-emerald-500/18 dark:text-emerald-400"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-medium">
                        {isDemoActive ? 'Trocar Visão' : 'Modo Validação'}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Nav Groups */}
          {navGroups.map((group, gi) => (
            <NavGroupSection key={gi} group={group} location={location} />
          ))}

          {/* Support */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest px-3">Apoio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/glossario'} className="h-11 rounded-xl">
                    <NavLink to="/glossario">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Glossário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/manual-usuario'} className="h-11 rounded-xl">
                    <NavLink to="/manual-usuario">
                      <PlayCircle className="h-4 w-4" />
                      <span className="font-medium">Manual do Usuário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isOriginalAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/guia-admin'} className="h-11 rounded-xl">
                      <NavLink to="/guia-admin">
                        <Map className="h-4 w-4" />
                        <span className="font-medium">Guia do Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={openTour} className="h-11 rounded-xl">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-medium">Tour de Ajuda</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50 p-4 space-y-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex-1 h-9 rounded-lg border border-sidebar-border/40 text-xs font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/75 gap-2"
            >
              <Moon className="h-4 w-4" />
              {theme === 'padrao' ? 'Tema Amor' : 'Tema Padrão'}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchRole}
            className="w-full h-9 rounded-lg border border-sidebar-border/40 text-xs font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/75 gap-2 justify-start"
          >
            <RefreshCw className="h-4 w-4" />
            Trocar Função
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-sidebar-primary/35 shadow-sm">
              <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-foreground text-xs font-semibold">
                {selectedRole?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {selectedRole ? roleLabels[selectedRole] : 'Usuário'}
              </span>
              {isDemoActive && (
                <span className="truncate text-[10px] text-emerald-500 font-medium">Validação ativa</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 shrink-0 rounded-lg border border-sidebar-border/40 text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/75"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <DemoModeDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />
    </>
  );
}

function NavGroupSection({ group, location }: { group: NavGroup; location: ReturnType<typeof useLocation> }) {
  const hasActive = group.items.some(i => location.pathname === i.href);
  const [open, setOpen] = useState(group.defaultOpen ?? hasActive);

  if (!group.label) {
    // Flat items (no collapsible)
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={location.pathname === item.href} className="h-11 rounded-xl">
                  <NavLink to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="text-sidebar-foreground/55 text-[10px] uppercase tracking-[0.14em] px-3 pt-2 flex items-center justify-between cursor-pointer hover:text-sidebar-foreground/80 transition-colors">
            {group.label}
            <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href} className="h-11 rounded-xl">
                    <NavLink to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
