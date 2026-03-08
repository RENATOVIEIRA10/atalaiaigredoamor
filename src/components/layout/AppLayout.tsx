import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Radio } from 'lucide-react';
import { CampoSelector } from '@/components/campo/CampoSelector';
import { CampusBadge } from './CampusBadge';
import { useTorreControle } from '@/contexts/TorreControleContext';
import { PastoralTourContext, usePastoralTourProvider } from '@/hooks/usePastoralTour';
import { PastoralTourDialog } from '@/components/dashboard/PastoralTourDialog';
import { PastoralAssistant } from '@/components/guide/PastoralAssistant';

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
  const { isOperating, activeState } = useTorreControle();
  const tourCtx = usePastoralTourProvider();

  const isRootPage = location.pathname === '/home' || location.pathname === '/dashboard';
  const showBackButton = isPWAMobile && !isRootPage;

  // --- PWA App Shell ---
  if (isPWAMobile) {
    return (
      <PastoralTourContext.Provider value={tourCtx}>
        <div className="flex flex-col h-[100dvh] bg-background" style={{ height: '-webkit-fill-available' }}>
          <header
            className="flex shrink-0 items-center gap-2 border-b border-border/30 px-4 bg-background/90 backdrop-blur-2xl z-30"
            style={{
              boxShadow: '0 12px 30px -26px rgba(0,0,0,0.9)',
              minHeight: 'calc(48px + env(safe-area-inset-top, 0px))',
              paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
          >
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center h-11 w-11 -ml-2 rounded-xl active:bg-accent/60 touch-manipulation transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            {title && (
              <h1 className="text-sm font-semibold text-foreground tracking-wide truncate font-display">
                {title}
              </h1>
            )}
            {isOperating && activeState.label && (
              <Badge variant="outline" className="text-[9px] h-5 border-gold/30 text-gold bg-gold/8 shrink-0 gap-1">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {activeState.label}
              </Badge>
            )}
            <div className="ml-auto">
              <CampusBadge compact />
            </div>
          </header>

          <main
            className="flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-5 internal-page-bg pwa-scroll-area"
            style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="pwa-page-enter" key={location.pathname + location.search}>
              {children}
            </div>
          </main>

          <MobileBottomNav />
          <PastoralAssistant />
        </div>
        <PastoralTourDialog open={tourCtx.isOpen} onClose={tourCtx.closeTour} />
      </PastoralTourContext.Provider>
    );
  }

  // --- Web / Desktop layout ---
  return (
    <PastoralTourContext.Provider value={tourCtx}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className={isDemoActive ? 'pt-10' : ''}>
          <header
            className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border/30 bg-background/80 px-5 backdrop-blur-2xl md:px-8"
            style={{ boxShadow: '0 20px 40px -34px rgba(0, 0, 0, 0.6)' }}
          >
            <SidebarTrigger className="-ml-1 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground" />
            {title && (
              <>
                <Separator orientation="vertical" className="mr-2 h-5 bg-border/30" />
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground font-display">
                  {title}
                </h1>
              </>
            )}
            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <CampusBadge />
              <CampoSelector />
            </div>
          </header>
          <main className="internal-page-bg flex-1 overflow-auto p-4 md:p-8 lg:p-10">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </SidebarInset>
        <PastoralAssistant />
      </SidebarProvider>
      <PastoralTourDialog open={tourCtx.isOpen} onClose={tourCtx.closeTour} />
    </PastoralTourContext.Provider>
  );
}
