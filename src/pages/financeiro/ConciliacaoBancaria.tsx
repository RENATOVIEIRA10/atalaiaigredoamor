import { useState, useMemo, useCallback, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDemoScope } from '@/hooks/useDemoScope';
import { useFinContasPagar, useFinContasReceber } from '@/hooks/useFinanceiro';
import {
  useFinConciliacoes,
  useFinConciliacaoDetail,
  useFinConciliacaoMutations,
  matchExtratoItem,
  type FinExtratoItem,
  type MatchCandidate,
} from '@/hooks/useConciliacao';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Clock, ArrowRight,
  Loader2, Trash2, Plus, Eye, RefreshCw, Ban, ChevronLeft, Search,
} from 'lucide-react';
import * as ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { OpenFinancePanel } from '@/components/financeiro/OpenFinancePanel';

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const statusIcons: Record<string, any> = {
  conciliado: <CheckCircle className="h-4 w-4 text-vida" />,
  sugerido: <Clock className="h-4 w-4 text-warning" />,
  pendente: <XCircle className="h-4 w-4 text-destructive" />,
  divergente: <AlertTriangle className="h-4 w-4 text-destructive" />,
  ignorado: <Ban className="h-4 w-4 text-muted-foreground" />,
};

const statusLabels: Record<string, string> = {
  conciliado: 'Conciliado',
  sugerido: 'Sugestão',
  pendente: 'Sem correspondência',
  divergente: 'Divergente',
  ignorado: 'Ignorado',
};

const statusClasses: Record<string, string> = {
  conciliado: 'bg-vida/10 text-vida border-vida/20',
  sugerido: 'bg-warning/10 text-warning border-warning/20',
  pendente: 'bg-destructive/10 text-destructive border-destructive/20',
  divergente: 'bg-destructive/10 text-destructive border-destructive/20',
  ignorado: 'bg-muted/50 text-muted-foreground border-muted/20',
};

// ── OFX Parser ──
function parseOFX(text: string): { items: any[]; saldoInicial: number; saldoFinal: number; banco: string } {
  const items: any[] = [];
  let saldoInicial = 0, saldoFinal = 0, banco = '';

  const bankMatch = text.match(/<ORG>([^<]+)/);
  if (bankMatch) banco = bankMatch[1].trim();

  const balMatch = text.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([^<]+)/);
  if (balMatch) saldoFinal = parseFloat(balMatch[1]);

  const txRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = txRegex.exec(text)) !== null) {
    const block = match[1];
    const typeMatch = block.match(/<TRNTYPE>([^<]+)/);
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
    const amtMatch = block.match(/<TRNAMT>([^<]+)/);
    const memoMatch = block.match(/<MEMO>([^<]+)/) || block.match(/<NAME>([^<]+)/);

    if (amtMatch && dateMatch) {
      const valor = parseFloat(amtMatch[1]);
      const dateStr = dateMatch[1];
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

      items.push({
        data: formattedDate,
        descricao: memoMatch?.[1]?.trim() || 'Sem descrição',
        valor: Math.abs(valor),
        tipo: valor >= 0 ? 'entrada' : 'saida',
      });
    }
  }

  return { items, saldoInicial, saldoFinal, banco };
}

// ── CSV Parser ──
function parseCSVExtrato(text: string): any[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
  const dateIdx = headers.findIndex(h => h.includes('data'));
  const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('historico') || h.includes('memo'));
  const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('montante') || h.includes('amount'));

  const items: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[;,]/).map(c => c.trim());
    const rawVal = cols[valIdx]?.replace(/[R$\s.]/g, '').replace(',', '.');
    const valor = parseFloat(rawVal);
    if (isNaN(valor)) continue;

    let dateStr = cols[dateIdx] || '';
    const dm = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dm) dateStr = `${dm[3]}-${dm[2]}-${dm[1]}`;

    items.push({
      data: dateStr || new Date().toISOString().split('T')[0],
      descricao: cols[descIdx] || 'Sem descrição',
      valor: Math.abs(valor),
      tipo: valor >= 0 ? 'entrada' : 'saida',
    });
  }
  return items;
}

export default function ConciliacaoBancaria() {
  const { campoId } = useDemoScope();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [parsedMeta, setParsedMeta] = useState({ saldoInicial: 0, saldoFinal: 0, banco: '', periodoInicio: '', periodoFim: '' });
  const [ignoreDialog, setIgnoreDialog] = useState<{ itemId: string } | null>(null);
  const [ignoreJustificativa, setIgnoreJustificativa] = useState('');
  const [createLancDialog, setCreateLancDialog] = useState<FinExtratoItem | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const { data: conciliacoes, isLoading: loadingList } = useFinConciliacoes();
  const { data: detail, isLoading: loadingDetail } = useFinConciliacaoDetail(selectedId);
  const { createConciliacao, conciliarItem, updateConciliacaoTotals, deleteConciliacao } = useFinConciliacaoMutations();
  const { data: contasPagar } = useFinContasPagar();
  const { data: contasReceber } = useFinContasReceber();

  // ── File handling ──
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'ofx' || ext === 'qfx') {
        const text = await file.text();
        const result = parseOFX(text);
        setParsedItems(result.items);
        const dates = result.items.map(i => i.data).sort();
        setParsedMeta({
          saldoInicial: result.saldoInicial,
          saldoFinal: result.saldoFinal,
          banco: result.banco,
          periodoInicio: dates[0] || new Date().toISOString().split('T')[0],
          periodoFim: dates[dates.length - 1] || new Date().toISOString().split('T')[0],
        });
        toast.success(`${result.items.length} transações lidas do OFX`);
      } else if (ext === 'csv') {
        const text = await file.text();
        const items = parseCSVExtrato(text);
        setParsedItems(items);
        const dates = items.map(i => i.data).sort();
        setParsedMeta({
          saldoInicial: 0, saldoFinal: 0, banco: '',
          periodoInicio: dates[0] || '', periodoFim: dates[dates.length - 1] || '',
        });
        toast.success(`${items.length} transações lidas do CSV`);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0];
        if (!ws) { toast.error('Planilha vazia'); return; }

        const headers: string[] = [];
        ws.getRow(1).eachCell((cell, col) => { headers[col - 1] = String(cell.value || '').toLowerCase(); });
        const dateIdx = headers.findIndex(h => h.includes('data'));
        const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('historico'));
        const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('montante'));

        const items: any[] = [];
        ws.eachRow((row, num) => {
          if (num === 1) return;
          const rawVal = String(row.getCell(valIdx + 1).value || '0').replace(/[R$\s.]/g, '').replace(',', '.');
          const valor = parseFloat(rawVal);
          if (isNaN(valor)) return;

          let dateStr = '';
          const dc = row.getCell(dateIdx + 1).value;
          if (dc instanceof Date) dateStr = dc.toISOString().split('T')[0];
          else {
            dateStr = String(dc || '');
            const dm = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (dm) dateStr = `${dm[3]}-${dm[2]}-${dm[1]}`;
          }

          items.push({
            data: dateStr || new Date().toISOString().split('T')[0],
            descricao: String(row.getCell(descIdx + 1).value || 'Sem descrição'),
            valor: Math.abs(valor),
            tipo: valor >= 0 ? 'entrada' : 'saida',
          });
        });

        setParsedItems(items);
        const dates = items.map(i => i.data).sort();
        setParsedMeta({ saldoInicial: 0, saldoFinal: 0, banco: '', periodoInicio: dates[0] || '', periodoFim: dates[dates.length - 1] || '' });
        toast.success(`${items.length} transações lidas da planilha`);
      } else {
        toast.error('Formato não suportado. Use .ofx, .csv ou .xlsx');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao ler arquivo: ' + (err.message || ''));
    }
  }, []);

  // ── Import & match ──
  const handleImport = useCallback(async () => {
    if (!campoId || parsedItems.length === 0) return;
    setImporting(true);
    try {
      // Run matching engine
      const itemsWithMatch = parsedItems.map(item => {
        const candidates = matchExtratoItem(item, contasPagar || [], contasReceber || []);
        const best = candidates[0];
        return {
          ...item,
          campo_id: campoId,
          status_conciliacao: best && best.score >= 70 ? 'conciliado' : best && best.score >= 30 ? 'sugerido' : 'pendente',
          conta_pagar_id: best?.type === 'pagar' ? best.id : null,
          conta_receber_id: best?.type === 'receber' ? best.id : null,
          match_score: best?.score || null,
          match_sugerido_label: best ? `${best.descricao} (${formatBRL(best.valor)})` : null,
        };
      });

      await createConciliacao.mutateAsync({
        campo_id: campoId,
        periodo_inicio: parsedMeta.periodoInicio,
        periodo_fim: parsedMeta.periodoFim,
        saldo_inicial: parsedMeta.saldoInicial,
        saldo_final: parsedMeta.saldoFinal,
        banco: parsedMeta.banco || undefined,
        items: itemsWithMatch,
      });

      setParsedItems([]);
      setImportOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fin_contas_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['fin_contas_receber'] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao importar');
    } finally {
      setImporting(false);
    }
  }, [campoId, parsedItems, parsedMeta, contasPagar, contasReceber, createConciliacao, queryClient]);

  // ── Confirm suggestion ──
  const handleConfirm = useCallback(async (item: FinExtratoItem) => {
    await conciliarItem.mutateAsync({
      itemId: item.id,
      contaPagarId: item.conta_pagar_id,
      contaReceberId: item.conta_receber_id,
      status: 'conciliado',
    });
    if (selectedId) updateConciliacaoTotals.mutate(selectedId);
  }, [conciliarItem, updateConciliacaoTotals, selectedId]);

  // ── Ignore ──
  const handleIgnore = useCallback(async () => {
    if (!ignoreDialog) return;
    await conciliarItem.mutateAsync({
      itemId: ignoreDialog.itemId,
      status: 'ignorado',
      justificativa: ignoreJustificativa || undefined,
    });
    if (selectedId) updateConciliacaoTotals.mutate(selectedId);
    setIgnoreDialog(null);
    setIgnoreJustificativa('');
  }, [ignoreDialog, ignoreJustificativa, conciliarItem, updateConciliacaoTotals, selectedId]);

  // ── Create lancamento from extrato ──
  const handleCreateFromExtrato = useCallback(async (item: FinExtratoItem) => {
    if (!campoId) return;
    const { data: { user } } = await supabase.auth.getUser();
    const table = item.tipo === 'saida' ? 'fin_contas_pagar' : 'fin_contas_receber';
    const payload: any = {
      descricao: item.descricao,
      valor: Math.abs(item.valor),
      campo_id: campoId,
      status: item.tipo === 'saida' ? 'pago' : 'recebido',
      created_by: user?.id || null,
      observacoes: 'Criado pela conciliação bancária',
    };
    if (item.tipo === 'saida') {
      payload.data_vencimento = item.data;
      payload.data_pagamento = item.data;
    } else {
      payload.data_prevista = item.data;
      payload.data_recebimento = item.data;
    }

    const { data, error } = await (supabase as any).from(table).insert(payload).select().single();
    if (error) { toast.error(error.message); return; }

    // Link to extrato item
    const linkField = item.tipo === 'saida' ? 'conta_pagar_id' : 'conta_receber_id';
    await conciliarItem.mutateAsync({
      itemId: item.id,
      contaPagarId: item.tipo === 'saida' ? data.id : undefined,
      contaReceberId: item.tipo === 'entrada' ? data.id : undefined,
      status: 'conciliado',
    });

    if (selectedId) updateConciliacaoTotals.mutate(selectedId);
    queryClient.invalidateQueries({ queryKey: ['fin_contas_pagar'] });
    queryClient.invalidateQueries({ queryKey: ['fin_contas_receber'] });
    toast.success('Lançamento criado e conciliado');
    setCreateLancDialog(null);
  }, [campoId, conciliarItem, updateConciliacaoTotals, selectedId, queryClient]);

  // ── Filtered detail items ──
  const filteredItems = useMemo(() => {
    if (!detail?.items) return [];
    if (!searchFilter) return detail.items;
    const s = searchFilter.toLowerCase();
    return detail.items.filter(i => i.descricao.toLowerCase().includes(s));
  }, [detail?.items, searchFilter]);

  // ── Stats for detail view ──
  const detailStats = useMemo(() => {
    if (!detail?.items) return null;
    const items = detail.items;
    const totalEntradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + Math.abs(Number(i.valor)), 0);
    const totalSaidas = items.filter(i => i.tipo === 'saida').reduce((s, i) => s + Math.abs(Number(i.valor)), 0);
    const conciliados = items.filter(i => i.status_conciliacao === 'conciliado').length;
    const pendentes = items.filter(i => i.status_conciliacao === 'pendente').length;
    const sugeridos = items.filter(i => i.status_conciliacao === 'sugerido').length;
    const pct = items.length > 0 ? Math.round((conciliados / items.length) * 100) : 0;
    return { totalEntradas, totalSaidas, conciliados, pendentes, sugeridos, pct };
  }, [detail?.items]);

  // ───────── RENDER ─────────
  return (
    <AppLayout title="Conciliação Bancária">
      {view === 'list' ? (
        <div className="space-y-4">
          {/* Open Finance Panel */}
          {campoId && <OpenFinancePanel campoId={campoId} />}

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Importe extratos bancários e concilie com os lançamentos do sistema.
            </p>
            <Button onClick={() => { setParsedItems([]); setImportOpen(true); }}>
              <Upload className="h-4 w-4 mr-1" /> Importar Extrato
            </Button>
          </div>

          {/* Conciliacoes list */}
          <Card>
            <CardContent className="p-0">
              {loadingList ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : !conciliacoes?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma conciliação realizada</p>
                  <p className="text-xs mt-1">Importe um extrato bancário para começar</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Período</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-center">Itens</TableHead>
                      <TableHead className="text-center">Conciliados</TableHead>
                      <TableHead className="text-center">Pendentes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conciliacoes.map(c => {
                      const pct = c.total_itens > 0 ? Math.round((c.total_conciliados / c.total_itens) * 100) : 0;
                      return (
                        <TableRow key={c.id} className="group cursor-pointer" onClick={() => { setSelectedId(c.id); setView('detail'); }}>
                          <TableCell className="font-medium">
                            {new Date(c.periodo_inicio).toLocaleDateString('pt-BR')} — {new Date(c.periodo_fim).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{c.banco || '—'}</TableCell>
                          <TableCell className="text-center">{c.total_itens}</TableCell>
                          <TableCell className="text-center text-vida">{c.total_conciliados}</TableCell>
                          <TableCell className="text-center text-warning">{c.total_pendentes + c.total_divergentes}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px]', c.status === 'concluida' ? 'bg-vida/10 text-vida border-vida/20' : 'bg-warning/10 text-warning border-warning/20')}>
                              {c.status === 'concluida' ? `${pct}% ✓` : `${pct}% em andamento`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedId(c.id); setView('detail'); }}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteConciliacao.mutate(c.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── DETAIL VIEW ── */
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => { setView('list'); setSelectedId(null); setSearchFilter(''); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>

          {loadingDetail ? (
            <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
          ) : detail && detailStats ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Conciliação</p>
                  <p className="text-2xl font-bold text-vida">{detailStats.pct}%</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="text-lg font-semibold text-vida">{formatBRL(detailStats.totalEntradas)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="text-lg font-semibold text-destructive">{formatBRL(detailStats.totalSaidas)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Conciliados</p>
                  <p className="text-2xl font-bold">{detailStats.conciliados}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-warning">{detailStats.pendentes + detailStats.sugeridos}</p>
                </CardContent></Card>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar transação..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="pl-9" />
              </div>

              {/* Items table */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição (Banco)</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Correspondência</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map(item => (
                          <TableRow key={item.id} className="group">
                            <TableCell className="text-sm">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-sm max-w-[220px] truncate">{item.descricao}</TableCell>
                            <TableCell className={cn('text-right font-semibold tabular-nums', item.tipo === 'entrada' ? 'text-vida' : 'text-destructive')}>
                              {item.tipo === 'entrada' ? '+' : '-'}{formatBRL(Math.abs(Number(item.valor)))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">{item.tipo === 'entrada' ? 'Crédito' : 'Débito'}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {item.match_sugerido_label || '—'}
                              {item.match_score && <span className="ml-1 text-[10px] opacity-60">({item.match_score}%)</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px] gap-1', statusClasses[item.status_conciliacao] || '')}>
                                {statusIcons[item.status_conciliacao]}
                                {statusLabels[item.status_conciliacao] || item.status_conciliacao}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(item.status_conciliacao === 'sugerido') && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleConfirm(item)} title="Confirmar">
                                    <CheckCircle className="h-3.5 w-3.5 text-vida" />
                                  </Button>
                                )}
                                {item.status_conciliacao === 'pendente' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateLancDialog(item)} title="Criar lançamento">
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                  </Button>
                                )}
                                {(item.status_conciliacao !== 'conciliado' && item.status_conciliacao !== 'ignorado') && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIgnoreDialog({ itemId: item.id })} title="Ignorar">
                                    <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* ── Import Dialog ── */}
      <Dialog open={importOpen} onOpenChange={v => { if (!v) { setParsedItems([]); } setImportOpen(v); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Importar Extrato Bancário
            </DialogTitle>
          </DialogHeader>

          {parsedItems.length === 0 ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-10 text-center">
                <FileSpreadsheet className="h-14 w-14 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">Selecione o arquivo do extrato bancário</p>
                <p className="text-xs text-muted-foreground mb-4">Formatos: .ofx, .csv, .xlsx</p>
                <input ref={fileRef} type="file" accept=".ofx,.qfx,.csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                <Button variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Selecionar Arquivo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Período início</label>
                  <Input type="date" value={parsedMeta.periodoInicio} onChange={e => setParsedMeta(p => ({ ...p, periodoInicio: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Período fim</label>
                  <Input type="date" value={parsedMeta.periodoFim} onChange={e => setParsedMeta(p => ({ ...p, periodoFim: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Banco</label>
                  <Input value={parsedMeta.banco} onChange={e => setParsedMeta(p => ({ ...p, banco: e.target.value }))} className="h-8 text-sm" placeholder="Nome do banco" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Saldo final</label>
                  <Input type="number" step="0.01" value={parsedMeta.saldoFinal} onChange={e => setParsedMeta(p => ({ ...p, saldoFinal: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm" />
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <Badge variant="secondary">{parsedItems.length} transações</Badge>{' '}
                <span className="text-vida">{parsedItems.filter(i => i.tipo === 'entrada').length} entradas</span> · <span className="text-destructive">{parsedItems.filter(i => i.tipo === 'saida').length} saídas</span>
              </div>

              <div className="overflow-auto max-h-[40vh] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.slice(0, 50).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{item.descricao}</TableCell>
                        <TableCell className={cn('text-right text-sm font-semibold', item.tipo === 'entrada' ? 'text-vida' : 'text-destructive')}>
                          {formatBRL(item.valor)}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{item.tipo === 'entrada' ? 'Crédito' : 'Débito'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedItems.length > 50 && <p className="text-xs text-muted-foreground p-2 text-center">Mostrando 50 de {parsedItems.length}</p>}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setParsedItems([]); setImportOpen(false); }}>Cancelar</Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Importar e Conciliar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Ignore Dialog ── */}
      <Dialog open={!!ignoreDialog} onOpenChange={v => { if (!v) setIgnoreDialog(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ignorar Transação</DialogTitle></DialogHeader>
          <Textarea placeholder="Justificativa (opcional)..." value={ignoreJustificativa} onChange={e => setIgnoreJustificativa(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIgnoreDialog(null)}>Cancelar</Button>
            <Button onClick={handleIgnore}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Lancamento Dialog ── */}
      <Dialog open={!!createLancDialog} onOpenChange={v => { if (!v) setCreateLancDialog(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Lançamento</DialogTitle></DialogHeader>
          {createLancDialog && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Criar um novo lançamento a partir desta transação:</p>
              <div className="bg-muted/30 p-3 rounded-md space-y-1">
                <p className="text-sm font-medium">{createLancDialog.descricao}</p>
                <p className="text-sm">{formatBRL(Math.abs(Number(createLancDialog.valor)))}</p>
                <p className="text-xs text-muted-foreground">{new Date(createLancDialog.data).toLocaleDateString('pt-BR')} · {createLancDialog.tipo === 'entrada' ? 'Conta a Receber' : 'Conta a Pagar'}</p>
              </div>
              <p className="text-xs text-muted-foreground">O lançamento será criado já como {createLancDialog.tipo === 'entrada' ? 'recebido' : 'pago'} e conciliado automaticamente.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateLancDialog(null)}>Cancelar</Button>
            <Button onClick={() => createLancDialog && handleCreateFromExtrato(createLancDialog)}>
              <Plus className="h-4 w-4 mr-1" /> Criar e Conciliar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
