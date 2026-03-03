import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMultiplicacoes, useCreateMultiplicacao, useDeleteMultiplicacao } from '@/hooks/useMultiplicacoes';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface MultiplicacaoNode {
  id: string; // ID da célula (destino)
  parentId: string; // ID da célula origem
  multiplicationId: string; // ID do registro na tabela
  multiplicationDate?: string;
  notes?: string;
}

interface MultiplicacoesVisualProps {
  celulas: { id: string; name: string }[];
}

export function MultiplicacoesVisual({ celulas }: MultiplicacoesVisualProps) {
  const { data: multiplicacoes, isLoading } = useMultiplicacoes();
  const createMultiplicacao = useCreateMultiplicacao();
  const deleteMultiplicacao = useDeleteMultiplicacao();
  const { toast } = useToast();
  
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Transformar lista plana em estrutura de árvore
  const treeData = useMemo(() => {
    const map: Record<string, MultiplicacaoNode> = {};
    if (!multiplicacoes) return map;

    multiplicacoes.forEach(m => {
      map[m.celula_destino_id] = {
        id: m.celula_destino_id,
        parentId: m.celula_origem_id,
        multiplicationId: m.id,
        multiplicationDate: m.data_multiplicacao,
        notes: m.notes || undefined
      };
    });
    return map;
  }, [multiplicacoes]);

  // Identificar raízes (células que são origem mas não são destino de ninguém na tabela)
  const rootIds = useMemo(() => {
    if (!multiplicacoes) return [];
    
    // Todos que são origem
    const origens = new Set(multiplicacoes.map(m => m.celula_origem_id));
    // Todos que são destino
    const destinos = new Set(multiplicacoes.map(m => m.celula_destino_id));
    
    // Raízes são origens que não estão na lista de destinos
    return Array.from(origens).filter(id => !destinos.has(id));
  }, [multiplicacoes]);

  const handleAdd = async () => {
    if (!selectedChild || !selectedParent) return;
    
    try {
      const parentCelula = celulas.find(c => c.id === selectedParent);
      await createMultiplicacao.mutateAsync({
        celula_origem_id: selectedParent,
        celula_destino_id: selectedChild,
        data_multiplicacao: date,
        campo_id: (parentCelula as any)?.campo_id || '',
      });
      setSelectedChild('');
      toast({
        title: "Multiplicação adicionada",
        description: "A relação foi criada com sucesso."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível criar a multiplicação.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (multiplicacaoId: string) => {
    try {
      await deleteMultiplicacao.mutateAsync(multiplicacaoId);
      toast({
        title: "Multiplicação removida",
        description: "A relação foi removida com sucesso."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a multiplicação.",
        variant: "destructive"
      });
    }
  };

  const renderNode = (celulaId: string, level = 0) => {
    const celula = celulas.find(c => c.id === celulaId);
    const displayName = celula ? celula.name : 'Célula Desconhecida';

    // Encontrar filhos deste nó (quem tem este ID como parentId)
    const childrenIds = Object.values(treeData)
      .filter(node => node.parentId === celulaId)
      .map(node => node.id);

    const nodeData = treeData[celulaId]; // Dados da multiplicação onde esta célula é o DESTINO
    
    const isRoot = !nodeData; 

    return (
      <div key={celulaId} className="relative" style={{ marginLeft: level > 0 ? 24 : 0 }}>
        {level > 0 && (
          <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-border" />
        )}
        
        <Card className={`mb-2 relative border-l-4 ${isRoot ? 'border-l-primary/50' : 'border-l-primary'}`}>
           {level > 0 && (
               <div className="absolute -left-3 top-6 w-3 h-[2px] bg-border" />
           )}
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{displayName}</span>
                {nodeData?.multiplicationDate && (
                  <Badge variant="outline" className="text-xs">
                    {/* Fix UTC date display by appending time */}
                    {format(new Date(nodeData.multiplicationDate + 'T12:00:00'), 'dd MMM yyyy', { locale: ptBR })}
                  </Badge>
                )}
                {isRoot && <Badge variant="secondary" className="text-xs">Raiz</Badge>}
              </div>
              {celula && <p className="text-xs text-muted-foreground">Líder: {celula.name.split(' - ')[1] || 'N/A'}</p>}
            </div>
            
            {!isRoot && nodeData && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(nodeData.multiplicationId)} 
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    title="Remover relação"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
          </CardContent>
        </Card>
        
        {childrenIds.length > 0 && (
            <div className="pl-2 mt-2 border-l border-dashed border-muted-foreground/20 ml-2">
                {childrenIds.map(childId => renderNode(childId, level + 1))}
            </div>
        )}
      </div>
    );
  };

  // Células disponíveis para serem filhas (que ainda não são destino de ninguém)
  const availableChildren = celulas.filter(c => !treeData[c.id]);
  
  // Células disponíveis para serem pais (qualquer célula, exceto ela mesma se fosse selecionada)
  const availableParents = celulas;

  if (isLoading) {
      return <div className="p-8 text-center">Carregando árvore...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Árvore de Multiplicação (SQL)
          </CardTitle>
          <CardDescription>
            Gerencie a genealogia das células. Dados salvos no banco de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2 flex-1">
                    <Label>Célula Mãe</Label>
                    <Select value={selectedParent} onValueChange={setSelectedParent}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a mãe" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableParents.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 flex-1">
                    <Label>Célula Filha (Nova)</Label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a filha" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableChildren.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 w-40">
                    <Label>Data</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <Button onClick={handleAdd} disabled={!selectedChild || !selectedParent || createMultiplicacao.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                </Button>
            </div>

            <div className="mt-6 border rounded-lg p-6 min-h-[300px] bg-background">
                {rootIds.length === 0 && Object.keys(treeData).length === 0 ? (
                    <div className="text-muted-foreground text-center p-8">
                        Nenhuma multiplicação registrada. Selecione uma mãe e uma filha acima para começar.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rootIds.map(rootId => renderNode(rootId))}
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
