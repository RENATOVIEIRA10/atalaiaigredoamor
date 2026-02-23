import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { RecomecoEncRow } from '@/hooks/useRecomecoFunnel';

interface RecomecoAlertsProps {
  pendingOver3Days: RecomecoEncRow[];
  noResponseOver7Days: RecomecoEncRow[];
}

export function RecomecoAlerts({ pendingOver3Days, noResponseOver7Days }: RecomecoAlertsProps) {
  if (pendingOver3Days.length === 0 && noResponseOver7Days.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {pendingOver3Days.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Pendentes há +3 dias</p>
              <p className="text-xs text-muted-foreground">{pendingOver3Days.length} vida(s) aguardando primeiro contato</p>
            </div>
            <Badge variant="outline" className="border-amber-500/30 text-amber-600 shrink-0">{pendingOver3Days.length}</Badge>
          </CardContent>
        </Card>
      )}
      {noResponseOver7Days.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Sem resposta há +7 dias</p>
              <p className="text-xs text-muted-foreground">{noResponseOver7Days.length} vida(s) sem retorno</p>
            </div>
            <Badge variant="outline" className="border-destructive/30 text-destructive shrink-0">{noResponseOver7Days.length}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
