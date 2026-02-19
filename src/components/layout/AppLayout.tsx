import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Separator } from '@/components/ui/separator';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { isDemoActive } = useDemoMode();
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isPWAMobile = isPWA && isMobile;
  const navigate = useNavigate();
  const location = useLocation();

  // In PWA mobile, show back button on non-root pages
  const isRootPage = location.pathname === '/dashboard';
  const showBackButton = isPWAMobile && !isRootPage;

  return (
    <SidebarProvider>
      {/* Hide sidebar completely in PWA mobile — bottom nav replaces it */}
      {!isPWAMobile && <AppSidebar />}
      <SidebarInset className={isDemoActive ? 'pt-10' : ''}>
        <header
          className="flex shrink-0 items-center gap-2 border-b border-border/30 px-4 bg-background/95 backdrop-blur-md sticky top-0 z-10"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            height: isPWAMobile ? 'calc(48px + env(safe-area-inset-top, 0px))' : '56px',
            paddingTop: isPWAMobile ? 'env(safe-area-inset-top, 0px)' : undefined,
          }}
        >
          {/* PWA mobile: back button */}
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-11 w-11 -ml-2 rounded-xl active:bg-accent/60 touch-manipulation transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}

          {/* Desktop: sidebar trigger */}
          {!isPWAMobile && <SidebarTrigger className="-ml-1" />}

          {title && (
            <>
              {!isPWAMobile && <Separator orientation="vertical" className="mr-2 h-4" />}
              <h1
                className="text-sm font-semibold text-foreground tracking-wide truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {title}
              </h1>
            </>
          )}
        </header>
        <main
          className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 internal-page-bg"
          style={isPWAMobile ? { paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' } : undefined}
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </SidebarInset>

      {/* Bottom navigation — only renders in PWA mobile */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
