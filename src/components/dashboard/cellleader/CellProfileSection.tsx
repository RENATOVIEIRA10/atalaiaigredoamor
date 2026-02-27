import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Settings2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const TIPOS_CELULA = ['Mista', 'Casais', 'Solteiros', 'Mulheres'];
const FAIXAS_ETARIAS = ['18–25', '26–35', '36–50', '50+'];
const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

interface CellProfileSectionProps {
  celulaId: string;
}

export function CellProfileSection({ celulaId }: CellProfileSectionProps) {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isComplete = tipoCelula && faixaEtaria && bairro && meetingDay;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Perfil da Célula</CardTitle>
          </div>
          {isComplete ? (
            <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 gap-1">
              <CheckCircle className="h-3 w-3" />Completo
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
              Incompleto
            </Badge>
          )}
        </div>
        <CardDescription>
          Esses dados alimentam o match inteligente da Central de Células.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo da Célula *</Label>
            <Select value={tipoCelula} onValueChange={setTipoCelula}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CELULA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Faixa Etária *</Label>
            <Select value={faixaEtaria} onValueChange={setFaixaEtaria}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {FAIXAS_ETARIAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Bairro Principal *</Label>
          <Input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Ex: Centro" className="h-9 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Dia da Célula *</Label>
            <Select value={meetingDay} onValueChange={setMeetingDay}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Horário</Label>
            <Input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Rede</Label>
          <Input value={redeName} disabled className="h-9 text-sm bg-muted/50" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
          <div>
            <Label className="text-sm font-medium">Aceita novas vidas</Label>
            <p className="text-xs text-muted-foreground">Quando desativado, a célula não aparece nas sugestões de match</p>
          </div>
          <Switch checked={aceitaNovasVidas} onCheckedChange={setAceitaNovasVidas} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Salvo!' : 'Salvar Perfil'}
        </Button>
      </CardContent>
    </Card>
  );
}
