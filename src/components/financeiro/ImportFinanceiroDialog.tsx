import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Camera, ClipboardPaste, Upload, Loader2, Trash2, CheckCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as ExcelJS from 'exceljs';

interface ImportItem {
  _selected: boolean;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  data_prevista?: string;
  categoria_sugerida?: string;
  fornecedor_sugerido?: string;
  origem_sugerida?: string;
  recorrencia_sugerida?: string | null;
  observacoes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: 'pagar' | 'receber';
  campoId: string;
  onImported: () => void;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

/**
 * Smart currency parser that handles both Brazilian (1.234,56) and international (1,234.56) formats.
 * Also handles raw numbers returned by Excel libraries.
 */
function parseCurrencyValue(raw: unknown): number {
  // If already a number, return directly
  if (typeof raw === 'number') return raw;
  
  let str = String(raw || '0').trim();
  
  // Remove currency symbols, spaces
  str = str.replace(/[R$\s]/g, '');
  
  // Remove leading/trailing non-numeric chars except digits, dots, commas, minus
  str = str.replace(/^[^0-9,.\-]+|[^0-9,.]+$/g, '');
  
  if (!str) return 0;
  
  // Detect format by analyzing dots and commas
  const dots = (str.match(/\./g) || []).length;
  const commas = (str.match(/,/g) || []).length;
  const lastDot = str.lastIndexOf('.');
  const lastComma = str.lastIndexOf(',');
  
  if (commas === 1 && dots === 0) {
    // "296,00" or "1296,45" → Brazilian decimal
    str = str.replace(',', '.');
  } else if (commas === 0 && dots === 1) {
    // "296.00" or "1296.45" → international decimal (keep as is)
  } else if (commas === 1 && dots >= 1 && lastComma > lastDot) {
    // "1.296,45" → Brazilian: dots are thousands, comma is decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (dots === 1 && commas >= 1 && lastDot > lastComma) {
    // "1,296.45" → International: commas are thousands, dot is decimal
    str = str.replace(/,/g, '');
  } else if (commas > 1 && dots === 0) {
    // "1,234,567" → commas as thousands, no decimal
    str = str.replace(/,/g, '');
  } else if (dots > 1 && commas === 0) {
    // "1.234.567" → dots as thousands, no decimal
    str = str.replace(/\./g, '');
  } else if (commas === 0 && dots === 0) {
    // Plain integer "29600"
  } else {
    // Ambiguous — try Brazilian convention (comma = decimal)
    str = str.replace(/\./g, '').replace(',', '.');
  }
  
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

export function ImportFinanceiroDialog({ open, onOpenChange, tipo, campoId, onImported }: Props) {
  const [tab, setTab] = useState('planilha');
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const dateField = tipo === 'pagar' ? 'data_vencimento' : 'data_prevista';
  const label = tipo === 'pagar' ? 'Contas a Pagar' : 'Contas a Receber';
  const tableName = tipo === 'pagar' ? 'fin_contas_pagar' : 'fin_contas_receber';

  const reset = () => {
    setItems([]);
    setPasteText('');
    setLoading(false);
    setImporting(false);
  };

  // ── Spreadsheet parsing (client-side) ──
  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { toast.error('Arquivo vazio'); return; }

        const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
        const parsed: ImportItem[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/[;,]/).map(c => c.trim());
          const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('titulo') || h.includes('nome'));
          const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('total') || h.includes('montante'));
          const dateIdx = headers.findIndex(h => h.includes('vencimento') || h.includes('data') || h.includes('previst'));

          if (descIdx === -1 || valIdx === -1) continue;

          const rawVal = cols[valIdx];
          const valor = parseCurrencyValue(rawVal);
          if (isNaN(valor) || valor <= 0) continue;

          let dateStr = cols[dateIdx] || new Date().toISOString().split('T')[0];
          // Try to convert DD/MM/YYYY to YYYY-MM-DD
          const dmMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (dmMatch) dateStr = `${dmMatch[3]}-${dmMatch[2]}-${dmMatch[1]}`;

          parsed.push({
            _selected: true,
            descricao: cols[descIdx] || 'Sem descrição',
            valor,
            [dateField]: dateStr,
            categoria_sugerida: 'Outros',
          });
        }

        setItems(parsed);
        if (parsed.length === 0) toast.warning('Nenhum lançamento encontrado no arquivo');
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0];
        if (!ws) { toast.error('Planilha vazia'); return; }

        const headers: string[] = [];
        ws.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(cell.value || '').toLowerCase();
        });

        const descIdx = headers.findIndex(h => h.includes('descri') || h.includes('titulo') || h.includes('nome'));
        const valIdx = headers.findIndex(h => h.includes('valor') || h.includes('total') || h.includes('montante'));
        const dateIdx = headers.findIndex(h => h.includes('vencimento') || h.includes('data') || h.includes('previst'));

        if (descIdx === -1 || valIdx === -1) {
          toast.error('Colunas obrigatórias não encontradas: Descrição e Valor');
          return;
        }

        const parsed: ImportItem[] = [];
        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const rawVal = String(row.getCell(valIdx + 1).value || '0').replace(/[R$\s.]/g, '').replace(',', '.');
          const valor = parseFloat(rawVal);
          if (isNaN(valor) || valor <= 0) return;

          let dateStr = '';
          const dateCell = row.getCell(dateIdx + 1).value;
          if (dateCell instanceof Date) {
            dateStr = dateCell.toISOString().split('T')[0];
          } else {
            dateStr = String(dateCell || '');
            const dmMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (dmMatch) dateStr = `${dmMatch[3]}-${dmMatch[2]}-${dmMatch[1]}`;
          }
          if (!dateStr) dateStr = new Date().toISOString().split('T')[0];

          parsed.push({
            _selected: true,
            descricao: String(row.getCell(descIdx + 1).value || 'Sem descrição'),
            valor,
            [dateField]: dateStr,
            categoria_sugerida: 'Outros',
          });
        });

        setItems(parsed);
        if (parsed.length === 0) toast.warning('Nenhum lançamento encontrado na planilha');
      } else {
        toast.error('Formato não suportado. Use .csv ou .xlsx');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao ler arquivo: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [dateField]);

  // ── AI parsing (text or image) ──
  const parseWithAI = useCallback(async (mode: 'text' | 'image', content: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-financial', {
        body: { mode, content, tipo },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const parsed: ImportItem[] = (data?.items || []).map((it: any) => ({
        ...it,
        _selected: true,
        valor: Number(it.valor) || 0,
      }));

      setItems(parsed);
      if (parsed.length === 0) toast.warning('A IA não encontrou lançamentos no conteúdo');
      else toast.success(`${parsed.length} lançamento(s) detectado(s)`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao processar com IA');
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  const handleImageUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      parseWithAI('image', base64);
    };
    reader.readAsDataURL(file);
  }, [parseWithAI]);

  // ── Batch import ──
  const handleImport = useCallback(async () => {
    const selected = items.filter(i => i._selected && i.valor > 0);
    if (selected.length === 0) { toast.warning('Selecione ao menos um lançamento'); return; }
    if (!campoId) { toast.error('Campus não identificado. Selecione um campus antes de importar.'); return; }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const rows = selected.map(item => {
        const base: any = {
          descricao: item.descricao,
          valor: item.valor,
          campo_id: campoId,
          status: 'pendente',
          created_by: user?.id || null,
          observacoes: [
            item.observacoes,
            item.categoria_sugerida ? `Categoria sugerida: ${item.categoria_sugerida}` : null,
          ].filter(Boolean).join(' | ') || null,
        };

        if (tipo === 'pagar') {
          base.data_vencimento = item.data_vencimento || new Date().toISOString().split('T')[0];
        } else {
          base.data_prevista = item.data_prevista || new Date().toISOString().split('T')[0];
          base.origem = item.origem_sugerida || null;
        }

        if (item.recorrencia_sugerida) {
          base.recorrencia = item.recorrencia_sugerida;
        }

        return base;
      });

      const { error } = await (supabase as any).from(tableName).insert(rows);
      if (error) throw error;

      // Log audit for batch
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle();
        await (supabase as any).from('fin_audit_log').insert({
          tabela: tableName,
          registro_id: 'batch',
          acao: 'importou_lote',
          campo_id: campoId,
          user_id: user.id,
          user_name: profile?.name || user.email,
          detalhes: { quantidade: rows.length },
        });
      }

      toast.success(`${rows.length} lançamento(s) importado(s) com sucesso!`);
      onImported();
      reset();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao importar: ' + (err.message || ''));
    } finally {
      setImporting(false);
    }
  }, [items, campoId, tipo, tableName, onImported, onOpenChange]);

  const toggleAll = () => {
    const allSelected = items.every(i => i._selected);
    setItems(items.map(i => ({ ...i, _selected: !allSelected })));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const selectedCount = items.filter(i => i._selected).length;
  const selectedTotal = items.filter(i => i._selected).reduce((s, i) => s + i.valor, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar {label}
          </DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="planilha" className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> Planilha
              </TabsTrigger>
              <TabsTrigger value="imagem" className="gap-1.5">
                <Camera className="h-4 w-4" /> Imagem / PDF
              </TabsTrigger>
              <TabsTrigger value="texto" className="gap-1.5">
                <ClipboardPaste className="h-4 w-4" /> Colar Texto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="planilha" className="space-y-4 pt-4">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mb-1">
                  Arraste uma planilha ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Formatos aceitos: .xlsx, .csv
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Colunas esperadas: <strong>Descrição</strong>, <strong>Valor</strong>, <strong>Data</strong>
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Selecionar Arquivo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="imagem" className="space-y-4 pt-4">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground mb-1">
                  Envie foto de boleto, nota fiscal, extrato ou comprovante
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  A IA vai extrair os dados automaticamente
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="img-upload"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById('img-upload')?.click()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
                  Enviar Imagem
                </Button>
              </div>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analisando com IA...
                </div>
              )}
            </TabsContent>

            <TabsContent value="texto" className="space-y-4 pt-4">
              <Textarea
                placeholder={`Cole aqui uma lista de ${tipo === 'pagar' ? 'contas a pagar' : 'recebíveis'}...\n\nExemplo:\nAluguel sede - R$ 3.500,00 - vencimento 10/03/2026\nConta de luz - R$ 850,00 - vencimento 15/03/2026`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={8}
              />
              <Button
                onClick={() => parseWithAI('text', pasteText)}
                disabled={loading || !pasteText.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ClipboardPaste className="h-4 w-4 mr-2" />}
                Analisar com IA
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Review table */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{items.length} encontrado(s)</Badge>
                <Badge variant="outline">{selectedCount} selecionado(s)</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setItems([])}>
                Voltar
              </Button>
            </div>

            <div className="overflow-x-auto rounded-md border max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox checked={selectedCount === items.length} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Categoria</TableHead>
                    {tipo === 'pagar' && <TableHead>Fornecedor</TableHead>}
                    {tipo === 'receber' && <TableHead>Origem</TableHead>}
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className={!item._selected ? 'opacity-40' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={item._selected}
                          onCheckedChange={() => {
                            const next = [...items];
                            next[idx] = { ...next[idx], _selected: !next[idx]._selected };
                            setItems(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.descricao}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], descricao: e.target.value };
                            setItems(next);
                          }}
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], valor: parseFloat(e.target.value) || 0 };
                            setItems(next);
                          }}
                          className="h-8 text-sm w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item[dateField as keyof ImportItem] as string || ''}
                          onChange={(e) => {
                            const next = [...items];
                            next[idx] = { ...next[idx], [dateField]: e.target.value };
                            setItems(next);
                          }}
                          className="h-8 text-sm w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{item.categoria_sugerida || '—'}</span>
                      </TableCell>
                      {tipo === 'pagar' && (
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.fornecedor_sugerido || '—'}</span>
                        </TableCell>
                      )}
                      {tipo === 'receber' && (
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{item.origem_sugerida || '—'}</span>
                        </TableCell>
                      )}
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary footer */}
            <div className="flex items-center justify-between bg-muted/20 rounded-md px-4 py-3 border">
              <span className="text-sm text-muted-foreground">
                {selectedCount} lançamento(s) selecionado(s)
              </span>
              <span className="text-sm font-semibold">
                Total: {formatBRL(selectedTotal)}
              </span>
            </div>

            {items.some(i => i.recorrencia_sugerida) && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
                <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Lançamentos com recorrência detectada serão importados como parcela única. 
                  Você pode configurar a recorrência depois editando cada lançamento.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
                {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                Importar {selectedCount} Lançamento(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
