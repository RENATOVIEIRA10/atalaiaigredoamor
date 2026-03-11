import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { useFinDashboardKPIs, useFinContasPagar, useFinCentrosCusto, useFinAuditLog } from '@/hooks/useFinanceiro';
import { useCampos } from '@/hooks/useCampos';
import {
  TrendingUp, TrendingDown, AlertTriangle,
  Clock, CreditCard, ArrowUpRight, ArrowDownRight, Receipt,
  Wallet, CalendarClock, Target, History, PieChart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--vida))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--gold))',
  'hsl(var(--accent))',
  'hsl(var(--muted-foreground))',
];

const AUDIT_LABELS: Record<string, string> = {
  criou: 'Criou',
  editou: 'Editou',
  marcou_pago: 'Pagou',
  marcou_recebido: 'Recebeu',
  excluiu: 'Excluiu',
  duplicou: 'Duplicou',
  gerou_recorrencia: 'Recorrência',
  marcou_pago_lote: 'Pagou (lote)',
};

export default function FinanceiroDashboard() {
  const { data: kpis, isLoading } = useFinDashboardKPIs();
  const { data: proximasContas } = useFinContasPagar({ status: 'pendente' });
  const { data: centros } = useFinCentrosCusto();
  const { data: campos } = useCampos();
  const { data: auditLog } = useFinAuditLog(10);
  const navigate = useNavigate();

  const proximas = (proximasContas || []).slice(0, 5);

  const centroCustoChartData = useMemo(() => {
    if (!kpis?.porCentroCusto) return [];
    return Object.entries(kpis.porCentroCusto).map(([id, valor]) => ({
      name: id === '_sem_centro' ? 'Sem centro' : (centros || []).find(c => c.id === id)?.nome || 'Outro',
      value: valor as number,
    })).sort((a, b) => b.value - a.value);
  }, [kpis?.porCentroCusto, centros]);

  const campusChartData = useMemo(() => {
    if (!kpis?.porCampus) return [];
    return Object.entries(kpis.porCampus).map(([id, valor]) => ({
      name: (campos || []).find((c: any) => c.id === id)?.nome || 'Outro',
      value: valor as number,
    })).sort((a, b) => b.value - a.value);
  }, [kpis?.porCampus, campos]);

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
    saldo: 0, saldoProjetado: 0, totalEntradasMes: 0, totalSaidasMes: 0,
    contasVencidasCount: 0, contasVencidasTotal: 0,
    contasProximasCount: 0, contasProximasTotal: 0,
    receberAtrasadosCount: 0, totalPendentePagar: 0, totalPendenteReceber: 0,
    porCentroCusto: {}, porCampus: {},
  };

  return (
    <AppLayout title="Administrativo & Financeiro">
      <div className="space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            icon={Wallet}
            label="Saldo do Mês"
            value={formatBRL(k.saldo)}
            className={k.saldo >= 0 ? 'border-vida/20' : 'border-destructive/20'}
          />
          <StatCard
            icon={TrendingUp}
            label="Entradas"
            value={formatBRL(k.totalEntradasMes)}
            className="border-vida/20"
            onClick={() => navigate('/financeiro/contas-receber')}
          />
          <StatCard
            icon={TrendingDown}
            label="Saídas"
            value={formatBRL(k.totalSaidasMes)}
            className="border-destructive/20"
            onClick={() => navigate('/financeiro/contas-pagar')}
          />
          <StatCard
            icon={CreditCard}
            label="A Pagar"
            value={formatBRL(k.totalPendentePagar)}
            onClick={() => navigate('/financeiro/contas-pagar')}
          />
          <StatCard
            icon={Target}
            label="Saldo Projetado"
            value={formatBRL(k.saldoProjetado)}
            className={k.saldoProjetado >= 0 ? 'border-primary/20' : 'border-destructive/20'}
          />
        </div>

        {/* ── Alerts Row ── */}
        {(k.contasVencidasCount > 0 || k.contasProximasCount > 0 || k.receberAtrasadosCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {k.contasVencidasCount > 0 && (
              <Card className="border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => navigate('/financeiro/contas-pagar')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">
                      {k.contasVencidasCount} vencida{k.contasVencidasCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatBRL(k.contasVencidasTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {k.contasProximasCount > 0 && (
              <Card className="border-warning/30 bg-warning/5 cursor-pointer hover:bg-warning/10 transition-colors" onClick={() => navigate('/financeiro/contas-pagar')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-warning shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-warning">{k.contasProximasCount} vencem em 7 dias</p>
                    <p className="text-xs text-muted-foreground">{formatBRL(k.contasProximasTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {k.receberAtrasadosCount > 0 && (
              <Card className="border-gold/30 bg-gold/5 cursor-pointer hover:bg-gold/10 transition-colors" onClick={() => navigate('/financeiro/contas-receber')}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gold shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gold">{k.receberAtrasadosCount} recebível{k.receberAtrasadosCount > 1 ? 'is' : ''} atrasado{k.receberAtrasadosCount > 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Despesas por Centro de Custo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4 text-primary" />
                Despesas por Centro de Custo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {centroCustoChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados no mês</p>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={centroCustoChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                        {centroCustoChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center -mt-2">
                    {centroCustoChartData.slice(0, 5).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Despesas por Campus */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Despesas por Campus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campusChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados no mês</p>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campusChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="value" name="Despesas" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Próximas Contas + Audit ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-primary" />
                Próximos Vencimentos
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
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate('/financeiro/contas-pagar')}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}
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

          {/* Audit Trail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-muted-foreground" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!auditLog || auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem atividade registrada</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {auditLog.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">
                          <span className="font-medium">{log.user_name || 'Usuário'}</span>
                          {' '}
                          <span className="text-muted-foreground">{AUDIT_LABELS[log.acao] || log.acao}</span>
                          {' '}
                          <span className="text-muted-foreground">em {log.tabela.replace('fin_', '')}</span>
                        </p>
                        <p className="text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Conta a Pagar', icon: ArrowDownRight, href: '/financeiro/contas-pagar', color: 'text-destructive' },
            { label: 'Recebível', icon: ArrowUpRight, href: '/financeiro/contas-receber', color: 'text-vida' },
            { label: 'Fluxo de Caixa', icon: TrendingUp, href: '/financeiro/fluxo-caixa', color: 'text-primary' },
            { label: 'Fornecedores', icon: Receipt, href: '/financeiro/fornecedores', color: 'text-primary' },
            { label: 'Centros de Custo', icon: PieChart, href: '/financeiro/centros-custo', color: 'text-gold' },
          ].map((a) => (
            <Card key={a.label} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate(a.href)}>
              <CardContent className="p-3 flex items-center gap-2">
                <a.icon className={cn('h-4 w-4 shrink-0', a.color)} />
                <span className="text-xs font-medium">{a.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
