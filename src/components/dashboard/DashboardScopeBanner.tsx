import { MapPin, Globe, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

/**
 * Banner shown at the top of every dashboard content area.
 * Shows the active campus or "Visão Global".
 * Shows error if campus is missing when required.
 */
export function DashboardScopeBanner() {
  const { activeCampo, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, isAdmin } = useRole();
  const canGlobal = isPastorSeniorGlobal || isAdmin;

  // Global view
  if (canGlobal && isGlobalView) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="gap-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/30 py-1 px-3">
          <Globe className="h-3.5 w-3.5" />
          Visão Global — Todos os Campus
        </Badge>
      </div>
    );
  }

  // Campus selected
  if (activeCampo) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="gap-1.5 text-sm font-medium bg-accent/50 text-foreground border-border/50 py-1 px-3">
          <MapPin className="h-3.5 w-3.5" />
          Você está no Campus: {activeCampo.nome}
        </Badge>
      </div>
    );
  }

  // Missing campus (should not happen but safety net)
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Escopo sem campus definido.</strong> Os dados exibidos podem estar incorretos. 
        Contate o administrador para vincular seu acesso a um campus.
      </AlertDescription>
    </Alert>
  );
}
