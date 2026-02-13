import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Network, FolderTree, ClipboardCheck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePerson {
  name?: string;
  avatar_url?: string | null;
  email?: string | null;
  birth_date?: string | null;
}

interface ProfileViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person1?: ProfilePerson | null;
  person2?: ProfilePerson | null;
  role?: string;
  entityName?: string;
  entityType?: 'celula' | 'supervisor' | 'coordenacao' | 'rede' | 'membro';
  parentName?: string;
}

const roleLabels: Record<string, string> = {
  celula: 'Líder de Célula',
  supervisor: 'Supervisor',
  coordenacao: 'Coordenador',
  rede: 'Líder de Rede',
  membro: 'Membro',
};

const roleIcons: Record<string, any> = {
  celula: Home,
  supervisor: ClipboardCheck,
  coordenacao: FolderTree,
  rede: Network,
  membro: Users,
};

export function ProfileViewerDialog({ open, onOpenChange, person1, person2, role, entityName, entityType = 'membro', parentName }: ProfileViewerDialogProps) {
  const isCouple = !!person2;
  const RoleIcon = roleIcons[entityType] || Users;
  const roleLabel = role || roleLabels[entityType] || 'Perfil';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5 text-primary" />
            {roleLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Avatar(s) */}
          <div className={cn("flex items-center", isCouple ? "gap-4" : "")}>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={person1?.avatar_url || undefined} crossOrigin="anonymous" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {person1?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-center">{person1?.name || 'Sem nome'}</p>
            </div>

            {isCouple && (
              <>
                <span className="text-muted-foreground font-medium text-lg">&</span>
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage src={person2?.avatar_url || undefined} crossOrigin="anonymous" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {person2?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-center">{person2?.name || 'Sem nome'}</p>
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col items-center gap-2 w-full">
            <Badge variant="secondary" className="gap-1.5">
              <RoleIcon className="h-3 w-3" />
              {roleLabel}
            </Badge>
            {entityName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {entityName}
              </p>
            )}
            {parentName && (
              <p className="text-xs text-muted-foreground">{parentName}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
