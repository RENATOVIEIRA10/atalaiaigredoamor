import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { useFinDashboardKPIs, useFinContasPagar } from '@/hooks/useFinanceiro';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Clock, CreditCard, ArrowUpRight, ArrowDownRight, Receipt,
  Wallet, CalendarClock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function FinanceiroDashboard() {
  const { data: kpis, isLoading } = useFinDashboardKPIs();
  const { data: proximasContas } = useFinContasPagar({ status: 'pendente' });
  const navigate = useNavigate();

  const proximas = (proximasContas || []).slice(0, 5);

  if (isLoading) {
    return (
      <AppLayout title="Administrativo & Financeiro">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const k = kpis || {
    saldo: 0, totalEntradasMes: 0, totalSaidasMes: 0,
    contasVencidasCount: 0, contasVencidasTotal: 0,
    contasProximasCount: 0, contasProximasTotal: 0,
    receberAtrasadosCount: 0, totalPendentePagar: 0, totalPendenteReceber: 0,
  };

  return (
    <AppLayout title="Administrativo & Financeiro">
      <div className="space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Wallet}
            label="Saldo do Mês"
            value={formatBRL(k.saldo)}
            className={k.saldo >= 0 ? 'border-vida/20' : 'border-destructive/20'}
          />
          <StatCard
            icon={TrendingUp}
            label="Entradas no Mês"
            value={formatBRL(k.totalEntradasMes)}
            className="border-vida/20"
            onClick={() => navigate('/financeiro/contas-receber')}
          />
          <StatCard
            icon={TrendingDown}
            label="Saídas no Mês"
            value={formatBRL(k.totalSaidasMes)}
            className="border-destructive/20"
            onClick={() => navigate('/financeiro/contas-pagar')}
          />
          <StatCard
            icon={CreditCard}
            label="Pendente a Pagar"
            value={formatBRL(k.totalPendentePagar)}
            onClick={() => navigate('/financeiro/contas-pagar')}
          />
        </div>

        {/* ── Alerts Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {k.contasVencidasCount > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => navigate('/financeiro/contas-pagar?status=vencido')}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    {k.contasVencidasCount} conta{k.contasVencidasCount > 1 ? 's' : ''} vencida{k.contasVencidasCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBRL(k.contasVencidasTotal)} em atraso</p>
                </div>
              </CardContent>
            </Card>
          )}
          {k.contasProximasCount > 0 && (
            <Card className="border-warning/30 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors" onClick={() => navigate('/financeiro/contas-pagar')}>
              <CardContent className="p-4 flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-warning">
                    {k.contasProximasCount} vencem em 7 dias
                  </p>
                  <p className="text-xs text-muted-foreground">{formatBRL(k.contasProximasTotal)} próximos</p>
                </div>
              </CardContent>
            </Card>
          )}
          {k.receberAtrasadosCount > 0 && (
            <Card className="border-gold/30 bg-gold/5 cursor-pointer hover:bg-gold/10 transition-colors" onClick={() => navigate('/financeiro/contas-receber')}>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-gold shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gold">
                    {k.receberAtrasadosCount} recebível{k.receberAtrasadosCount > 1 ? 'is' : ''} atrasado{k.receberAtrasadosCount > 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Próximas Contas a Pagar ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Próximas Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta pendente</p>
            ) : (
              <div className="space-y-2">
                {proximas.map((c) => {
                  const isOverdue = new Date(c.data_vencimento) < new Date();
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/financeiro/contas-pagar')}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}
                          {c.fornecedor?.nome && ` · ${c.fornecedor.nome}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">{formatBRL(c.valor)}</span>
                        {isOverdue && <Badge variant="destructive" className="text-[10px]">Vencida</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nova Conta a Pagar', icon: ArrowDownRight, href: '/financeiro/contas-pagar', color: 'text-destructive' },
            { label: 'Novo Recebível', icon: ArrowUpRight, href: '/financeiro/contas-receber', color: 'text-vida' },
            { label: 'Fornecedores', icon: Receipt, href: '/financeiro/fornecedores', color: 'text-primary' },
            { label: 'Centros de Custo', icon: DollarSign, href: '/financeiro/centros-custo', color: 'text-gold' },
          ].map((a) => (
            <Card
              key={a.label}
              className="cursor-pointer hover:bg-muted/50 transition-colors group"
              onClick={() => navigate(a.href)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <a.icon className={cn('h-5 w-5 shrink-0', a.color)} />
                <span className="text-sm font-medium">{a.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
