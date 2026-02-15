import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Network, FolderTree, ClipboardCheck, Home, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarUpload } from './AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useRole } from '@/contexts/RoleContext';

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

export function ProfileViewerDialog({ open, onOpenChange, person1, person2, role, entityName, entityType = 'membro', parentName, canEdit }: ProfileViewerDialogProps) {
  const isCouple = !!person2;
  const RoleIcon = roleIcons[entityType] || Users;
  const roleLabel = role || roleLabels[entityType] || 'Perfil';
  const queryClient = useQueryClient();
  const { isAdmin, isRedeLeader, isCoordenador, isSupervisor } = useRole();
  const [editingPhoto, setEditingPhoto] = useState<'person1' | 'person2' | null>(null);

  // Determine edit permission based on hierarchy
  const canEditPhoto = canEdit !== undefined ? canEdit : (isAdmin || isRedeLeader || isCoordenador || isSupervisor);

  const handlePhotoUploaded = async (profileId: string, url: string) => {
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId);
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['supervisores'] });
    queryClient.invalidateQueries({ queryKey: ['celulas'] });
    queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
    queryClient.invalidateQueries({ queryKey: ['redes'] });
    queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });
    queryClient.invalidateQueries({ queryKey: ['organograma'] });
    setEditingPhoto(null);
  };

  const renderPersonAvatar = (person: ProfilePerson | null | undefined, personKey: 'person1' | 'person2') => {
    if (!person) return null;
    const isEditing = editingPhoto === personKey;

    return (
      <div className="flex flex-col items-center gap-2">
        {isEditing && person.id ? (
          <AvatarUpload
            currentUrl={person.avatar_url}
            onUploaded={(url) => handlePhotoUploaded(person.id!, url)}
            fallbackText={person.name?.charAt(0) || '?'}
            size="lg"
          />
        ) : (
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={person.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {person.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {canEditPhoto && person.id && (
              <button
                type="button"
                onClick={() => setEditingPhoto(personKey)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        )}
        <p className="font-semibold text-center">{person.name || 'Sem nome'}</p>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setEditingPhoto(null)} className="text-xs">
            Cancelar
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setEditingPhoto(null); onOpenChange(v); }}>
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
            {renderPersonAvatar(person1, 'person1')}

            {isCouple && (
              <>
                <span className="text-muted-foreground font-medium text-lg">&</span>
                {renderPersonAvatar(person2, 'person2')}
              </>
            )}
          </div>

          {/* Edit photo button when not editing */}
          {canEditPhoto && !editingPhoto && (
            <p className="text-xs text-muted-foreground">Passe o mouse sobre a foto para editar</p>
          )}

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
