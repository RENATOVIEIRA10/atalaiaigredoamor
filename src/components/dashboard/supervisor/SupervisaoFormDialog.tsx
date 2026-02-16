import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCreateSupervisao } from '@/hooks/useSupervisoes';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Celula {
  id: string;
  name: string;
  leader_id: string | null;
}

interface SupervisaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supervisorId: string;
  celulas: Celula[];
}

const roteiroItems = [
  { key: 'oracao_inicial', label: '1) Oração inicial' },
  { key: 'louvor', label: '2) Louvor' },
  { key: 'apresentacao_visitantes', label: '3) Apresentação de visitantes' },
  { key: 'momento_visao_triade', label: '4) Momento da visão e Tríade' },
  { key: 'avisos', label: '5) Avisos' },
  { key: 'quebra_gelo', label: '6) Quebra gelo' },
  { key: 'licao', label: '7) Lição' },
  { key: 'cadeira_amor', label: '8) Cadeira do amor' },
  { key: 'oracao_final', label: '9) Oração final' },
  { key: 'selfie', label: '10) Selfie' },
  { key: 'comunhao', label: '11) Comunhão' },
] as const;

const avaliacaoItems = [
  { key: 'pontualidade', label: '1) Pontualidade' },
  { key: 'dinamica', label: '2) Dinâmica' },
  { key: 'organizacao', label: '3) Organização' },
  { key: 'interatividade', label: '4) Interatividade' },
] as const;

type RoteiroKey = typeof roteiroItems[number]['key'];
type AvaliacaoKey = typeof avaliacaoItems[number]['key'];

export function SupervisaoFormDialog({ open, onOpenChange, supervisorId, celulas }: SupervisaoFormDialogProps) {
  const createSupervisao = useCreateSupervisao();
  const { toast } = useToast();
  
  const [celulaId, setCelulaId] = useState('');
  const [dataSupervisao, setDataSupervisao] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioTermino, setHorarioTermino] = useState('');
  const [celulaRealizada, setCelulaRealizada] = useState(true);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [pontosAlinhar, setPontosAlinhar] = useState('');
  const [pontosPositivos, setPontosPositivos] = useState('');
  
  const [roteiro, setRoteiro] = useState<Record<RoteiroKey, boolean>>({
    oracao_inicial: false,
    louvor: false,
    apresentacao_visitantes: false,
    momento_visao_triade: false,
    avisos: false,
    quebra_gelo: false,
    licao: false,
    cadeira_amor: false,
    oracao_final: false,
    selfie: false,
    comunhao: false,
  });

  const [avaliacao, setAvaliacao] = useState<Record<AvaliacaoKey, boolean>>({
    pontualidade: false,
    dinamica: false,
    organizacao: false,
    interatividade: false,
  });

  const handleRoteiroChange = (key: RoteiroKey, checked: boolean) => {
    setRoteiro(prev => ({ ...prev, [key]: checked }));
  };

  const handleAvaliacaoChange = (key: AvaliacaoKey, checked: boolean) => {
    setAvaliacao(prev => ({ ...prev, [key]: checked }));
  };

  const resetForm = () => {
    setCelulaId('');
    setDataSupervisao(format(new Date(), 'yyyy-MM-dd'));
    setHorarioInicio('');
    setHorarioTermino('');
    setCelulaRealizada(true);
    setMotivoCancelamento('');
    setPontosAlinhar('');
    setPontosPositivos('');
    setRoteiro({
      oracao_inicial: false,
      louvor: false,
      apresentacao_visitantes: false,
      momento_visao_triade: false,
      avisos: false,
      quebra_gelo: false,
      licao: false,
      cadeira_amor: false,
      oracao_final: false,
      selfie: false,
      comunhao: false,
    });
    setAvaliacao({
      pontualidade: false,
      dinamica: false,
      organizacao: false,
      interatividade: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!celulaId) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione uma célula.",
        variant: "destructive",
      });
      return;
    }

    if (!dataSupervisao) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione a data.",
        variant: "destructive",
      });
      return;
    }

    if (!horarioInicio || !horarioTermino) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe o horário de início e término.",
        variant: "destructive",
      });
      return;
    }
    
    if (!supervisorId) {
      toast({
        title: "Erro interno",
        description: "Identificador do supervisor não encontrado.",
        variant: "destructive",
      });
      return;
    }

    await createSupervisao.mutateAsync({
      celula_id: celulaId,
      supervisor_id: supervisorId,
      data_supervisao: dataSupervisao,
      horario_inicio: horarioInicio,
      horario_termino: horarioTermino,
      celula_realizada: celulaRealizada,
      motivo_cancelamento: !celulaRealizada ? motivoCancelamento : null,
      ...roteiro,
      ...avaliacao,
      pontos_alinhar: pontosAlinhar || null,
      pontos_positivos: pontosPositivos || null,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Registrar Supervisão</DialogTitle>
          <DialogDescription>Preencha o formulário de supervisão da célula</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="celula">Célula *</Label>
                <Select value={celulaId} onValueChange={setCelulaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a célula" />
                  </SelectTrigger>
                  <SelectContent>
                    {celulas.map(celula => (
                      <SelectItem key={celula.id} value={celula.id}>
                        {celula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={dataSupervisao}
                  onChange={(e) => setDataSupervisao(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inicio">Horário de Início *</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="termino">Horário de Término *</Label>
                <Input
                  id="termino"
                  type="time"
                  value={horarioTermino}
                  onChange={(e) => setHorarioTermino(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Célula Realizada Switch */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="realizada" className="text-base font-semibold">A célula foi realizada?</Label>
                    <p className="text-sm text-muted-foreground">
                      Marque se a reunião da célula aconteceu
                    </p>
                  </div>
                  <Switch
                    id="realizada"
                    checked={celulaRealizada}
                    onCheckedChange={setCelulaRealizada}
                  />
                </div>
                
                {!celulaRealizada && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="motivo">Motivo do cancelamento</Label>
                    <Textarea
                      id="motivo"
                      value={motivoCancelamento}
                      onChange={(e) => setMotivoCancelamento(e.target.value)}
                      placeholder="Informe o motivo pelo qual a célula não aconteceu..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {celulaRealizada && (
              <>
                {/* Roteiro */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Roteiro da Célula</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {roteiroItems.map(item => (
                      <div key={item.key} className="flex items-center space-x-3">
                        <Checkbox
                          id={item.key}
                          checked={roteiro[item.key]}
                          onCheckedChange={(checked) => handleRoteiroChange(item.key, !!checked)}
                        />
                        <Label htmlFor={item.key} className="flex-1 cursor-pointer">
                          {item.label}
                        </Label>
                        <span className="text-lg">
                          {roteiro[item.key] ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Avaliação */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Avaliação Geral</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {avaliacaoItems.map(item => (
                      <div key={item.key} className="flex items-center space-x-3">
                        <Checkbox
                          id={item.key}
                          checked={avaliacao[item.key]}
                          onCheckedChange={(checked) => handleAvaliacaoChange(item.key, !!checked)}
                        />
                        <Label htmlFor={item.key} className="flex-1 cursor-pointer">
                          {item.label}
                        </Label>
                        <span className="text-lg">
                          {avaliacao[item.key] ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Observations */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alinhar">Pontos a Alinhar</Label>
                    <Textarea
                      id="alinhar"
                      value={pontosAlinhar}
                      onChange={(e) => setPontosAlinhar(e.target.value)}
                      placeholder="Ex: Tempo da lição, pontualidade..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="positivos">Pontos Positivos</Label>
                    <Textarea
                      id="positivos"
                      value={pontosPositivos}
                      onChange={(e) => setPontosPositivos(e.target.value)}
                      placeholder="Ex: Organização do ambiente, líder receptivo..."
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSupervisao.isPending}>
                {createSupervisao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Supervisão
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
