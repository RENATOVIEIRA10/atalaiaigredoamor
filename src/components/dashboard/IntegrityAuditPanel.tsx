import { Loader2, ShieldAlert, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIntegrityAudit, IntegrityIssue } from '@/hooks/useIntegrityAudit';

export function IntegrityAuditPanel() {
  const { data: issues, isLoading } = useIntegrityAudit();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!issues) return null;

  const hasErrors = issues.some(i => i.severity === 'error' && i.count > 0);
  const allClean = issues.length === 1 && issues[0].count === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Auditoria de Integridade
            </CardTitle>
            <CardDescription className="mt-1">
              Verifica mismatch de campus, dados órfãos e relações inconsistentes
            </CardDescription>
          </div>
          {allClean ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Íntegro
            </Badge>
          ) : hasErrors ? (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3.5 w-3.5" />
              {issues.filter(i => i.severity === 'error').length} problema(s)
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Avisos
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tabela</TableHead>
              <TableHead>Problema</TableHead>
              <TableHead className="text-center">Registros</TableHead>
              <TableHead className="text-center">Severidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue, idx) => (
              <TableRow key={idx} className={issue.severity === 'error' && issue.count > 0 ? 'bg-destructive/5' : ''}>
                <TableCell className="font-mono text-xs">{issue.table}</TableCell>
                <TableCell className="text-sm">{issue.issue}</TableCell>
                <TableCell className="text-center tabular-nums font-medium">
                  {issue.count}
                </TableCell>
                <TableCell className="text-center">
                  {issue.count === 0 ? (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">OK</Badge>
                  ) : issue.severity === 'error' ? (
                    <Badge variant="destructive" className="text-xs">Erro</Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Aviso</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
