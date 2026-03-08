import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Loader2, MoreVertical, UserMinus } from 'lucide-react';
import { useMembers, useRemoveMember } from '@/hooks/useMembers';
import { useCelulas } from '@/hooks/useCelulas';
import { MemberFormDialog } from '@/components/members/MemberFormDialog';
import { ProfileViewerDialog } from '@/components/profile/ProfileViewerDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRole } from '@/contexts/RoleContext';

export default function Membros() {
  const [search, setSearch] = useState('');
  const [selectedCelula, setSelectedCelula] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<any>(null);
  const { scopeType, scopeId } = useRole();
  
  const { data: allCelulas } = useCelulas();
  
  // Filter celulas by scope
  const celulas = useMemo(() => {
    const list = allCelulas || [];
    if (scopeType === 'celula' && scopeId) return list.filter(c => c.id === scopeId);
    if (scopeType === 'supervisor' && scopeId) return list.filter(c => (c as any).supervisor_id === scopeId);
    if (scopeType === 'coordenacao' && scopeId) return list.filter(c => c.coordenacao_id === scopeId);
    if (scopeType === 'rede' && scopeId) return list.filter(c => c.rede_id === scopeId);
    return list;
  }, [allCelulas, scopeType, scopeId]);
  
  const { data: members, isLoading } = useMembers(
    selectedCelula !== 'all' ? selectedCelula : undefined
  );
  const removeMember = useRemoveMember();
  
  const filteredMembers = useMemo(() => {
    let list = members || [];
    
    // Scope filtering
    const allowedCelulaIds = new Set(celulas.map(c => c.id));
    if (scopeType && scopeType !== 'admin') {
      list = list.filter(m => allowedCelulaIds.has(m.celula_id));
    }
    
    return list.filter(m => 
      m.profile?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.profile?.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.celula?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search, celulas, scopeType]);
  
  return (
    <AppLayout title="Membros">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar membros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCelula} onValueChange={setSelectedCelula}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por célula" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as células</SelectItem>
                {celulas?.map((celula) => (
                  <SelectItem key={celula.id} value={celula.id}>
                    {celula.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {search || selectedCelula !== 'all'
                  ? 'Nenhum membro encontrado com esses filtros.' 
                  : 'Nenhum membro cadastrado ainda.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead>Célula</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewingMember(member)}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} crossOrigin="anonymous" />
                            <AvatarFallback>
                              {member.profile?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium hover:text-primary transition-colors">{member.profile?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.profile?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.celula?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.joined_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => removeMember.mutate(member.id)}
                              className="text-destructive"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remover da Célula
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
      
      <MemberFormDialog open={formOpen} onOpenChange={setFormOpen} />

      {viewingMember && (
        <ProfileViewerDialog
          open={!!viewingMember}
          onOpenChange={(open) => !open && setViewingMember(null)}
          person1={viewingMember.profile}
          entityType="membro"
          entityName={viewingMember.celula?.name}
        />
      )}
    </AppLayout>
  );
}
