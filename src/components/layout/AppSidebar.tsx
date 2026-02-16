import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Network, FolderTree, Home,
  ClipboardCheck, Settings, LogOut, Database, GitBranch,
  Heart, Moon, Eye
} from 'lucide-react';
import logoIgreja from '@/assets/logo-igreja-do-amor.png';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DemoModeDialog } from '@/components/demo/DemoModeDialog';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem
} from '@/components/ui/sidebar';

const roleLabels: Record<string, string> = {
  pastor: 'Pastor Sênior',
  admin: 'Administrador',
  rede_leader: 'Líder de Rede',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  celula_leader: 'Líder de Célula'
};

const pastorNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Organograma', href: '/organograma', icon: GitBranch },
];

const cellLeaderNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Organograma', href: '/organograma', icon: GitBranch },
];

const fullNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Dados', href: '/dados', icon: Database },
  { title: 'Células', href: '/celulas', icon: Home },
  { title: 'Membros', href: '/membros', icon: Users },
  { title: 'Presença', href: '/presenca', icon: ClipboardCheck },
  { title: 'Organograma', href: '/organograma', icon: GitBranch },
];

const adminNavItems = [
  { title: 'Redes', href: '/redes', icon: Network },
  { title: 'Coordenações', href: '/coordenacoes', icon: FolderTree },
  { title: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRole, clearAccess, isAdmin, isRedeLeader, isCoordenador, isSupervisor, isCelulaLeader, isPastor } = useRole();
  const { isDemoActive, deactivateDemo } = useDemoMode();
  const { theme, toggleTheme } = useTheme();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  // When demo is active, the role context already reflects the impersonated role
  // but we still need to show admin nav items if the original user was admin
  const isOriginalAdmin = isAdmin || isDemoActive;
  const showAdminItems = isOriginalAdmin || isRedeLeader;

  const mainNavItems = isPastor
    ? pastorNavItems
    : (isCelulaLeader || isSupervisor) && !isCoordenador && !isRedeLeader && !isAdmin
    ? cellLeaderNavItems
    : fullNavItems;

  const handleLogout = () => {
    if (isDemoActive) deactivateDemo();
    clearAccess();
    navigate('/');
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border/50 p-5">
          <div className="flex items-center gap-3">
            <img src={logoIgreja} alt="Igreja do Amor" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-[11px] text-sidebar-foreground/60 tracking-wide">Rede Amor a 2</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Demo Mode Button - only for admin */}
          {isOriginalAdmin && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setDemoDialogOpen(true)}
                      className="h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">
                        {isDemoActive ? 'Trocar Visão' : 'Modo Demonstração'}
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
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex-1 h-9 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent gap-2"
            >
              {theme === 'padrao' ? <Heart className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'padrao' ? 'Tema Amor' : 'Tema Padrão'}
            </Button>
          </div>
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
                <span className="truncate text-[10px] text-amber-500 font-medium">Demo ativo</span>
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
