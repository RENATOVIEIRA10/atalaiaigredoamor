import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateLeadershipRecommendation, useRecommendationJourneyData } from '@/hooks/useLeadershipRecommendations';
import { useRedes } from '@/hooks/useRedes';
import { useUserAccessLinks } from '@/hooks/useUserAccessLinks';
import { useCelulas } from '@/hooks/useCelulas';
import { getCoupleDisplayName } from '@/hooks/useLeadershipCouples';

interface LeadershipRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendationType: 'supervisor' | 'coordenador';
  title: string;
}

export function LeadershipRecommendationDialog({ open, onOpenChange, recommendationType, title }: LeadershipRecommendationDialogProps) {
  const [selectedCoupleId, setSelectedCoupleId] = useState<string>('');
  const [justification, setJustification] = useState('');
  const { scopeType, scopeId } = useRole();
  const { user } = useAuth();
  const { data: redes } = useRedes();
  const { data: celulas } = useCelulas();
  const { links: accessLinks } = useUserAccessLinks();
  const createRecommendation = useCreateLeadershipRecommendation();

  const accessLink = useMemo(() => {
    return (accessLinks || []).find((l) => l.active && l.scope_type === scopeType && l.scope_id === scopeId) || null;
  }, [accessLinks, scopeType, scopeId]);

  const scopedLeaderCells = useMemo(() => {
    const all = (celulas || []).filter((c) => !!c.leadership_couple_id);

    if (scopeType === 'coordenacao' && scopeId) {
      return all.filter((c) => c.coordenacao_id === scopeId);
    }

    if (scopeType === 'rede' && scopeId) {
      const rede = redes?.find((r) => r.id === scopeId);
      if (!rede) return [];
      return all.filter((c) => c.rede_id === scopeId && c.campo_id === rede.campo_id);
    }

    return [];
  }, [celulas, scopeType, scopeId, redes]);

  const selectedCell = useMemo(
    () => scopedLeaderCells.find((c) => c.leadership_couple_id === selectedCoupleId) || null,
    [scopedLeaderCells, selectedCoupleId],
  );

  const journeyData = useRecommendationJourneyData(selectedCoupleId || null);

  useEffect(() => {
    if (!open) {
      setSelectedCoupleId('');
      setJustification('');
    }
  }, [open]);

  const question = recommendationType === 'supervisor'
    ? 'Por que você está indicando este casal para Supervisor?'
    : 'Por que você está indicando este casal para Coordenador?';

  const targetReviewerScopeType = recommendationType === 'supervisor' ? 'rede' : 'pastor_campo';
  const noAutoPromotionText = 'Indicar para análise. Essa indicação não altera automaticamente a função da pessoa.';

  const handleSubmit = async () => {
    if (!selectedCoupleId || !justification.trim() || !user || !accessLink || !journeyData || !selectedCell) return;

    await createRecommendation.mutateAsync({
      campo_id: selectedCell.campo_id,
      rede_id: selectedCell.rede_id,
      recommendation_type: recommendationType,
      // Mantemos um profile/membro de referência para compatibilidade do schema atual
      recommended_profile_id: journeyData.couple.spouse1_id,
      recommended_member_id: journeyData.spouse1Member?.id ?? null,
      recommended_celula_id: selectedCell.id,
      recommended_current_role: 'lider_celula',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {noAutoPromotionText}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Casal de líderes de célula</Label>
            <Select value={selectedCoupleId} onValueChange={setSelectedCoupleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um casal do seu escopo" />
              </SelectTrigger>
              <SelectContent>
                {scopedLeaderCells.map((cell) => (
                  <SelectItem key={cell.leadership_couple_id!} value={cell.leadership_couple_id!}>
                    {getCoupleDisplayName(cell.leadership_couple)} · {cell.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {journeyData && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo da jornada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border p-3 space-y-1">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">Resumo da jornada</p>
                    <p><strong>Nome do casal:</strong> {journeyData.ui.coupleName}</p>
                    <p><strong>Célula:</strong> {journeyData.ui.celula}</p>
                    <p><strong>Coordenação:</strong> {journeyData.ui.coordenacao}</p>
                    <p><strong>Rede:</strong> {journeyData.ui.rede}</p>
                    <p><strong>Campus:</strong> {journeyData.ui.campo}</p>
                    <p><strong>Função atual:</strong> {journeyData.ui.role}</p>
                    <p><strong>Membros na célula:</strong> {journeyData.ui.membersInCelula}</p>
                    <p><strong>Tempo como líder de célula:</strong> {journeyData.ui.leaderTime}</p>
                  </div>

                  <div className="rounded-md border p-3 space-y-1">
                    <p className="font-semibold text-xs text-muted-foreground uppercase">Dados pessoais</p>
                    <p><strong>Tempo de igreja:</strong> {journeyData.ui.tempoIgreja}</p>
                    <p><strong>Entrada na igreja:</strong> {journeyData.ui.entryDate}</p>
                    <p><strong>Aniversário:</strong> {journeyData.ui.birthDate}</p>
                    <p><strong>Serve em ministério:</strong> {journeyData.ui.serveMinistry}</p>
                    <p><strong>Ministérios:</strong> {journeyData.ui.ministries}</p>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="font-semibold text-xs text-muted-foreground uppercase mb-2">Formação espiritual</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {journeyData.ui.marcos.map((m) => (
                      <Badge key={m} variant="secondary">{m}</Badge>
                    ))}
                  </div>
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
          <Button onClick={handleSubmit} disabled={!selectedCoupleId || !justification.trim() || createRecommendation.isPending}>
            Enviar indicação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
