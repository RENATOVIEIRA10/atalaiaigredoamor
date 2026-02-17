import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Loader2, Trash2, ChevronDown, ChevronUp, Cake, Church, Calendar, Save } from 'lucide-react';
import { Member, useMembers, useUpdateMember, useRemoveMember } from '@/hooks/useMembers';
import { useCasais } from '@/hooks/useCasais';
import { MemberFormDialogSimple } from './MemberFormDialogSimple';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

interface MembersListProps {
  celulaId: string;
}

const MARCOS_ESPIRITUAIS = [
  { key: 'batismo', label: 'Batismo' },
  { key: 'encontro_com_deus', label: 'Encontro com Deus' },
  { key: 'renovo', label: 'Renovo' },
  { key: 'encontro_de_casais', label: 'Encontro de Casais' },
  { key: 'curso_lidere', label: 'Curso Lidere' },
  { key: 'is_discipulado', label: 'É Discipulado' },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento' },
] as const;

function formatChurchTime(joinedAt: string | null): string {
  if (!joinedAt) return 'Não informado';
  
  const joinDate = parseISO(joinedAt);
  const now = new Date();
  const years = differenceInYears(now, joinDate);
  const months = differenceInMonths(now, joinDate) % 12;
  
  if (years === 0 && months === 0) return 'Menos de 1 mês';
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function MembersList({ celulaId }: MembersListProps) {
  const { data: members, isLoading } = useMembers(celulaId);
  const { data: casais } = useCasais(celulaId);
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [editingDates, setEditingDates] = useState<Record<string, { birth_date: string; joined_church_at: string }>>({});
  const [savingProfile, setSavingProfile] = useState<string | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Member | null>(null);

  const toggleExpanded = (memberId: string) => {
    setExpandedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleMarcoChange = async (member: Member, marco: string, checked: boolean) => {
    await updateMember.mutateAsync({
      id: member.id,
      [marco]: checked,
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      await removeMember.mutateAsync(memberId);
    }
  };

  const initEditingDates = (member: Member) => {
    const profile = member.profile as any;
    setEditingDates(prev => ({
      ...prev,
      [member.id]: {
        birth_date: profile?.birth_date || '',
        joined_church_at: profile?.joined_church_at || '',
      },
    }));
  };

  const handleDateChange = (memberId: string, field: 'birth_date' | 'joined_church_at', value: string) => {
    setEditingDates(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      },
    }));
  };

  const saveDates = async (member: Member) => {
    const profile = member.profile as any;
    if (!profile?.id) return;
    
    const dates = editingDates[member.id];
    if (!dates) return;
    
    setSavingProfile(member.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          birth_date: dates.birth_date || null,
          joined_church_at: dates.joined_church_at || null,
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
      toast({ title: 'Datas atualizadas com sucesso!' });
      
      // Clear editing state
      setEditingDates(prev => {
        const next = { ...prev };
        delete next[member.id];
        return next;
      });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSavingProfile(null);
    }
  };

  const getMarcoCount = (member: Member) => {
    let count = 0;
    if (member.batismo) count++;
    if (member.encontro_com_deus) count++;
    if (member.renovo) count++;
    if (member.encontro_de_casais) count++;
    if (member.curso_lidere) count++;
    if (member.is_discipulado) count++;
    if (member.is_lider_em_treinamento) count++;
    return count;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros da Célula
            </CardTitle>
            <CardDescription>
              {members?.length || 0} membros cadastrados
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Membro
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {members?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro cadastrado ainda. Clique em "Adicionar Membro" para começar.
            </div>
          ) : (
            members?.map((member) => {
              const profile = member.profile as any;
              const isEditing = !!editingDates[member.id];
              const memberCasal = casais?.find(c => c.member1_id === member.id || c.member2_id === member.id);
              
              return (
                <Collapsible
                  key={member.id}
                  open={expandedMembers.has(member.id)}
                  onOpenChange={() => {
                    toggleExpanded(member.id);
                    if (!expandedMembers.has(member.id)) {
                      initEditingDates(member);
                    }
                  }}
                >
                  <div className="border rounded-lg p-3">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3">
                            <Avatar 
                              className="h-10 w-10 border-2 border-background cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setViewingProfile(member); }}
                            >
                              <AvatarImage src={profile?.avatar_url || undefined} crossOrigin="anonymous" />
                              <AvatarFallback>
                                {profile?.name?.charAt(0) || 'M'}
                              </AvatarFallback>
                            </Avatar>
                            {memberCasal?.photo_url && (
                              <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-primary/20">
                                <AvatarImage src={memberCasal.photo_url} />
                                <AvatarFallback><Users className="h-4 w-4" /></AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div>
                            <p className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setViewingProfile(member); }}>
                              {profile?.name || 'Sem nome'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {profile?.joined_church_at && (
                                <span className="flex items-center gap-1">
                                  <Church className="h-3 w-3" />
                                  {formatChurchTime(profile.joined_church_at)}
                                </span>
                              )}
                              {profile?.birth_date && (
                                <span className="flex items-center gap-1">
                                  <Cake className="h-3 w-3" />
                                  {format(parseISO(profile.birth_date), "dd/MM", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getMarcoCount(member)}/7 marcos
                          </Badge>
                          {expandedMembers.has(member.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="pt-4 space-y-4">
                      {/* Avatar Upload */}
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <AvatarUpload
                          currentUrl={profile?.avatar_url}
                          onUploaded={async (url) => {
                            if (profile?.id) {
                              await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
                              queryClient.invalidateQueries({ queryKey: ['members'] });
                            }
                          }}
                          fallbackText={profile?.name?.charAt(0) || 'M'}
                          size="lg"
                        />
                        <div>
                          <p className="text-sm font-medium">Foto de Perfil</p>
                          <p className="text-xs text-muted-foreground">Clique para alterar</p>
                        </div>
                      </div>
                      {/* Dates Section */}
                      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Datas Importantes:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Cake className="h-3 w-3" />
                              Data de Nascimento
                            </Label>
                            <Input
                              type="date"
                              value={editingDates[member.id]?.birth_date || ''}
                              onChange={(e) => handleDateChange(member.id, 'birth_date', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <Church className="h-3 w-3" />
                              Entrada na Igreja
                            </Label>
                            <Input
                              type="date"
                              value={editingDates[member.id]?.joined_church_at || ''}
                              onChange={(e) => handleDateChange(member.id, 'joined_church_at', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveDates(member)}
                          disabled={savingProfile === member.id}
                          className="w-full"
                        >
                          {savingProfile === member.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3 mr-1" />
                          )}
                          Salvar Datas
                        </Button>
                      </div>
                      
                      {/* Marcos Section */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Marcos Espirituais:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {MARCOS_ESPIRITUAIS.map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${member.id}-${key}`}
                                checked={member[key as keyof Member] as boolean}
                                onCheckedChange={(checked) => 
                                  handleMarcoChange(member, key, checked as boolean)
                                }
                                disabled={updateMember.isPending}
                              />
                              <Label
                                htmlFor={`${member.id}-${key}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Membro
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>

      <MemberFormDialogSimple
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        celulaId={celulaId}
      />

      {viewingProfile && (
        <ProfileViewerDialog
          open={!!viewingProfile}
          onOpenChange={(open) => !open && setViewingProfile(null)}
          person1={(viewingProfile.profile as any) || undefined}
          entityType="membro"
          entityName={viewingProfile.celula?.name}
          memberId={viewingProfile.id}
        />
      )}
    </>
  );
}
