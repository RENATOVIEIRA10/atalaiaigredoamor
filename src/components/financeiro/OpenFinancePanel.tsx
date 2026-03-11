import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Landmark, RefreshCw, Trash2, Plus, Loader2, Wifi, WifiOff, CalendarDays,
} from 'lucide-react';
import { useBankConnections, useOpenFinanceMutations } from '@/hooks/useOpenFinance';

const PLUGGY_CONNECT_URL = 'https://connect.pluggy.ai';

interface Props {
  campoId: string;
}

export function OpenFinancePanel({ campoId }: Props) {
  const { data: connections, isLoading } = useBankConnections();
  const { getConnectToken, saveConnection, syncTransactions, deleteConnection } = useOpenFinanceMutations();

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [syncDialogConn, setSyncDialogConn] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Generate connect token and open widget
  const handleConnect = useCallback(async () => {
    try {
      const token = await getConnectToken.mutateAsync(undefined);
      setConnectToken(token);
      setConnectOpen(true);
    } catch (e) {
      // error handled by mutation
    }
  }, [getConnectToken]);

  // Listen for Pluggy widget postMessage
  useEffect(() => {
    if (!connectOpen || !connectToken) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== 'https://connect.pluggy.ai') return;
      const { type, itemId } = event.data || {};
      if (type === 'close') {
        setConnectOpen(false);
        setConnectToken(null);
      }
      if (type === 'success' && itemId) {
        saveConnection.mutate({ campoId, itemId });
        setConnectOpen(false);
        setConnectToken(null);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [connectOpen, connectToken, campoId, saveConnection]);

  const handleSync = useCallback(async (connectionId: string) => {
    await syncTransactions.mutateAsync({
      connectionId,
      campoId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setSyncDialogConn(null);
    setDateFrom('');
    setDateTo('');
  }, [syncTransactions, campoId, dateFrom, dateTo]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Open Finance
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleConnect} disabled={getConnectToken.isPending}>
            {getConnectToken.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Conectar Banco
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : !connections?.length ? (
          <div className="text-center py-6 text-muted-foreground">
            <Landmark className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma conta conectada</p>
            <p className="text-xs mt-1">Conecte sua conta bancária para sincronizar extratos automaticamente</p>
          </div>
        ) : (
          connections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center',
                  conn.status === 'active' ? 'bg-vida/10 text-vida' : 'bg-destructive/10 text-destructive'
                )}>
                  {conn.status === 'active' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{conn.bank_name || 'Banco'}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {conn.account_number && <span>•••{conn.account_number.slice(-4)}</span>}
                    {conn.last_sync_at && (
                      <span>Última sync: {new Date(conn.last_sync_at).toLocaleDateString('pt-BR')}</span>
                    )}
                    {conn.sync_error && (
                      <Badge variant="destructive" className="text-[10px]">Erro</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSyncDialogConn(conn.id)}
                  disabled={syncTransactions.isPending}
                  title="Sincronizar transações"
                >
                  {syncTransactions.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deleteConnection.mutate(conn.id)}
                  title="Desconectar"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Pluggy Connect Widget */}
      <Dialog open={connectOpen} onOpenChange={v => { if (!v) { setConnectOpen(false); setConnectToken(null); } }}>
        <DialogContent className="max-w-lg h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Conectar Conta Bancária
            </DialogTitle>
          </DialogHeader>
          {connectToken && (
            <iframe
              src={`${PLUGGY_CONNECT_URL}?connect_token=${connectToken}`}
              className="w-full flex-1 border-0"
              style={{ height: 'calc(80vh - 60px)' }}
              allow="camera"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={!!syncDialogConn} onOpenChange={v => { if (!v) setSyncDialogConn(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Sincronizar Transações
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Defina o período para buscar transações. Deixe em branco para trazer os últimos 30 dias.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">De</label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Até</label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogConn(null)}>Cancelar</Button>
            <Button
              onClick={() => syncDialogConn && handleSync(syncDialogConn)}
              disabled={syncTransactions.isPending}
            >
              {syncTransactions.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Sincronizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
