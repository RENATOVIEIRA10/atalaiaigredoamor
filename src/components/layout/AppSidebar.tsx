import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { moduleIcons, roleIcons, actionIcons, themeIcons, roleLabels } from '@/lib/icons';
import { ShieldCheck, LogOut, PlayCircle, RefreshCw, HelpCircle } from 'lucide-react';
import logoIgreja from '@/assets/logo-igreja-do-amor-new.png';
import logoRedeAmor from '@/assets/logo-amor-a-dois-new.png';
import { AtalaiaIcon } from '@/components/institutional/AtalaiaLogoHeader';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCampo } from '@/contexts/CampoContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DemoModeDialog } from '@/components/demo/DemoModeDialog';
import { CampoSelector } from '@/components/campo/CampoSelector';
import { usePastoralTour } from '@/hooks/usePastoralTour';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';

const pastorNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: moduleIcons.dashboard },
  { title: 'Organograma', href: '/organograma', icon: moduleIcons.organograma },
];

const cellLeaderNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: moduleIcons.dashboard },
  { title: 'Organograma', href: '/organograma', icon: moduleIcons.organograma },
];

const demoInstitucionalNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: moduleIcons.dashboard },
  { title: 'Organograma', href: '/organograma', icon: moduleIcons.organograma },
];

const fullNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: moduleIcons.dashboard },
  { title: 'Dados', href: '/dados', icon: moduleIcons.dados },
  { title: 'Células', href: '/celulas', icon: moduleIcons.celulas },
  { title: 'Membros', href: '/membros', icon: moduleIcons.membros },
  { title: 'Presença', href: '/presenca', icon: moduleIcons.presenca },
  { title: 'Organograma', href: '/organograma', icon: moduleIcons.organograma },
];

const adminNavItems = [
  { title: 'Redes', href: '/redes', icon: moduleIcons.redes },
  { title: 'Coordenações', href: '/coordenacoes', icon: moduleIcons.coordenacoes },
  { title: 'Configurações', href: '/configuracoes', icon: moduleIcons.configuracoes },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRole, clearAccess, isAdmin, isRedeLeader, isCoordenador, isSupervisor, isCelulaLeader, isPastor, isDemoInstitucional, isPastorSeniorGlobal, isPastorDeCampo } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const { openTour } = usePastoralTour();

  // When demo is active, the role context already reflects the impersonated role
  // but we still need to show admin nav items if the original user was admin
  const isOriginalAdmin = (isAdmin || isDemoActive) && !isDemoInstitucional;
  const showAdminItems = (isOriginalAdmin || isRedeLeader) && !isDemoInstitucional;

  const mainNavItems = isDemoInstitucional
    ? demoInstitucionalNavItems
    : isPastor
    ? pastorNavItems
    : (isCelulaLeader || isSupervisor) && !isCoordenador && !isRedeLeader && !isAdmin
    ? cellLeaderNavItems
    : fullNavItems;

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
        <SidebarHeader className="border-b border-sidebar-border/50 p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <AtalaiaIcon className="h-8 w-auto" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoIgreja} alt="Igreja do Amor" className="h-8 w-auto object-contain" />
            <div className="h-6 w-px bg-sidebar-border/30" />
            <img src={logoRedeAmor} alt="Rede Amor a Dois" className="h-8 w-auto object-contain" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Campo Selector - for pastor_senior_global, admin, pastor_de_campo */}
          {(isPastorSeniorGlobal || isAdmin || isPastorDeCampo) && (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-3 py-2">
                  <CampoSelector />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Demo Mode Button - only for admin */}
          {isOriginalAdmin && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setDemoDialogOpen(true)}
                      className="h-11 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
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

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest px-3">Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
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

          {showAdminItems && !isDemoActive && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest px-3">Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
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
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest px-3">Apoio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/manual-usuario'} className="h-11 rounded-xl">
                    <NavLink to="/manual-usuario">
                      <PlayCircle className="h-4 w-4" />
                      <span className="font-medium">Manual do Usuário</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

        <SidebarFooter className="border-t border-sidebar-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex-1 h-9 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent gap-2"
            >
              {theme === 'padrao' ? <themeIcons.amor className="h-4 w-4" /> : <themeIcons.padrao className="h-4 w-4" />}
              {theme === 'padrao' ? 'Tema Amor' : 'Tema Padrão'}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchRole}
            className="w-full h-9 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent gap-2 justify-start"
          >
            <RefreshCw className="h-4 w-4" />
            Trocar Função
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-sidebar-foreground/20">
              <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-foreground text-xs font-semibold">
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
              className="h-9 w-9 shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
