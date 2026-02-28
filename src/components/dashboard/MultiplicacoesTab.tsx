import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GitBranch, ArrowRight, Loader2 } from 'lucide-react';
import { useMultiplicacoes, useCreateMultiplicacao, useDeleteMultiplicacao } from '@/hooks/useMultiplicacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useDemoScope } from '@/hooks/useDemoScope';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function MultiplicacoesTab() {
  const { campoId } = useDemoScope();
  const { data: multiplicacoes = [], isLoading } = useMultiplicacoes(campoId);
  const { data: celulas = [] } = useCelulas();
  const createMutation = useCreateMultiplicacao();
  const deleteMutation = useDeleteMultiplicacao();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    celula_origem_id: '',
    celula_destino_id: '',
    data_multiplicacao: '',
    notes: '',
  });

  // Células que já têm origem registrada não podem ser selecionadas como destino
  const celulasComOrigem = multiplicacoes.map(m => m.celula_destino_id);
  const celulasDisponiveis = celulas.filter(c => !celulasComOrigem.includes(c.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.celula_origem_id || !formData.celula_destino_id || !formData.data_multiplicacao) return;

    await createMutation.mutateAsync({
      celula_origem_id: formData.celula_origem_id,
      celula_destino_id: formData.celula_destino_id,
      data_multiplicacao: formData.data_multiplicacao,
      notes: formData.notes || undefined,
    });

    setFormData({ celula_origem_id: '', celula_destino_id: '', data_multiplicacao: '', notes: '' });
    setIsDialogOpen(false);
  };

  // Agrupa multiplicações por célula de origem para visualização de árvore
  const origemGroups = multiplicacoes.reduce((acc, m) => {
    const origemId = m.celula_origem_id;
    if (!acc[origemId]) {
      acc[origemId] = {
        origem: m.celula_origem,
        filhas: [],
      };
    }
    acc[origemId].filhas.push(m);
    return acc;
  }, {} as Record<string, { origem: any; filhas: typeof multiplicacoes }>);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Multiplicação de Células
          </h2>
          <p className="text-sm text-muted-foreground">
            Rastreie a origem e crescimento das células
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Multiplicação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Multiplicação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Célula de Origem (Matriz)</Label>
                <Select
                  value={formData.celula_origem_id}
                  onValueChange={(value) => setFormData({ ...formData, celula_origem_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a célula mãe" />
                  </SelectTrigger>
                  <SelectContent>
                    {celulas.map((celula) => (
                      <SelectItem key={celula.id} value={celula.id}>
                        {celula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Célula Multiplicada (Nova)</Label>
                <Select
                  value={formData.celula_destino_id}
                  onValueChange={(value) => setFormData({ ...formData, celula_destino_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a nova célula" />
                  </SelectTrigger>
                  <SelectContent>
                    {celulasDisponiveis.map((celula) => (
                      <SelectItem key={celula.id} value={celula.id}>
                        {celula.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data da Multiplicação</Label>
                <Input
                  type="date"
                  value={formData.data_multiplicacao}
                  onChange={(e) => setFormData({ ...formData, data_multiplicacao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Observações (Opcional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalhes sobre a multiplicação..."
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visualização de Árvore */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(origemGroups).map((group: any) => (
          <Card key={group.origem.id} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">Matriz</Badge>
                {group.origem.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Gerou {group.filhas.length} {group.filhas.length === 1 ? 'célula' : 'células'}:
                </div>
                {group.filhas.map((multiplicacao: any) => (
                  <div key={multiplicacao.id} className="flex items-center gap-3 pl-4 border-l-2 border-muted">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{multiplicacao.celula_destino?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(multiplicacao.data_multiplicacao), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro de multiplicação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Isso removerá apenas o registro histórico. As células continuarão existindo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(multiplicacao.id)}>
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {multiplicacoes.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma multiplicação registrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
