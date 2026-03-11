import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinContasPagar, useFinContasReceber } from '@/hooks/useFinanceiro';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function FluxoCaixa() {
  const { data: pagar, isLoading: l1 } = useFinContasPagar();
  const { data: receber, isLoading: l2 } = useFinContasReceber();
  const isLoading = l1 || l2;

  const monthlyData = useMemo(() => {
    const year = new Date().getFullYear();
    return MONTHS.map((month, idx) => {
      const mm = String(idx + 1).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const entradas = (receber || [])
        .filter((c) => c.status === 'recebido' && c.data_prevista?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0);
      const saidas = (pagar || [])
        .filter((c) => c.status === 'pago' && c.data_vencimento?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0);
      return { month, entradas, saidas, saldo: entradas - saidas };
    });
  }, [pagar, receber]);

  const cumulativeData = useMemo(() => {
    let acc = 0;
    return monthlyData.map((d) => {
      acc += d.saldo;
      return { ...d, acumulado: acc };
    });
  }, [monthlyData]);

  const totalEntradas = monthlyData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = monthlyData.reduce((s, d) => s + d.saidas, 0);

  if (isLoading) {
    return (
      <AppLayout title="Fluxo de Caixa">
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-80" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Fluxo de Caixa">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={TrendingUp} label="Total Entradas (Ano)" value={formatBRL(totalEntradas)} className="border-vida/20" />
          <StatCard icon={TrendingDown} label="Total Saídas (Ano)" value={formatBRL(totalSaidas)} className="border-destructive/20" />
          <StatCard icon={DollarSign} label="Resultado Anual" value={formatBRL(totalEntradas - totalSaidas)} className={totalEntradas - totalSaidas >= 0 ? 'border-vida/20' : 'border-destructive/20'} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entradas vs Saídas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--vida))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="acumulado" name="Saldo Acumulado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
