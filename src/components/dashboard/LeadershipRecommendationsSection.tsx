import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLeadershipRecommendations, useUpdateLeadershipRecommendationStatus, LeadershipRecommendation } from '@/hooks/useLeadershipRecommendations';

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
                    <TableCell className="font-medium">{r.recommended_profile?.name || '—'}</TableCell>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Indicação para análise</DialogTitle>
              <DialogDescription>Essa indicação não altera automaticamente a função da pessoa.</DialogDescription>
            </DialogHeader>

            {selected && (
              <div className="space-y-4 text-sm">
                <p><strong>Indicado:</strong> {selected.recommended_profile?.name || '-'}</p>
                <p><strong>Função sugerida:</strong> {selected.recommendation_type === 'supervisor' ? 'Supervisor' : 'Coordenador'}</p>
                <p><strong>Justificativa da indicação:</strong></p>
                <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap">{selected.justification_text}</div>

                <div className="rounded-md border p-3 space-y-1">
                  <p><strong>Dados da jornada:</strong></p>
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(selected.highlights_json, null, 2)}</pre>
                </div>

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
