import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Compass, ChevronRight, CheckCircle2, Sparkles, MessageCircle, Users } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useProximosPassos, ProximoPasso } from '@/hooks/useProximosPassos';
import { EmptyState } from '@/components/ui/empty-state';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/animations';
import { StatCard } from '@/components/ui/stat-card';
import { openWhatsApp } from '@/lib/whatsapp';

interface ProximosPassosPanelProps {
  celulaId: string;
  celulaName?: string;
}

function MemberPassoCard({ passo }: { passo: ProximoPasso }) {
  const initials = passo.memberName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const whatsapp = passo.member.whatsapp;

  const handleWhatsApp = () => {
    if (!whatsapp || !passo.nextStep) return;
    const msg = `Olá ${passo.memberName.split(' ')[0]}! 🙏\n\nEstou entrando em contato porque vi que seu próximo passo na jornada espiritual é o *${passo.nextStep.label}*.\n\nVamos conversar sobre isso? Seria incrível ver você avançando! ❤️`;
    openWhatsApp(whatsapp, msg);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/30 transition-colors">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={passo.member.profile?.avatar_url || ''} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{passo.memberName}</p>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {passo.completedCount}/{passo.totalApplicable}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1.5 mt-1">
          <Progress value={passo.percentage} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-medium">{passo.percentage}%</span>
        </div>

        {passo.nextStep ? (
          <div className="flex items-center gap-1 mt-1.5">
            <ChevronRight className="h-3 w-3 text-gold shrink-0" />
            <span className="text-xs text-muted-foreground">Próximo:</span>
            <span className="text-xs font-medium text-gold">{passo.nextStep.emoji} {passo.nextStep.shortLabel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1.5">
            <CheckCircle2 className="h-3 w-3 text-vida shrink-0" />
            <span className="text-xs font-medium text-vida">Jornada completa!</span>
          </div>
        )}
      </div>

      {passo.nextStep && whatsapp && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-vida hover:text-vida hover:bg-vida/10"
          onClick={handleWhatsApp}
          title={`Convidar para ${passo.nextStep.label}`}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function ProximosPassosPanel({ celulaId, celulaName }: ProximosPassosPanelProps) {
  const { data: members, isLoading } = useMembers(celulaId);
  const { passos, summary } = useProximosPassos(members);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground text-sm">Analisando jornadas...</div>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Sem membros cadastrados"
        description="Cadastre membros para ver os próximos passos da jornada espiritual."
      />
    );
  }

  const withPending = passos.filter(p => p.nextStep !== null);
  const complete = passos.filter(p => p.nextStep === null);

  return (
    <FadeIn>
      <div className="space-y-4">
        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total de Membros" value={summary.total} icon={Users} />
            <StatCard label="Precisam Avançar" value={summary.needAttention} icon={Compass} className="border-gold/30" />
            <StatCard label="Jornada Completa" value={summary.fullyComplete} icon={CheckCircle2} className="border-vida/30" />
            <StatCard label="Conclusão Média" value={`${summary.avgCompletion}%`} icon={Sparkles} />
          </div>
        )}

        {/* Members needing next step */}
        {withPending.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-5 w-5 text-gold" />
                Próximos Passos
              </CardTitle>
              <CardDescription>
                {withPending.length} membro{withPending.length > 1 ? 's' : ''} com próximo passo identificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <StaggerContainer>
                {withPending.map(passo => (
                  <StaggerItem key={passo.member.id}>
                    <MemberPassoCard passo={passo} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </CardContent>
          </Card>
        )}

        {/* Fully complete members */}
        {complete.length > 0 && (
          <Card className="border-vida/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-vida" />
                Jornada Completa
              </CardTitle>
              <CardDescription>
                {complete.length} membro{complete.length > 1 ? 's' : ''} completaram todos os marcos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {complete.map(passo => (
                <MemberPassoCard key={passo.member.id} passo={passo} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </FadeIn>
  );
}
