import { Loader2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGlobalValidation, CampusValidationRow } from '@/hooks/useGlobalValidation';
import { ScrollArea } from '@/components/ui/scroll-area';

export function GlobalValidationPanel() {
  const { data, isLoading } = useGlobalValidation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { rows, globalTotals, sumTotals, isConsistent } = data;

  const columns = [
    { key: 'campo_nome', label: 'Campus' },
    { key: 'celulas', label: 'Células' },
    { key: 'membros', label: 'Membros' },
    { key: 'relatorios_2sem', label: 'Relat. 2 sem' },
    { key: 'relatorios_mes', label: 'Relat. mês' },
    { key: 'novas_vidas_nova', label: 'NV Nova' },
    { key: 'novas_vidas_contatado', label: 'NV Contatado' },
    { key: 'novas_vidas_agendado', label: 'NV Agendado' },
    { key: 'novas_vidas_integrado', label: 'NV Integrado' },
    { key: 'novas_vidas_membro', label: 'NV Membro' },
    { key: 'supervisoes_bimestre', label: 'Supervisões' },
    { key: 'disc_encontros', label: 'Disc. Enc.' },
    { key: 'disc_presencas', label: 'Disc. Pres.' },
    { key: 'event_registrations', label: 'Eventos' },
  ] as const;

  const numericKeys = columns.filter(c => c.key !== 'campo_nome').map(c => c.key);

  const renderRow = (row: CampusValidationRow, className?: string) => (
    <TableRow key={row.campo_id} className={className}>
      <TableCell className="font-medium whitespace-nowrap">{row.campo_nome}</TableCell>
      {numericKeys.map(key => (
        <TableCell key={key} className="text-center tabular-nums">
          {row[key]}
        </TableCell>
      ))}
    </TableRow>
  );

  const renderComparisonRow = () => {
    return (
      <TableRow className="bg-primary/5 border-t-2">
        <TableCell className="font-bold">CHECK (Global = Soma?)</TableCell>
        {numericKeys.map(key => {
          const match = globalTotals[key] === sumTotals[key];
          return (
            <TableCell key={key} className="text-center">
              {match ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">✓</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  {globalTotals[key]} ≠ {sumTotals[key]}
                </Badge>
              )}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Validação de Consistência
            </CardTitle>
            <CardDescription className="mt-1">
              Comparativo por campus vs total global — dados em tempo real
            </CardDescription>
          </div>
          {isConsistent ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Consistente
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Inconsistência detectada
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {columns.map(col => (
                    <TableHead
                      key={col.key}
                      className={col.key === 'campo_nome' ? 'whitespace-nowrap' : 'text-center whitespace-nowrap text-xs'}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => renderRow(row, 'hover:bg-muted/30'))}
                {renderRow(sumTotals, 'bg-muted/30 font-bold border-t-2')}
                {renderRow(globalTotals, 'bg-primary/10 font-bold')}
                {renderComparisonRow()}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
