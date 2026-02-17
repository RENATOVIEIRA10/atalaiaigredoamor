import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Loader2, ShieldAlert } from 'lucide-react';
import { useLeadershipCouple } from '@/hooks/useLeadershipCouples';
import { useRole } from '@/contexts/RoleContext';
import { canEditAvatar } from '@/lib/avatarPermissions';
import { AvatarEditable } from '@/components/profile/AvatarEditable';
import { supabase } from '@/integrations/supabase/client';
import { useCoupleFunctions } from '@/hooks/useCoupleFunctions';

export default function PerfilCasal() {
  const { coupleId } = useParams<{ coupleId: string }>();
  const navigate = useNavigate();
  const { scopeType } = useRole();
  const { data: couple, isLoading, error } = useLeadershipCouple(coupleId);
  const { couples: allCouples } = useCoupleFunctions();

  // Find functions for this couple
  const coupleData = allCouples.find(c => c.coupleId === coupleId);

  // Permission: admin always, or self (couple member matching scope)
  const canEdit = scopeType === 'admin' || canEditAvatar(scopeType, 'coordenacao', false);

  const handlePhotoSaved = async (profileId: string, url: string) => {
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !couple) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          {error ? 'Erro ao carregar perfil do casal.' : 'Casal não encontrado.'}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  const coupleName = [couple.spouse1?.name, couple.spouse2?.name].filter(Boolean).join(' & ');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Perfil do Casal</h1>
            <p className="text-sm text-muted-foreground">{coupleName}</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Fotos do Casal
            </CardTitle>
            <CardDescription>
              {canEdit
                ? 'Toque ou clique em uma foto para alterá-la.'
                : 'Visualização do perfil do casal.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              {/* Spouse 1 */}
              {couple.spouse1 && (
                <AvatarEditable
                  currentUrl={couple.spouse1.avatar_url}
                  canEdit={canEdit}
                  onSaved={(url) => handlePhotoSaved(couple.spouse1!.id, url)}
                  fallbackText={couple.spouse1.name?.charAt(0) || '?'}
                  size="xl"
                />
              )}

              <span className="text-2xl text-muted-foreground font-light">&</span>

              {/* Spouse 2 */}
              {couple.spouse2 && (
                <AvatarEditable
                  currentUrl={couple.spouse2.avatar_url}
                  canEdit={canEdit}
                  onSaved={(url) => handlePhotoSaved(couple.spouse2!.id, url)}
                  fallbackText={couple.spouse2.name?.charAt(0) || '?'}
                  size="xl"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Functions (read-only) */}
        {coupleData && coupleData.functions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funções na Rede</CardTitle>
              <CardDescription>Vínculos atuais deste casal (somente leitura).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {coupleData.functions.map((fn, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{fn.roleLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {fn.entityName}
                      {fn.parentName && ` · ${fn.parentName}`}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{fn.roleLabel}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Back button at the bottom for mobile */}
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
