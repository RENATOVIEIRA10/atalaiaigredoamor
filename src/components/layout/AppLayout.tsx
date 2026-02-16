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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/30 px-4 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
          <SidebarTrigger className="-ml-1" />
          {title && (
            <>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            </>
          )}
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
