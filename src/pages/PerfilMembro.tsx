import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Loader2, ShieldAlert, Cake, Church, Award, HandHeart } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { AvatarEditable } from '@/components/profile/AvatarEditable';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MARCOS_ESPIRITUAIS = [
  { key: 'batismo', label: 'Batismo' },
  { key: 'encontro_com_deus', label: 'Encontro com Deus' },
  { key: 'renovo', label: 'Renovo' },
  { key: 'encontro_de_casais', label: 'Encontro de Casais' },
  { key: 'curso_lidere', label: 'Curso Lidere' },
  { key: 'is_discipulado', label: 'Discipulado' },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento' },
] as const;

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
          batismo, encontro_com_deus, renovo, encontro_de_casais,
          curso_lidere, is_discipulado, is_lider_em_treinamento,
          serve_ministerio, ministerios, whatsapp,
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
  const marcosAtivos = MARCOS_ESPIRITUAIS.filter(m => (member as any)[m.key]);
  const ministerios = (member.ministerios as string[] | null) || [];

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

        {/* Marcos Espirituais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" />
              Marcos Espirituais
            </CardTitle>
            <CardDescription>
              {marcosAtivos.length}/{MARCOS_ESPIRITUAIS.length} marcos concluídos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MARCOS_ESPIRITUAIS.map(m => {
                const ativo = (member as any)[m.key];
                return (
                  <Badge
                    key={m.key}
                    variant={ativo ? 'default' : 'outline'}
                    className={ativo ? '' : 'opacity-50'}
                  >
                    {m.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ministério */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandHeart className="h-5 w-5 text-primary" />
              Ministério
            </CardTitle>
          </CardHeader>
          <CardContent>
            {member.serve_ministerio ? (
              <div className="space-y-2">
                <Badge variant="default" className="bg-green-600">Serve em ministério</Badge>
                {ministerios.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ministerios.map(min => (
                      <Badge key={min} variant="secondary">{min}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda não serve em ministério.</p>
            )}
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