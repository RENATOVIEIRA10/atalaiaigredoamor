import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Mail, CalendarIcon, FileSpreadsheet, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useRedeEmailReport } from '@/hooks/useRedeEmailReport';
import { exportRedeReportExcel } from '@/utils/exportRedeReport';
import { useToast } from '@/hooks/use-toast';

type EmailModel = 'completo' | 'rapido';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  redeId: string;
  redeName: string;
  redeLeaderName: string;
}

function buildEmailCompleto(d: ReturnType<typeof useRedeEmailReport>['data']): string {
  if (!d) return '';
  const alertasBullets = [
    d.celulasRisco3.length > 0 ? `• ${d.celulasRisco3.length} célula(s) sem envio há 3+ semanas — ação urgente necessária` : null,
    d.celulasRisco2.length > 0 ? `• ${d.celulasRisco2.length} célula(s) sem envio há 2 semanas` : null,
    d.celulasRisco1.length > 0 ? `• ${d.celulasRisco1.length} célula(s) sem envio esta semana` : null,
    d.aniversariantesCount > 0 ? `• ${d.aniversariantesCount} membro(s) fazem aniversário esta semana — orar e ligar` : null,
  ].filter(Boolean).join('\n') || '• Nenhum alerta pastoral neste período';

  return `Paz do Senhor!

Segue abaixo o relatório consolidado da ${d.redeName} referente ao período de ${d.periodoInicio} a ${d.periodoFim}.

━━━━━━━━━━━━━━━━━━━━
📊 RESUMO DO PERÍODO
━━━━━━━━━━━━━━━━━━━━

🏠 Células ativas: ${d.totalCelulasAtivas}
📋 Relatórios enviados: ${d.relatoriosEnviados} de ${d.totalCelulasAtivas} (${d.percEnvio}%)
👥 Pessoas nas células (cadastro): ${d.pessoasNasCelulas}
🤝 Discipulados ativos: ${d.discipuladosTotal}
📖 Líderes em treinamento: ${d.lideresEmTreinamentoTotal}
👶 Crianças (no período): ${d.criancasTotal}
🙋 Visitantes (no período): ${d.visitantesTotal}
✂️ Multiplicações: ${d.multiplicacoesTotal}
🎂 Aniversariantes da semana: ${d.aniversariantesCount}

━━━━━━━━━━━━━━━━━━━━
⚠️ ALERTAS PASTORAIS
━━━━━━━━━━━━━━━━━━━━

${alertasBullets}

━━━━━━━━━━━━━━━━━━━━
✅ PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━

• Acompanhar células com relatórios pendentes de forma personalizada
• Orar pelos aniversariantes da semana
• Registrar as multiplicações no sistema

A planilha completa está em anexo com dados detalhados por coordenação, supervisão e célula.

Em Cristo,
${d.redeLeader}
Liderança da ${d.redeName}

Relatório gerado em: ${d.geradoEm}`;
}

function buildEmailRapido(d: ReturnType<typeof useRedeEmailReport>['data']): string {
  if (!d) return '';
  return `Paz do Senhor!

Relatório rápido da ${d.redeName} — ${d.periodoInicio} a ${d.periodoFim}:

✅ ${d.relatoriosEnviados}/${d.totalCelulasAtivas} células enviaram (${d.percEnvio}%)
👥 ${d.pessoasNasCelulas} pessoas cadastradas nas células
⚠️ ${d.celulasRisco1.length + d.celulasRisco2.length + d.celulasRisco3.length} células sem envio
🤝 ${d.discipuladosTotal} discipulados | 📖 ${d.lideresEmTreinamentoTotal} líderes em formação

Detalhes na planilha em anexo.

${d.redeLeader} — Liderança da ${d.redeName}`;
}

export function RedeEmailReportDialog({ open, onOpenChange, redeId, redeName, redeLeaderName }: Props) {
  const { toast } = useToast();
  const [emailModel, setEmailModel] = useState<EmailModel>('completo');
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(today, 6),
    to: today,
  });
  const [calOpen, setCalOpen] = useState(false);

  const dateFrom = format(dateRange.from, 'yyyy-MM-dd');
  const dateTo = format(dateRange.to, 'yyyy-MM-dd');

  const { data, isLoading } = useRedeEmailReport({ redeId, dateFrom, dateTo, redeName, redeLeaderName });

  const emailBody = data
    ? (emailModel === 'completo' ? buildEmailCompleto(data) : buildEmailRapido(data))
    : '';

  const subject = data
    ? `Relatório ${redeName} — ${data.periodoInicio} a ${data.periodoFim}`
    : `Relatório ${redeName}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Texto copiado!', description: 'Cole no seu e-mail.' });
  };

  const handleOpenEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleExportExcel = async () => {
    if (!data) return;
    await exportRedeReportExcel(data);
    toast({ title: 'Planilha exportada!', description: 'Arquivo gerado com 8 abas completas.' });
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ from: range.from, to: range.to });
      setCalOpen(false);
    } else if (range?.from) {
      setDateRange(prev => ({ ...prev, from: range.from! }));
    }
  };

  const formatPeriod = () =>
    `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} – ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Relatório da Rede
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Período */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período do relatório</Label>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {formatPeriod()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={handleCalendarSelect}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={ptBR}
                  numberOfMonths={2}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Modelo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Modelo de e-mail</Label>
            <RadioGroup value={emailModel} onValueChange={(v) => setEmailModel(v as EmailModel)} className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                <RadioGroupItem value="completo" id="completo" className="mt-0.5" />
                <Label htmlFor="completo" className="cursor-pointer space-y-0.5">
                  <p className="font-medium text-sm">Resumo pastoral (completo)</p>
                  <p className="text-xs text-muted-foreground">Saudação, KPIs detalhados, alertas, próximos passos e assinatura institucional.</p>
                </Label>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                <RadioGroupItem value="rapido" id="rapido" className="mt-0.5" />
                <Label htmlFor="rapido" className="cursor-pointer space-y-0.5">
                  <p className="font-medium text-sm">Resumo rápido</p>
                  <p className="text-xs text-muted-foreground">Versão compacta com os principais números. Ideal para mensagens ágeis.</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* KPI Summary */}
          {data && !isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Células', value: data.totalCelulasAtivas },
                { label: 'Enviaram', value: `${data.relatoriosEnviados} (${data.percEnvio}%)` },
                { label: 'Pessoas', value: data.pessoasNasCelulas },
                { label: 'Pendentes', value: data.celulasRisco1.length + data.celulasRisco2.length + data.celulasRisco3.length },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-lg font-bold text-primary">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview do e-mail</Label>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="rounded-lg border bg-muted/30 p-1">
              <div className="px-3 py-2 border-b bg-muted/40 rounded-t-md">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Assunto: </span>{subject}
                </p>
              </div>
              <Textarea
                value={emailBody}
                readOnly
                className="min-h-[260px] border-0 bg-transparent resize-none text-xs font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={!data || isLoading} className="gap-2 w-full sm:w-auto">
            <FileSpreadsheet className="h-4 w-4" />
            Baixar Planilha (8 abas)
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={!emailBody} className="gap-2 w-full sm:w-auto">
            {copied ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar texto'}
          </Button>
          <Button onClick={handleOpenEmail} disabled={!emailBody} className="gap-2 w-full sm:w-auto">
            <ExternalLink className="h-4 w-4" />
            Abrir e-mail para envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
