import { RefreshCw } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg animate-fade-in"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
    >
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span>Atualização disponível</span>
      <button
        onClick={applyUpdate}
        className="ml-1 px-3 py-1 rounded-md bg-primary-foreground/20 hover:bg-primary-foreground/30 active:bg-primary-foreground/40 transition-colors font-semibold text-xs uppercase tracking-wide"
      >
        Atualizar
      </button>
    </div>
  );
}
