import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { roleLabels } from '@/lib/icons';
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  HelpCircle,
  LayoutDashboard,
  Heart,
  Users,
  Home,
  ClipboardCheck,
  GitBranch,
  Activity,
  BookOpen,
  Network,
  Layers,
  Settings,
  PlayCircle,
  Moon,
  Map,
  Church,
  UserCheck,
  TrendingUp,
  Eye,
  Calendar,
  BarChart3,
  MessageSquare,
  KeyRound,
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavGroup {
  items: { title: string; href: string; icon: React.ElementType }[];
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedRole,
    clearAccess,
    isAdmin,
    isRedeLeader,
    isCoordenador,
    isSupervisor,
    isCelulaLeader,
    isPastor,
    isDemoInstitucional,
    isPastorSeniorGlobal,
    isPastorDeCampo,
  } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const { openTour } = usePastoralTour();

  const isOriginalAdmin = (isAdmin || isDemoActive) && !isDemoInstitucional;
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  const roleNavItems: Record<string, NavGroup['items']> = {
    celula_leader: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Membros', href: '/dashboard?tab=membros', icon: Users },
      { title: 'Discipulado', href: '/dashboard?tab=discipulado', icon: BookOpen },
      { title: 'Relatório da Semana', href: '/dashboard?tab=celula', icon: ClipboardCheck },
      { title: 'Novas Vidas', href: '/dashboard?tab=novas-vidas', icon: Heart },
      { title: 'Reuniões', href: '/dashboard?tab=roteiro', icon: Calendar },
      { title: 'Fotos & Momentos', href: '/dashboard', icon: Church },
    ],
    coordenador: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Células da Coordenação', href: '/dashboard?tab=visao-geral', icon: Home },
      { title: 'Líderes de Célula', href: '/organograma', icon: UserCheck },
      { title: 'Novas Vidas (triagem)', href: '/dashboard?tab=movimento', icon: Heart },
      { title: 'Discipulado', href: '/dashboard?tab=movimento', icon: BookOpen },
      { title: 'Acompanhamentos', href: '/dashboard?tab=acompanhamento', icon: ClipboardCheck },
      { title: 'Crescimento & Multiplicação', href: '/dashboard?tab=analises', icon: TrendingUp },
    ],
    rede_leader: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Coordenações', href: '/dashboard?tab=visao-geral', icon: Layers },
      { title: 'Líderes', href: '/organograma', icon: UserCheck },
      { title: 'Células', href: '/dashboard?tab=visao-geral', icon: Home },
      { title: 'Novas Vidas da Rede', href: '/dashboard?tab=movimento', icon: Heart },
      { title: 'Discipulado da Rede', href: '/dashboard?tab=movimento', icon: BookOpen },
      { title: 'Crescimento & Multiplicações', href: '/dashboard?tab=analises', icon: TrendingUp },
      { title: 'Supervisões', href: '/dashboard?tab=analises', icon: ClipboardCheck },
    ],
    pastor_de_campo: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Visão do Campus', href: '/dashboard?tab=visao-geral', icon: Eye },
      { title: 'Redes do Campus', href: '/dashboard?tab=visao-geral', icon: Network },
      { title: 'Novas Vidas', href: '/dashboard?tab=movimento', icon: Heart },
      { title: 'Discipulado', href: '/dashboard?tab=movimento', icon: BookOpen },
      { title: 'Crescimento do Reino', href: '/dashboard?tab=movimento', icon: TrendingUp },
      { title: 'Radar Pastoral', href: '/dashboard?tab=pastoral', icon: Activity },
      { title: 'Reuniões com Líderes', href: '/dashboard?tab=pastoral&view=reuniao', icon: MessageSquare },
    ],
    pastor_senior_global: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Visão Global', href: '/dashboard?tab=visao-geral', icon: Eye },
      { title: 'Campos', href: '/dashboard?tab=visao-geral', icon: Map },
      { title: 'Redes por Campo', href: '/dashboard?tab=visao-geral', icon: Network },
      { title: 'Novas Vidas (Reino)', href: '/dashboard?tab=movimento', icon: Heart },
      { title: 'Discipulado (Reino)', href: '/dashboard?tab=movimento', icon: BookOpen },
      { title: 'Expansão do Reino', href: '/dashboard?tab=movimento', icon: TrendingUp },
      { title: 'Radar Estratégico', href: '/dashboard?tab=pastoral', icon: BarChart3 },
    ],
    admin: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Gestão de Lideranças', href: '/organograma', icon: GitBranch },
      { title: 'Códigos de Acesso', href: '/dados', icon: KeyRound },
      { title: 'Campos', href: '/dashboard?tab=semanal', icon: Map },
      { title: 'Redes', href: '/redes', icon: Network },
      { title: 'Coordenações', href: '/coordenacoes', icon: Layers },
      { title: 'Células', href: '/celulas', icon: Home },
      { title: 'Seed Run', href: '/configuracoes?tab=seedrun', icon: PlayCircle },
    ],
    default: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Novas Vidas', href: '/recomeco', icon: Heart },
      { title: 'Radar', href: '/radar', icon: Activity },
      { title: 'Organograma', href: '/organograma', icon: GitBranch },
    ],
  };

  const navGroups: NavGroup[] = [
    {
      items: (() => {
        if (isDemoInstitucional) return [{ title: 'Início', href: '/home', icon: LayoutDashboard }];
        if (isPastorSeniorGlobal) return roleNavItems.pastor_senior_global;
        if (isPastorDeCampo) return roleNavItems.pastor_de_campo;
        if (isAdmin && !isDemoActive) return roleNavItems.admin;
        if (isRedeLeader) return roleNavItems.rede_leader;
        if (isCoordenador) return roleNavItems.coordenador;
        if (isCellLeaderOnly) return roleNavItems.celula_leader;
        if (isPastor) return roleNavItems.pastor_de_campo;
        return roleNavItems.default;
      })().slice(0, 8),
    },
  ];

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
      <Sidebar className="border-r border-sidebar-border/45">
        <SidebarHeader className="border-b border-sidebar-border/45 px-5 pb-5 pt-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <AtalaiaIcon className="h-8 w-auto" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoIgreja} alt="Igreja do Amor" className="h-8 w-auto object-contain" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoRedeAmor} alt="Rede Amor a Dois" className="h-8 w-auto object-contain" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          {(isPastorSeniorGlobal || isAdmin || isPastorDeCampo) && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-3 py-2">
                  <CampoSelector />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isOriginalAdmin && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setDemoDialogOpen(true)}
                      className="h-11 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 shadow-[0_12px_28px_-22px_hsl(142_70%_45%)] hover:bg-emerald-500/16 dark:text-emerald-400"
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

          {navGroups.map((group, gi) => (
            <NavGroupSection key={gi} group={group} location={location} />
          ))}

          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Apoio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/glossario'} className="h-11 rounded-2xl">
                    <NavLink to="/glossario">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Glossário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/manual-usuario'} className="h-11 rounded-2xl">
                    <NavLink to="/manual-usuario">
                      <PlayCircle className="h-4 w-4" />
                      <span className="font-medium">Manual do Usuário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isOriginalAdmin && !isDemoActive && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/guia-admin'} className="h-11 rounded-2xl">
                      <NavLink to="/guia-admin">
                        <Map className="h-4 w-4" />
                        <span className="font-medium">Guia do Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={openTour} className="h-11 rounded-2xl">
                    <HelpCircle className="h-4 w-4" />
                    <span className="font-medium">Tour de Ajuda</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="space-y-3 border-t border-sidebar-border/50 p-4 backdrop-blur-xl">
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
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={`${item.href}:${item.title}`}>
              <SidebarMenuButton asChild isActive={location.pathname + location.search === item.href || location.pathname === item.href} className="h-11 rounded-2xl">
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
