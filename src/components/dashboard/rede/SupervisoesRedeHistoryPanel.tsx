/**
 * SupervisoesRedeHistoryPanel.tsx
 * 
 * Supervision history panel for Network Leader with filters.
 * Shows all supervisions across the rede with coordinator/supervisor/cell/date filters.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardCheck, Calendar, Eye, AlertCircle, Filter, X } from 'lucide-react';
import { useSupervisoesByRede, type Supervisao } from '@/hooks/useSupervisoes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { SupervisaoDetailsDialog } from '../supervisor/SupervisaoDetailsDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  redeId: string;
}

export function SupervisoesRedeHistoryPanel({ redeId }: Props) {
  const { data: supervisoes, isLoading } = useSupervisoesByRede(redeId);
  const { data: coordenacoes } = useCoordenacoes();
  
  const [filterCoord, setFilterCoord] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [selectedSupervisao, setSelectedSupervisao] = useState<Supervisao | null>(null);

  const redeCoordenacoes = useMemo(() => {
    if (!coordenacoes) return [];
    // Get unique coord IDs from supervisoes
    const coordIds = new Set((supervisoes || []).map(s => s.celula?.coordenacao_id).filter(Boolean));
    return coordenacoes.filter(c => coordIds.has(c.id));
  }, [coordenacoes, supervisoes]);

  const filteredSupervisoes = useMemo(() => {
    if (!supervisoes) return [];
    
    return supervisoes.filter(s => {
      // Coordination filter
      if (filterCoord !== 'all' && s.celula?.coordenacao_id !== filterCoord) return false;
      
      // Status filter
      if (filterStatus === 'realizada' && !s.celula_realizada) return false;
      if (filterStatus === 'nao_realizada' && s.celula_realizada) return false;
      
      // Date from
      if (filterDateFrom && s.data_supervisao < filterDateFrom) return false;
      
      // Date to
      if (filterDateTo && s.data_supervisao > filterDateTo) return false;
      
      return true;
    });
  }, [supervisoes, filterCoord, filterStatus, filterDateFrom, filterDateTo]);

  const hasFilters = filterCoord !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setFilterCoord('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const realizadas = filteredSupervisoes.filter(s => s.celula_realizada).length;
  const naoRealizadas = filteredSupervisoes.length - realizadas;

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Coordenação</label>
                <Select value={filterCoord} onValueChange={setFilterCoord}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {redeCoordenacoes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="realizada">Realizadas</SelectItem>
                    <SelectItem value="nao_realizada">Não realizadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">De</label>
                <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-sm" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Até</label>
                <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-sm" />
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{filteredSupervisoes.length} resultado(s)</p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="h-3.5 w-3.5" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{filteredSupervisoes.length}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-green-600">{realizadas}</p>
              <p className="text-[10px] text-muted-foreground">Realizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-destructive">{naoRealizadas}</p>
              <p className="text-[10px] text-muted-foreground">Não realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {filteredSupervisoes.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description="Nenhuma supervisão encontrada com os filtros selecionados." />
        ) : (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Histórico de Supervisões
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredSupervisoes.length} supervisão(ões) · {realizadas} realizadas · {naoRealizadas} não realizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {filteredSupervisoes.map(supervisao => (
                <Card 
                  key={supervisao.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedSupervisao(supervisao)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(supervisao.data_supervisao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">{supervisao.celula?.name}</h4>
                            {!supervisao.celula_realizada && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {supervisao.celula?.coordenacao?.name && <span>{supervisao.celula.coordenacao.name} · </span>}
                            Supervisor: {supervisao.supervisor?.profile?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {supervisao.celula_realizada ? (
                          <Badge variant="default">Realizada</Badge>
                        ) : (
                          <Badge variant="destructive">Não Realizada</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedSupervisao && (
        <SupervisaoDetailsDialog
          open={!!selectedSupervisao}
          onOpenChange={(open) => !open && setSelectedSupervisao(null)}
          supervisao={selectedSupervisao}
        />
      )}
    </>
  );
}
