import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, User, AlertCircle, MessageSquare } from 'lucide-react';
import { Supervisao } from '@/hooks/useSupervisoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';

interface SupervisaoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisao: Supervisao;
}

const roteiroLabels: Record<string, string> = {
  oracao_inicial: '1) Oração inicial',
  louvor: '2) Louvor',
  apresentacao_visitantes: '3) Apresentação de visitantes',
  momento_visao_triade: '4) Momento da visão e Tríade',
  avisos: '5) Avisos',
  quebra_gelo: '6) Quebra gelo',
  licao: '7) Lição',
  cadeira_amor: '8) Cadeira do amor',
  oracao_final: '9) Oração final',
  selfie: '10) Selfie',
  comunhao: '11) Comunhão',
};

const avaliacaoLabels: Record<string, string> = {
  pontualidade: '1) Pontualidade',
  dinamica: '2) Dinâmica',
  organizacao: '3) Organização',
  interatividade: '4) Interatividade',
};

const roteiroLabelsWA: Record<string, string> = {
  oracao_inicial: 'Oração inicial',
  louvor: 'Louvor',
  apresentacao_visitantes: 'Apresentação de visitantes',
  momento_visao_triade: 'Momento da visão e Tríade',
  avisos: 'Avisos',
  quebra_gelo: 'Quebra gelo',
  licao: 'Lição',
  cadeira_amor: 'Cadeira do amor',
  oracao_final: 'Oração final',
  selfie: 'Selfie',
  comunhao: 'Comunhão',
};

const avaliacaoLabelsWA: Record<string, string> = {
  pontualidade: 'Pontualidade',
  dinamica: 'Dinâmica',
  organizacao: 'Organização',
  interatividade: 'Interatividade',
};

function buildSupervisaoWhatsApp(supervisao: Supervisao): string {
  const dateStr = format(new Date(supervisao.data_supervisao + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
  const celulaName = supervisao.celula?.name || 'Célula';
  const coordName = supervisao.celula?.coordenacao?.name || '';

  // Nome do supervisor (casal ou individual)
  const sup = supervisao.supervisor;
  let supervisorName = '';
  if (sup?.leadership_couple) {
    const s1 = sup.leadership_couple.spouse1?.name || '';
    const s2 = sup.leadership_couple.spouse2?.name || '';
    supervisorName = s1 && s2 ? `${s1} & ${s2}` : s1 || s2;
  } else {
    supervisorName = sup?.profile?.name || 'Supervisor';
  }

  const lines: string[] = [];
  lines.push(`*Supervisão – ${celulaName}*`);
  lines.push('');
  lines.push(`📅 Data: ${dateStr}`);
  lines.push(`⏱ Horário: ${supervisao.horario_inicio} – ${supervisao.horario_termino}`);
  lines.push(`👥 Supervisor(a): ${supervisorName}`);
  if (coordName) lines.push(`📍 Coordenação: ${coordName}`);
  lines.push('');

  if (!supervisao.celula_realizada) {
    lines.push(`❌ *Célula não realizada*`);
    if (supervisao.motivo_cancelamento) {
      lines.push(`Motivo: ${supervisao.motivo_cancelamento}`);
    }
  } else {
    // Roteiro da Célula
    const roteiroEntries = Object.entries(roteiroLabelsWA);
    const roteiroOk = roteiroEntries.filter(([k]) => supervisao[k as keyof Supervisao] === true).map(([, v]) => v);
    const roteiroNok = roteiroEntries.filter(([k]) => !supervisao[k as keyof Supervisao]).map(([, v]) => v);
    const roteiroTotal = roteiroEntries.length;
    const roteiroScore = roteiroOk.length;

    lines.push(`📋 *Roteiro da Célula (${roteiroScore}/${roteiroTotal})*`);
    if (roteiroOk.length > 0) {
      lines.push(`✅ Realizados: ${roteiroOk.join(', ')}`);
    }
    if (roteiroNok.length > 0) {
      lines.push(`❌ Não realizados: ${roteiroNok.join(', ')}`);
    }
    lines.push('');

    // Avaliação Geral
    const avaliacaoEntries = Object.entries(avaliacaoLabelsWA);
    const avaliacaoOk = avaliacaoEntries.filter(([k]) => supervisao[k as keyof Supervisao] === true).map(([, v]) => v);
    const avaliacaoNok = avaliacaoEntries.filter(([k]) => !supervisao[k as keyof Supervisao]).map(([, v]) => v);
    const avaliacaoTotal = avaliacaoEntries.length;
    const avaliacaoScore = avaliacaoOk.length;

    lines.push(`📊 *Avaliação Geral (${avaliacaoScore}/${avaliacaoTotal})*`);
    if (avaliacaoOk.length > 0) {
      lines.push(`✅ OK: ${avaliacaoOk.join(', ')}`);
    }
    if (avaliacaoNok.length > 0) {
      lines.push(`⚠️ A melhorar: ${avaliacaoNok.join(', ')}`);
    }
    lines.push('');

    // Pontos positivos
    if (supervisao.pontos_positivos) {
      lines.push(`✅ *Pontos positivos:*`);
      lines.push(supervisao.pontos_positivos);
      lines.push('');
    }

    // Pontos a alinhar
    if (supervisao.pontos_alinhar) {
      lines.push(`🔄 *Pontos a alinhar:*`);
      lines.push(supervisao.pontos_alinhar);
      lines.push('');
    }
  }

  lines.push('_— Rede Amor a 2_');
  return lines.join('\n');
}

function openWhatsAppSupervisao(supervisao: Supervisao) {
  const text = buildSupervisaoWhatsApp(supervisao);
  const encoded = encodeURIComponent(text);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile
    ? `whatsapp://send?text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function SupervisaoDetailsDialog({ open, onOpenChange, supervisao }: SupervisaoDetailsDialogProps) {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const isFullScreen = isPWA && isMobile;

  const roteiroItems = Object.entries(roteiroLabels).map(([key, label]) => ({
    key,
    label,
    value: supervisao[key as keyof Supervisao] as boolean,
  }));

  const avaliacaoItems = Object.entries(avaliacaoLabels).map(([key, label]) => ({
    key,
    label,
    value: supervisao[key as keyof Supervisao] as boolean,
  }));

  const roteiroScore = roteiroItems.filter(item => item.value).length;
  const avaliacaoScore = avaliacaoItems.filter(item => item.value).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isFullScreen
        ? 'max-w-full h-[100dvh] max-h-[100dvh] rounded-none flex flex-col p-0'
        : 'max-w-2xl flex flex-col'
      } style={isFullScreen ? undefined : { maxHeight: '90vh' }}>
        <DialogHeader className={`flex-shrink-0 ${isFullScreen ? 'px-4 pt-4 pb-2' : ''}`}>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              Supervisão - {supervisao.celula?.name}
              {supervisao.celula_realizada ? (
                <Badge variant="default">Realizada</Badge>
              ) : (
                <Badge variant="destructive">Não Realizada</Badge>
              )}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950 flex-shrink-0"
              onClick={() => openWhatsAppSupervisao(supervisao)}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Enviar no WhatsApp
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className={`flex-1 overflow-y-auto ${isFullScreen ? 'px-4' : 'pr-4'}`} style={isFullScreen ? undefined : { maxHeight: 'calc(90vh - 80px)' }}>
          <div className="space-y-6">
            {/* Header Info */}
            <Card>
              <CardContent className="py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(supervisao.data_supervisao + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {supervisao.horario_inicio} - {supervisao.horario_termino}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{supervisao.celula?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Supervisor: {supervisao.supervisor?.profile?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!supervisao.celula_realizada && (
              <Card className="border-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Célula Não Realizada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {supervisao.motivo_cancelamento || 'Motivo não informado'}
                  </p>
                </CardContent>
              </Card>
            )}

            {supervisao.celula_realizada && (
              <>
                {/* Roteiro */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Roteiro da Célula</CardTitle>
                      <Badge variant="outline">
                        {roteiroScore}/{roteiroItems.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2">
                      {roteiroItems.map(item => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-lg">{item.value ? '✅' : '❌'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Avaliação */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Avaliação Geral</CardTitle>
                      <Badge variant="outline">
                        {avaliacaoScore}/{avaliacaoItems.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-2">
                      {avaliacaoItems.map(item => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <span className="text-sm">{item.label}</span>
                          <span className="text-lg">{item.value ? '✅' : '❌'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Observations */}
                {(supervisao.pontos_alinhar || supervisao.pontos_positivos) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Observações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {supervisao.pontos_alinhar && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Pontos a Alinhar:</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {supervisao.pontos_alinhar}
                          </p>
                        </div>
                      )}
                      
                      {supervisao.pontos_alinhar && supervisao.pontos_positivos && <Separator />}
                      
                      {supervisao.pontos_positivos && (
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Pontos Positivos:</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {supervisao.pontos_positivos}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
