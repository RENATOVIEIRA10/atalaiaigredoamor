import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeadershipRecommendation, readRecommendationSnapshot, useLeadershipRecommendations, useUpdateLeadershipRecommendationStatus } from '@/hooks/useLeadershipRecommendations';

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  reviewed: 'Analisado',
  approved: 'Aprovado',
  declined: 'Recusado',
  archived: 'Arquivado',
};

interface LeadershipRecommendationsSectionProps {
  title?: string;
  description?: string;
}

function renderSnapshotValue(value: unknown, fallback = 'Não informado') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function RecommendationJourneySnapshot({ recommendation }: { recommendation: LeadershipRecommendation }) {
  const snapshot = readRecommendationSnapshot(recommendation.highlights_json);
  const marcos = snapshot.marcos?.length ? snapshot.marcos : ['Não informado'];
  const ministries = snapshot.ministries?.length ? snapshot.ministries.join(', ') : 'Não informado';

  return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold">Resumo da jornada</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border p-3 space-y-1">
          <p className="font-semibold text-xs text-muted-foreground uppercase">Resumo da jornada</p>
          <p><strong>Nome do casal:</strong> {renderSnapshotValue(snapshot.couple_name)}</p>
          <p><strong>Célula:</strong> {renderSnapshotValue(snapshot.celula)}</p>
          <p><strong>Coordenação:</strong> {renderSnapshotValue(snapshot.coordenacao)}</p>
          <p><strong>Rede:</strong> {renderSnapshotValue(snapshot.rede)}</p>
          <p><strong>Campus:</strong> {renderSnapshotValue(snapshot.campo)}</p>
          <p><strong>Função atual:</strong> {renderSnapshotValue(snapshot.current_role)}</p>
          <p><strong>Membros na célula:</strong> {renderSnapshotValue(snapshot.members_in_celula)}</p>
          <p><strong>Tempo como líder de célula:</strong> {renderSnapshotValue(snapshot.leader_time_months)} meses</p>
        </div>

        <div className="rounded-md border p-3 space-y-1">
          <p className="font-semibold text-xs text-muted-foreground uppercase">Dados pessoais</p>
          <p><strong>Tempo de igreja:</strong> {renderSnapshotValue(snapshot.tempo_igreja)}</p>
          <p><strong>Entrada na igreja:</strong> {renderSnapshotValue(snapshot.entry_date)}</p>
          <p><strong>Aniversário:</strong> {renderSnapshotValue(snapshot.birth_date)}</p>
          <p><strong>Serve em ministério:</strong> {snapshot.serve_ministry ? 'Sim' : 'Não'}</p>
          <p><strong>Ministérios:</strong> {ministries}</p>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <p className="font-semibold text-xs text-muted-foreground uppercase mb-2">Formação espiritual</p>
        <div className="flex gap-2 flex-wrap">
          {marcos.map((m) => (
            <Badge key={m} variant="secondary">{m}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LeadershipRecommendationsSection({
  title = 'Indicações recebidas',
  description = 'Registros para discernimento e análise (sem promoção automática).',
}: LeadershipRecommendationsSectionProps) {
  const { data: recommendations, isLoading } = useLeadershipRecommendations();
  const updateStatus = useUpdateLeadershipRecommendationStatus();
  const [selected, setSelected] = useState<LeadershipRecommendation | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');

  const handleStatusUpdate = async (status: 'reviewed' | 'approved' | 'declined' | 'archived') => {
    if (!selected) return;
    await updateStatus.mutateAsync({ id: selected.id, status, reviewerNotes: reviewerNotes.trim() || undefined });
    setSelected(null);
    setReviewerNotes('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando indicações...</p>
        ) : !recommendations?.length ? (
          <p className="text-sm text-muted-foreground">Nenhuma indicação recebida.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicado</TableHead>
                  <TableHead>Quem indicou</TableHead>
                  <TableHead>Função sugerida</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recommendations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{readRecommendationSnapshot(r.highlights_json).couple_name || r.recommended_profile?.name || '—'}</TableCell>
                    <TableCell>{r.requested_by_profile?.name || '—'}</TableCell>
                    <TableCell>{r.recommendation_type === 'supervisor' ? 'Supervisor' : 'Coordenador'}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell><Badge variant="secondary">{statusLabel[r.status] || r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelected(r); setReviewerNotes(r.reviewer_notes || ''); }}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Indicação para análise</DialogTitle>
              <DialogDescription>Essa indicação não altera automaticamente a função da pessoa.</DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-4 text-sm">
                <p><strong>Indicado:</strong> {readRecommendationSnapshot(selected.highlights_json).couple_name || selected.recommended_profile?.name || '-'}</p>
                <p><strong>Função sugerida:</strong> {selected.recommendation_type === 'supervisor' ? 'Supervisor' : 'Coordenador'}</p>
                <p><strong>Justificativa da indicação:</strong></p>
                <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">{selected.justification_text}</div>

                <RecommendationJourneySnapshot recommendation={selected} />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações do revisor</label>
                  <Textarea value={reviewerNotes} onChange={(e) => setReviewerNotes(e.target.value)} rows={4} />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleStatusUpdate('reviewed')} disabled={!selected || updateStatus.isPending}>Marcar como analisado</Button>
              <Button variant="default" onClick={() => handleStatusUpdate('approved')} disabled={!selected || updateStatus.isPending}>Aprovar</Button>
              <Button variant="destructive" onClick={() => handleStatusUpdate('declined')} disabled={!selected || updateStatus.isPending}>Recusar</Button>
              <Button variant="secondary" onClick={() => handleStatusUpdate('archived')} disabled={!selected || updateStatus.isPending}>Arquivar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
