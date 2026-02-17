import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Network, FolderTree, ClipboardCheck, Home, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarEditable } from './AvatarEditable';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { canEditAvatar } from '@/lib/avatarPermissions';

interface ProfilePerson {
  id?: string;
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
  canEdit?: boolean;
  /** Leadership couple ID — enables "Editar perfil" button linking to /perfil/casal/:id */
  coupleId?: string;
  /** Member ID — enables "Editar perfil" button linking to /perfil/membro/:id */
  memberId?: string;
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

export function ProfileViewerDialog({ open, onOpenChange, person1, person2, role, entityName, entityType = 'membro', parentName, canEdit, coupleId, memberId }: ProfileViewerDialogProps) {
  const isCouple = !!person2;
  const RoleIcon = roleIcons[entityType] || Users;
  const roleLabel = role || roleLabels[entityType] || 'Perfil';
  const queryClient = useQueryClient();
  const { scopeType } = useRole();
  const navigate = useNavigate();

  // Determine edit permission based on hierarchy
  const canEditPhoto = canEdit !== undefined
    ? canEdit
    : canEditAvatar(scopeType, entityType);

  const handleGoToProfile = () => {
    onOpenChange(false);
    if (coupleId) {
      navigate(`/perfil/casal/${coupleId}`);
    } else if (memberId) {
      navigate(`/perfil/membro/${memberId}`);
    }
  };

  const showProfileButton = canEditPhoto && (coupleId || memberId);
  const handlePhotoSaved = async (profileId: string, url: string) => {
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId);
    // AvatarEditable already invalidates queries internally
  };

  const renderPerson = (person: ProfilePerson | null | undefined) => {
    if (!person) return null;

    return (
      <div className="flex flex-col items-center gap-1">
        <AvatarEditable
          currentUrl={person.avatar_url}
          canEdit={canEditPhoto && !!person.id}
          onSaved={(url) => { if (person.id) handlePhotoSaved(person.id, url); }}
          fallbackText={person.name?.charAt(0) || '?'}
          size="lg"
        />
        <p className="font-semibold text-center">{person.name || 'Sem nome'}</p>
      </div>
    );
  };

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
            {renderPerson(person1)}

            {isCouple && (
              <>
                <span className="text-muted-foreground font-medium text-lg">&</span>
                {renderPerson(person2)}
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

          {/* Explicit CTA — desktop-friendly, no hover needed */}
          {showProfileButton && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleGoToProfile}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Editar perfil
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
