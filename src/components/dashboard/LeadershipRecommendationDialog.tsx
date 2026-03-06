import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMembers } from '@/hooks/useMembers';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateLeadershipRecommendation, useRecommendationJourneyData } from '@/hooks/useLeadershipRecommendations';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useRedes } from '@/hooks/useRedes';
import { useUserAccessLinks } from '@/hooks/useUserAccessLinks';

interface LeadershipRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationType: 'supervisor' | 'coordenador';
  title: string;
}

export function LeadershipRecommendationDialog({ open, onOpenChange, recommendationType, title }: LeadershipRecommendationDialogProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [justification, setJustification] = useState('');
  const { scopeType, scopeId } = useRole();
  const { user } = useAuth();
  const { data: members } = useMembers();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: redes } = useRedes();
  const { links: accessLinks } = useUserAccessLinks();
  const createRecommendation = useCreateLeadershipRecommendation();

  const accessLink = useMemo(() => {
    return (accessLinks || []).find((l) => l.active && l.scope_type === scopeType && l.scope_id === scopeId) || null;
  }, [accessLinks, scopeType, scopeId]);

  const scopedMembers = useMemo(() => {
    if (!members) return [];
    if (scopeType === 'coordenacao' && scopeId) {
      const coord = coordenacoes?.find((c) => c.id === scopeId);
      if (!coord) return [];
      return members.filter((m) => m.campo_id === coord.campo_id && m.rede_id === coord.rede_id);
    }

    if (scopeType === 'rede' && scopeId) {
      const rede = redes?.find((r) => r.id === scopeId);
      if (!rede) return [];
      return members.filter((m) => m.campo_id === rede.campo_id && m.rede_id === rede.id);
    }

    return [];
  }, [members, scopeType, scopeId, coordenacoes, redes]);

  const journeyData = useRecommendationJourneyData(selectedProfileId || null);

  useEffect(() => {
    if (!open) {
      setSelectedProfileId('');
      setJustification('');
    }
  }, [open]);

  const question = recommendationType === 'supervisor'
    ? 'Por que você está indicando esta pessoa para Supervisor?'
    : 'Por que você está indicando esta pessoa para Coordenador?';

  const targetReviewerScopeType = recommendationType === 'supervisor' ? 'rede' : 'pastor_campo';

  const handleSubmit = async () => {
    if (!selectedProfileId || !justification.trim() || !user || !accessLink || !journeyData) return;

    await createRecommendation.mutateAsync({
      campo_id: journeyData.member.campo_id,
      rede_id: journeyData.member.rede_id,
      recommendation_type: recommendationType,
      recommended_profile_id: selectedProfileId,
      recommended_member_id: journeyData.member.id,
      recommended_celula_id: journeyData.member.celula_id,
      recommended_current_role: journeyData.snapshot.funcao_atual,
      requested_by_user_id: user.id,
      requested_by_profile_id: null,
      requested_by_scope_type: scopeType || 'unknown',
      target_reviewer_scope_type: targetReviewerScopeType,
      justification_text: justification.trim(),
      highlights_json: journeyData.snapshot,
      status: 'pending',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Indicar para análise. Essa indicação não altera automaticamente a função da pessoa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pessoa indicada</Label>
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma pessoa do seu escopo" />
              </SelectTrigger>
              <SelectContent>
                {scopedMembers.map((member) => (
                  <SelectItem key={member.profile_id} value={member.profile_id}>
                    {member.profile?.name || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {journeyData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dados de apoio da jornada (somente leitura)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {journeyData.member.profile?.name}</p>
                <p><strong>Célula atual:</strong> {journeyData.celula?.name || '-'}</p>
                <p><strong>Rede / Coordenação:</strong> {journeyData.rede?.name || '-'} / {journeyData.coordenacao?.name || '-'}</p>
                <p><strong>Tempo de igreja:</strong> {journeyData.snapshot.tempo_igreja_meses ?? '-'} meses</p>
                <p><strong>Data de entrada na igreja:</strong> {journeyData.member.profile?.joined_church_at || '-'}</p>
                <p><strong>Função atual:</strong> {journeyData.snapshot.funcao_atual || '-'}</p>
                <p><strong>Status atual:</strong> {journeyData.member.is_active ? 'Ativo' : 'Inativo'}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span><strong>Marcos:</strong></span>
                  {journeyData.snapshot.marcos.length > 0 ? journeyData.snapshot.marcos.map((m) => (
                    <Badge key={m} variant="secondary">{m}</Badge>
                  )) : <span>-</span>}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label>{question}</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Use este espaço para registrar os motivos e referências que sustentam sua percepção"
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!selectedProfileId || !justification.trim() || createRecommendation.isPending}>
            Enviar indicação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
