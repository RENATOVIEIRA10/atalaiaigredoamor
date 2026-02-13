import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, RefreshCw, Search, Shield, Copy, Power, Loader2 } from 'lucide-react';
import { useAccessKeys, useRegenerateAccessCode, useToggleAccessKey } from '@/hooks/useAccessKeys';
import { useToast } from '@/hooks/use-toast';

const scopeLabels: Record<string, string> = {
  admin: 'Admin',
  rede: 'Rede',
  coordenacao: 'Coordenação',
  supervisor: 'Supervisor',
  celula: 'Célula',
};

export function AccessKeysManager() {
  const { data: keys, isLoading } = useAccessKeys();
  const regenerate = useRegenerateAccessCode();
  const toggleKey = useToggleAccessKey();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredKeys = (keys || []).filter(k => {
    if (filterType !== 'all' && k.scope_type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return k.code.toLowerCase().includes(s) || 
             (k.entity_name || '').toLowerCase().includes(s) ||
             k.scope_type.toLowerCase().includes(s);
    }
    return true;
  });

  const adminKey = filteredKeys.find(k => k.scope_type === 'admin');
  const otherKeys = filteredKeys.filter(k => k.scope_type !== 'admin');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Key - Special Section */}
      {adminKey && (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Código Admin (fixo)</CardTitle>
            </div>
            <CardDescription>Este código dá acesso total ao sistema e não pode ser regenerado automaticamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="bg-muted px-3 py-2 rounded-lg text-sm font-mono font-bold tracking-wider">
                {adminKey.code}
              </code>
              <Button variant="ghost" size="icon" onClick={() => copyCode(adminKey.code)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Badge variant={adminKey.active ? 'default' : 'secondary'}>
                {adminKey.active ? 'Ativo' : 'Inativo'}
              </Badge>
              {adminKey.last_used_at && (
                <span className="text-xs text-muted-foreground">
                  Último uso: {new Date(adminKey.last_used_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Códigos de Acesso
              </CardTitle>
              <CardDescription>{otherKeys.length} código(s)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="coordenacao">Coordenação</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="celula">Célula</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherKeys.map(key => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {scopeLabels[key.scope_type] || key.scope_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {key.entity_name || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {key.code}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(key.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.active ? 'default' : 'secondary'} className="text-xs">
                        {key.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {key.active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => regenerate.mutate(key.id)}
                            disabled={regenerate.isPending}
                            title="Regenerar código"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleKey.mutate({ id: key.id, active: !key.active })}
                          disabled={toggleKey.isPending}
                          title={key.active ? 'Desativar' : 'Ativar'}
                        >
                          <Power className={`h-4 w-4 ${key.active ? 'text-destructive' : 'text-success'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
