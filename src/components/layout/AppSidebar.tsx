import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { roleLabels } from '@/lib/icons';
import {
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
  Sun,
  Map,
  UserCheck,
  TrendingUp,
  Eye,
  Calendar,
  BarChart3,
  MessageSquare,
  KeyRound,
  Radar,
  Wallet,
  Receipt,
  Building2,
  FolderOpen,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
} from 'lucide-react';
import logoIgreja from '@/assets/logo-igreja-do-amor-new.png';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import { AtalaiaIcon } from '@/components/institutional/AtalaiaLogoHeader';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTorreControle } from '@/contexts/TorreControleContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  label?: string;
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
    isFinanceiroGlobal,
    isFinanceiroCampo,
    isSecretariaAdmin,
    isFinanceiroAny,
  } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const { setIsOpen: setTorreOpen } = useTorreControle();
  
  const { openTour } = usePastoralTour();

  const isOriginalAdmin = (isAdmin || isDemoActive) && !isDemoInstitucional;
  const isCellLeaderOnly = isCelulaLeader && !isSupervisor && !isCoordenador && !isRedeLeader && !isAdmin && !isPastor;

  const roleNavItems: Record<string, NavGroup['items']> = {
    celula_leader: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
    ],
    coordenador: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
      { title: 'Células', href: '/celulas', icon: Home },
      { title: 'Membros', href: '/membros', icon: Users },
    ],
    rede_leader: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
      { title: 'Coordenações', href: '/coordenacoes', icon: Layers },
      { title: 'Células', href: '/celulas', icon: Home },
      { title: 'Membros', href: '/membros', icon: Users },
    ],
    pastor_de_campo: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
    ],
    pastor_senior_global: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
    ],
    admin: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Lideranças', href: '/organograma', icon: GitBranch },
      { title: 'Códigos', href: '/configuracoes?tab=leadership', icon: KeyRound },
      { title: 'Campos', href: '/configuracoes?tab=campos', icon: Map },
      { title: 'Redes', href: '/redes', icon: Network },
      { title: 'Coordenações', href: '/coordenacoes', icon: Layers },
      { title: 'Células', href: '/celulas', icon: Home },
      { title: 'Seed Run', href: '/configuracoes?tab=seedrun', icon: PlayCircle },
      { title: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
    default: [
      { title: 'Início', href: '/home', icon: LayoutDashboard },
      { title: 'Dashboard', href: '/dashboard', icon: Activity },
    ],
  };

  const mainItems = (() => {
    if (isDemoInstitucional) return [{ title: 'Início', href: '/home', icon: LayoutDashboard }];
    if (isPastorSeniorGlobal) return roleNavItems.pastor_senior_global;
    if (isPastorDeCampo) return roleNavItems.pastor_de_campo;
    if (isAdmin && !isDemoActive) return roleNavItems.admin;
    if (isRedeLeader) return roleNavItems.rede_leader;
    if (isCoordenador) return roleNavItems.coordenador;
    if (isCellLeaderOnly) return roleNavItems.celula_leader;
    if (isPastor) return roleNavItems.pastor_de_campo;
    return roleNavItems.default;
  })();

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
      <Sidebar className="border-r border-sidebar-border/30">
        <SidebarHeader className="border-b border-sidebar-border/30 px-4 pb-4 pt-5">
          <div className="flex items-center justify-center gap-3">
            <AtalaiaIcon className="h-10 w-auto shrink-0" />
            <div className="h-8 w-px bg-sidebar-border/20 shrink-0" />
            <img src={logoIgreja} alt="Igreja do Amor" className="h-8 w-auto object-contain shrink-0 dark-invert-logo opacity-80" />
            <div className="h-8 w-px bg-sidebar-border/20 shrink-0" />
            <img src={logoRedeAmor} alt="Rede Amor a Dois" className="h-8 w-auto object-contain shrink-0 dark-invert-logo opacity-80" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-3">
          {/* Torre de Controle — Admin only */}
          {isOriginalAdmin && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setTorreOpen(true)}
                      className="h-10 rounded-xl bg-gold/10 border border-gold/20 text-gold hover:bg-gold/15"
                    >
                      <Radar className="h-4 w-4" />
                      <span className="font-semibold text-xs tracking-wide">Torre de Controle</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Campo Selector for pastors/admin */}
          {(isPastorSeniorGlobal || isAdmin || isPastorDeCampo) && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-2 py-1.5">
                  <CampoSelector />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={`${item.href}:${item.title}`}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname + location.search === item.href || location.pathname === item.href}
                      className="h-9 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                    >
                      <NavLink to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-[13px] font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Financeiro — Admin + financial roles */}
          {(isOriginalAdmin || isFinanceiroAny) && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-3 text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">
                Financeiro
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {[
                    { title: 'Painel', href: '/financeiro', icon: Wallet },
                    { title: 'Contas a Pagar', href: '/financeiro/contas-pagar', icon: ArrowDownRight },
                    { title: 'Contas a Receber', href: '/financeiro/contas-receber', icon: ArrowUpRight },
                    { title: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa', icon: TrendingUp },
                    { title: 'Centros de Custo', href: '/financeiro/centros-custo', icon: FolderOpen },
                    { title: 'Fornecedores', href: '/financeiro/fornecedores', icon: Building2 },
                    { title: 'Conciliação', href: '/financeiro/conciliacao', icon: Landmark },
                  ].map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.href}
                        className="h-9 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                      >
                        <NavLink to={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="text-[13px] font-medium">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/35 font-semibold">
              Apoio
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/glossario'} className="h-9 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                    <NavLink to="/glossario">
                      <BookOpen className="h-4 w-4" />
                      <span className="text-[13px] font-medium">Glossário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/manual-usuario'} className="h-9 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                    <NavLink to="/manual-usuario">
                      <PlayCircle className="h-4 w-4" />
                      <span className="text-[13px] font-medium">Manual</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isOriginalAdmin && !isDemoActive && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/guia-admin'} className="h-9 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                      <NavLink to="/guia-admin">
                        <Map className="h-4 w-4" />
                        <span className="text-[13px] font-medium">Guia Admin</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={openTour} className="h-9 rounded-xl text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-[13px] font-medium">Tour</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="space-y-2 border-t border-sidebar-border/30 p-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex-1 h-8 rounded-lg border border-sidebar-border/25 text-[11px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 gap-1.5"
            >
              {theme === 'claro' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === 'padrao' ? 'Claro' : theme === 'claro' ? 'Amor' : 'Padrão'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSwitchRole}
              className="h-8 rounded-lg border border-sidebar-border/25 text-[11px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 gap-1.5 px-2.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-sidebar-accent/30 px-3 py-2">
            <Avatar className="h-8 w-8 border border-sidebar-primary/25">
              <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-foreground text-[11px] font-semibold">
                {selectedRole?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-[13px] font-medium text-sidebar-foreground">
                {selectedRole ? roleLabels[selectedRole] : 'Usuário'}
              </span>
              {isDemoActive && (
                <span className="truncate text-[10px] text-gold font-medium">Validação ativa</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 shrink-0 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
