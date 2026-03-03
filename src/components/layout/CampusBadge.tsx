import { MapPin, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

export function CampusBadge({ compact = false }: { compact?: boolean }) {
  const { activeCampo, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, scopeType } = useRole();

  if (isGlobalView || (isPastorSeniorGlobal && !activeCampo)) {
    return (
      <Badge variant="outline" className="gap-1 text-xs font-medium bg-primary/10 text-primary border-primary/30 shrink-0">
        <Globe className="h-3 w-3" />
        {compact ? 'Global' : 'Visão Global'}
      </Badge>
    );
  }

  if (!activeCampo) return null;

  return (
    <Badge variant="outline" className="gap-1 text-xs font-medium bg-accent/50 text-foreground border-border/50 shrink-0">
      <MapPin className="h-3 w-3" />
      {compact ? activeCampo.nome : `Campus ${activeCampo.nome}`}
    </Badge>
  );
}
