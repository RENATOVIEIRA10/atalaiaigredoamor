import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const TIPOS_CELULA = ['Mista', 'Casais', 'Solteiros', 'Mulheres'];
const FAIXAS_ETARIAS = ['18–25', '26–35', '36–50', '50+'];
const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

interface CellProfilePWAProps {
  celulaId: string;
  onBack: () => void;
}

export function CellProfilePWA({ celulaId, onBack }: CellProfilePWAProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [tipoCelula, setTipoCelula] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [bairro, setBairro] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [aceitaNovasVidas, setAceitaNovasVidas] = useState(true);
  const [redeName, setRedeName] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('celulas')
        .select('tipo_celula, faixa_etaria_predominante, bairro, meeting_day, meeting_time, aceita_novas_vidas, rede:redes(name)')
        .eq('id', celulaId)
        .single();

      if (data) {
        setTipoCelula(data.tipo_celula || '');
        setFaixaEtaria(data.faixa_etaria_predominante || '');
        setBairro(data.bairro || '');
        setMeetingDay(data.meeting_day || '');
        setMeetingTime(data.meeting_time || '');
        setAceitaNovasVidas(data.aceita_novas_vidas !== false);
        setRedeName((data.rede as any)?.name || '—');
      }
      setLoading(false);
    }
    load();
  }, [celulaId]);

  const scrollIntoInput = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('celulas')
      .update({
        tipo_celula: tipoCelula || null,
        faixa_etaria_predominante: faixaEtaria || null,
        bairro: bairro || null,
        meeting_day: meetingDay || null,
        meeting_time: meetingTime || null,
        aceita_novas_vidas: aceitaNovasVidas,
      })
      .eq('id', celulaId);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Perfil da célula atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['celulas_publicas'] });
    }
  }

  const isComplete = tipoCelula && faixaEtaria && bairro && meetingDay;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 border-b border-border/30 shrink-0 bg-background/95 backdrop-blur-md"
        style={{
          minHeight: 'calc(48px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center h-11 w-11 -ml-2 rounded-xl active:bg-accent/60 touch-manipulation transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">Perfil da Célula</h2>
        </div>
        {isComplete ? (
          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 gap-1 text-[10px]">
            <CheckCircle className="h-3 w-3" />Completo
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-[10px]">
            Incompleto
          </Badge>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 space-y-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Esses dados alimentam o match inteligente da Central de Células.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Tipo da Célula *</Label>
                <Select value={tipoCelula} onValueChange={setTipoCelula}>
                  <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_CELULA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Rede</Label>
                <Input value={redeName} disabled className="h-12 text-base bg-muted/50" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Faixa Etária Predominante *</Label>
                <Select value={faixaEtaria} onValueChange={setFaixaEtaria}>
                  <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {FAIXAS_ETARIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Bairro Principal *</Label>
                <Input
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                  onFocus={scrollIntoInput}
                  placeholder="Ex: Centro"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Dia da Célula *</Label>
                <Select value={meetingDay} onValueChange={setMeetingDay}>
                  <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Horário</Label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={e => setMeetingTime(e.target.value)}
                  onFocus={scrollIntoInput}
                  className="h-12 text-base"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/40">
                <div>
                  <Label className="text-sm font-medium text-foreground">Aceita novas vidas</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Desativado = não aparece nas sugestões</p>
                </div>
                <Switch checked={aceitaNovasVidas} onCheckedChange={setAceitaNovasVidas} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed CTA footer */}
      {!loading && (
        <div
          className="shrink-0 px-4 pt-3 pb-3 border-t border-border/30 bg-background"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <Button onClick={handleSave} disabled={saving} className="w-full h-14 text-base font-semibold gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Salvo!' : 'Salvar Perfil'}
          </Button>
        </div>
      )}
    </div>
  );
}
