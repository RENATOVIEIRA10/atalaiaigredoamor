import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Loader2, ShieldAlert, Cake, Church } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { AvatarEditable } from '@/components/profile/AvatarEditable';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PerfilMembro() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { scopeType } = useRole();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ['member-profile', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, celula_id, is_active,
          profile:profiles!members_profile_id_fkey(id, name, avatar_url, email, birth_date, joined_church_at),
          celula:celulas!members_celula_id_fkey(id, name)
        `)
        .eq('id', memberId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  // Membro não tem login — somente liderança/admin edita
  const canEdit = scopeType === 'admin' || scopeType === 'celula' || scopeType === 'supervisor' || scopeType === 'coordenacao' || scopeType === 'rede' || scopeType === 'pastor';

  const handlePhotoSaved = async (url: string) => {
    const profileId = (member?.profile as any)?.id;
    if (profileId) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          {error ? 'Erro ao carregar perfil do membro.' : 'Membro não encontrado.'}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const profile = member.profile as any;
  const celula = member.celula as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Perfil do Membro</h1>
            <p className="text-xs text-muted-foreground">Gestão pela liderança</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Photo + Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" />
              {profile?.name || 'Membro'}
            </CardTitle>
            <CardDescription>
              {canEdit
                ? 'Toque ou clique na foto para alterá-la.'
                : 'Visualização do perfil.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <AvatarEditable
              currentUrl={profile?.avatar_url}
              canEdit={canEdit}
              onSaved={handlePhotoSaved}
              fallbackText={profile?.name?.charAt(0) || 'M'}
              size="xl"
            />

            {/* Basic info */}
            <div className="w-full space-y-2">
              {celula?.name && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Célula</span>
                  <Badge variant="secondary">{celula.name}</Badge>
                </div>
              )}
              {profile?.birth_date && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5" />
                    Aniversário
                  </span>
                  <span className="text-sm font-medium">
                    {format(parseISO(profile.birth_date), "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
              )}
              {profile?.joined_church_at && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Church className="h-3.5 w-3.5" />
                    Na igreja desde
                  </span>
                  <span className="text-sm font-medium">
                    {format(parseISO(profile.joined_church_at), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
