import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Plus, Search, Loader2, MoreVertical, Eye, Pencil, Camera, Trash2, Cake, Church, CalendarPlus } from 'lucide-react';
import { useMembers, useRemoveMember, Member } from '@/hooks/useMembers';
import { MemberFormDialogSimple } from './MemberFormDialogSimple';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { format, parseISO, differenceInYears, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EventRegistrationDialog } from '@/components/events/EventRegistrationDialog';

interface CellLeaderMembrosTabProps {
  celulaId: string;
  celulaName: string;
}

function formatMemberSince(joinedAt: string): string {
  const date = parseISO(joinedAt);
  return format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
}

function formatChurchTime(joinedAt: string | null): string {
  if (!joinedAt) return '';
  const joinDate = parseISO(joinedAt);
  const now = new Date();
  const years = differenceInYears(now, joinDate);
  const months = differenceInMonths(now, joinDate) % 12;
  if (years === 0 && months === 0) return '< 1 mês';
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
}

export function CellLeaderMembrosTab({ celulaId, celulaName }: CellLeaderMembrosTabProps) {
  const { data: members, isLoading } = useMembers(celulaId);
  const removeMember = useRemoveMember();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<Member | null>(null);
  const [eventRegTarget, setEventRegTarget] = useState<Member | null>(null);

  const filtered = (members || []).filter(m => {
    const name = (m.profile as any)?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleRemove = async (member: Member) => {
    const name = (member.profile as any)?.name || 'este membro';
    if (confirm(`Remover ${name} da célula?`)) {
      await removeMember.mutateAsync(member.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Top bar: search + add */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membro…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card h-11"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)} className="h-11 shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Novo Membro
          </Button>
        </div>

        {/* Counter */}
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'membro' : 'membros'}
        </p>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
            description={search ? 'Tente outro termo de busca.' : 'Clique em "Novo Membro" para começar.'}
          />
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {filtered.map((member) => {
                const profile = member.profile as any;
                const name = profile?.name || 'Sem nome';
                const avatarUrl = profile?.avatar_url;
                const birthDate = profile?.birth_date;
                const churchTime = formatChurchTime(profile?.joined_church_at);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar */}
                    <Avatar
                      className="h-10 w-10 cursor-pointer shrink-0"
                      onClick={() => setViewingProfile(member)}
                    >
                      <AvatarImage src={avatarUrl || undefined} crossOrigin="anonymous" />
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setViewingProfile(member)}
                      >
                        {name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {birthDate && (
                          <span className="flex items-center gap-0.5">
                            <Cake className="h-3 w-3" />
                            {format(parseISO(birthDate), 'dd/MM', { locale: ptBR })}
                          </span>
                        )}
                        {churchTime && (
                          <span className="flex items-center gap-0.5">
                            <Church className="h-3 w-3" />
                            {churchTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desde */}
                    <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                      {formatMemberSince(member.joined_at)}
                    </span>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingProfile(member)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/perfil/membro/${member.id}`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar membro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/perfil/membro/${member.id}`)}>
                          <Camera className="h-4 w-4 mr-2" />
                          Alterar foto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEventRegTarget(member)}>
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Inscrever em Evento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemove(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover da célula
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>

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
          entityName={celulaName}
          memberId={viewingProfile.id}
        />
      )}

      {eventRegTarget && (
        <EventRegistrationDialog
          open={!!eventRegTarget}
          onOpenChange={(open) => !open && setEventRegTarget(null)}
          personType="membro"
          membroId={eventRegTarget.id}
          fullName={(eventRegTarget.profile as any)?.name || 'Sem nome'}
          whatsapp={eventRegTarget.whatsapp}
          celulaId={celulaId}
        />
      )}
    </>
  );
}
