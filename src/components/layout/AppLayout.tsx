import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { isDemoActive } = useDemoMode();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={isDemoActive ? 'pt-10' : ''}>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/30 px-4 bg-background/95 backdrop-blur-md sticky top-0 z-10"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          <SidebarTrigger className="-ml-1" />
          {title && (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-sm font-semibold text-foreground tracking-wide"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >{title}</h1>
            </>
          )}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 internal-page-bg">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
