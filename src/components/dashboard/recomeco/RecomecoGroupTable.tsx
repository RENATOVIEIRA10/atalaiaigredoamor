import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, MapPin, CalendarDays, Clock } from 'lucide-react';
import { RecomecoByGroup, RecomecoEncRow } from '@/hooks/useRecomecoFunnel';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  contatado: { label: 'Contatado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  integrado: { label: 'Integrado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  sem_resposta: { label: 'Sem resposta', color: 'bg-muted text-muted-foreground border-border' },
};

interface RecomecoGroupTableProps {
  groups: RecomecoByGroup[];
  groupLabel: string; // "Célula" | "Coordenação" | "Rede"
  title: string;
  description?: string;
}

export function RecomecoGroupTable({ groups, groupLabel, title, description }: RecomecoGroupTableProps) {
  const [drillDown, setDrillDown] = useState<RecomecoByGroup | null>(null);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum encaminhamento encontrado</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{groupLabel}</TableHead>
                    <TableHead className="text-center">Encam.</TableHead>
                    <TableHead className="text-center">Pend.</TableHead>
                    <TableHead className="text-center">Contat.</TableHead>
                    <TableHead className="text-center">Integ.</TableHead>
                    <TableHead className="text-center">Membro</TableHead>
                    <TableHead className="text-center">S/ Resp.</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(g => (
                    <TableRow key={g.groupId} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{g.groupName}</TableCell>
                      <TableCell className="text-center">{g.kpis.encaminhadas}</TableCell>
                      <TableCell className="text-center">
                        <span className={g.kpis.pendentes > 0 ? 'text-amber-600 font-medium' : ''}>{g.kpis.pendentes}</span>
                      </TableCell>
                      <TableCell className="text-center">{g.kpis.contatadas}</TableCell>
                      <TableCell className="text-center">{g.kpis.integradas}</TableCell>
                      <TableCell className="text-center">{g.kpis.promovidas}</TableCell>
                      <TableCell className="text-center">{g.kpis.sem_resposta}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDrillDown(g)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drill-down dialog */}
      <Dialog open={!!drillDown} onOpenChange={o => { if (!o) setDrillDown(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{drillDown?.groupName} — Novas Vidas</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 pr-2">
              {drillDown?.encaminhamentos.map(enc => {
                const nv = enc.nova_vida;
                const statusCfg = STATUS_LABELS[enc.status] || STATUS_LABELS.pendente;
                const daysSince = differenceInDays(new Date(), new Date(enc.data_encaminhamento));
                return (
                  <div key={enc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nv?.nome || 'Sem nome'}</p>
                      {(nv?.bairro || nv?.cidade) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {[nv?.bairro, nv?.cidade].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(enc.data_encaminhamento), "dd/MM/yyyy", { locale: ptBR })}
                        {daysSince > 0 && <span>({daysSince}d)</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs shrink-0', statusCfg.color)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                );
              })}
              {(!drillDown?.encaminhamentos || drillDown.encaminhamentos.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum encaminhamento</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
