import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Loader2, MoreVertical, Pencil, Trash2, Home, Heart } from 'lucide-react';
import { getCoupleDisplayName } from '@/hooks/useLeadershipCouples';
import { useCoordenacoes, Coordenacao } from '@/hooks/useCoordenacoes';
import { CoordenacaoFormDialog } from '@/components/coordenacoes/CoordenacaoFormDialog';
import { DeleteCoordenacaoDialog } from '@/components/coordenacoes/DeleteCoordenacaoDialog';

export default function Coordenacoes() {
  const { data: coordenacoes, isLoading } = useCoordenacoes();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCoordenacao, setEditingCoordenacao] = useState<Coordenacao | null>(null);
  const [deletingCoordenacao, setDeletingCoordenacao] = useState<Coordenacao | null>(null);
  
  const filteredCoordenacoes = coordenacoes?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.leader?.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rede?.name.toLowerCase().includes(search.toLowerCase())
  ) || [];
  
  function handleEdit(coordenacao: Coordenacao) {
    setEditingCoordenacao(coordenacao);
    setFormOpen(true);
  }
  
  function handleCloseForm(open: boolean) {
    if (!open) {
      setEditingCoordenacao(null);
    }
    setFormOpen(open);
  }
  
  return (
    <AppLayout title="Coordenações">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar coordenações..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Coordenação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Coordenações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCoordenacoes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {search 
                  ? 'Nenhuma coordenação encontrada com esse termo.' 
                  : 'Nenhuma coordenação cadastrada ainda. Clique em "Nova Coordenação" para começar.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Rede</TableHead>
                    <TableHead>Coordenador</TableHead>
                    <TableHead>Células</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoordenacoes.map((coordenacao) => (
                    <TableRow key={coordenacao.id}>
                      <TableCell className="font-medium">{coordenacao.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{coordenacao.rede?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {coordenacao.leadership_couple ? (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-primary" />
                            <span className="text-sm">{getCoupleDisplayName(coordenacao.leadership_couple)}</span>
                          </div>
                        ) : coordenacao.leader ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={coordenacao.leader.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {coordenacao.leader.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{coordenacao.leader.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Home className="h-4 w-4" />
                          {coordenacao._count?.celulas || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coordenacao)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingCoordenacao(coordenacao)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <CoordenacaoFormDialog 
        open={formOpen} 
        onOpenChange={handleCloseForm}
        coordenacao={editingCoordenacao}
      />
      
      <DeleteCoordenacaoDialog
        open={!!deletingCoordenacao}
        onOpenChange={(open) => !open && setDeletingCoordenacao(null)}
        coordenacaoId={deletingCoordenacao?.id || null}
        coordenacaoName={deletingCoordenacao?.name || ''}
      />
    </AppLayout>
  );
}
