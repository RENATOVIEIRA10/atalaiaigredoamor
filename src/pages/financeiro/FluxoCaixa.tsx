import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinContasPagar, useFinContasReceber, useFinCentrosCusto } from '@/hooks/useFinanceiro';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function FluxoCaixa() {
  const { data: pagar, isLoading: l1 } = useFinContasPagar();
  const { data: receber, isLoading: l2 } = useFinContasReceber();
  const { data: centros } = useFinCentrosCusto();
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const isLoading = l1 || l2;

  const years = useMemo(() => {
    const allDates = [
      ...(pagar || []).map(c => c.data_vencimento),
      ...(receber || []).map(c => c.data_prevista),
    ];
    const ys = new Set(allDates.filter(Boolean).map(d => d.slice(0, 4)));
    ys.add(String(new Date().getFullYear()));
    return Array.from(ys).sort().reverse();
  }, [pagar, receber]);

  const year = parseInt(selectedYear);

  const monthlyData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const mm = String(idx + 1).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const entradas = (receber || [])
        .filter((c) => c.status === 'recebido' && c.data_prevista?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0);
      const saidas = (pagar || [])
        .filter((c) => c.status === 'pago' && c.data_vencimento?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0);
      // Forecast: include pending for current/future months
      const now = new Date();
      const isFutureOrCurrent = year > now.getFullYear() || (year === now.getFullYear() && idx >= now.getMonth());
      const entradasPrev = isFutureOrCurrent ? (receber || [])
        .filter((c) => c.status === 'pendente' && c.data_prevista?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0) : 0;
      const saidasPrev = isFutureOrCurrent ? (pagar || [])
        .filter((c) => c.status === 'pendente' && c.data_vencimento?.startsWith(prefix))
        .reduce((s, c) => s + Number(c.valor), 0) : 0;
      return { month, entradas, saidas, saldo: entradas - saidas, entradasPrev, saidasPrev };
    });
  }, [pagar, receber, year]);

  const cumulativeData = useMemo(() => {
    let acc = 0;
    let accProj = 0;
    return monthlyData.map((d) => {
      acc += d.saldo;
      accProj += d.saldo + d.entradasPrev - d.saidasPrev;
      return { ...d, acumulado: acc, projetado: accProj };
    });
  }, [monthlyData]);

  // Centro de custo breakdown
  const centroCustoData = useMemo(() => {
    const map: Record<string, number> = {};
    (pagar || [])
      .filter(c => c.status === 'pago' && c.data_vencimento?.startsWith(String(year)))
      .forEach(c => {
        const key = c.centro_custo_id || '_sem';
        map[key] = (map[key] || 0) + Number(c.valor);
      });
    return Object.entries(map)
      .map(([id, valor]) => ({
        name: id === '_sem' ? 'Sem centro' : (centros || []).find(c => c.id === id)?.nome || 'Outro',
        value: valor,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [pagar, centros, year]);

  const totalEntradas = monthlyData.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas = monthlyData.reduce((s, d) => s + d.saidas, 0);
  const totalPrevEntradas = monthlyData.reduce((s, d) => s + d.entradasPrev, 0);
  const totalPrevSaidas = monthlyData.reduce((s, d) => s + d.saidasPrev, 0);

  if (isLoading) {
    return (
      <AppLayout title="Fluxo de Caixa">
        <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-80" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Fluxo de Caixa">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            <StatCard icon={TrendingUp} label="Entradas (Realizadas)" value={formatBRL(totalEntradas)} className="border-vida/20" />
            <StatCard icon={TrendingDown} label="Saídas (Realizadas)" value={formatBRL(totalSaidas)} className="border-destructive/20" />
            <StatCard icon={DollarSign} label="Resultado" value={formatBRL(totalEntradas - totalSaidas)} className={totalEntradas - totalSaidas >= 0 ? 'border-vida/20' : 'border-destructive/20'} />
            <StatCard icon={Target} label="Projetado (+ pendentes)" value={formatBRL(totalEntradas + totalPrevEntradas - totalSaidas - totalPrevSaidas)} className="border-primary/20" />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24 ml-4"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Entradas vs Saídas por Mês</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--vida))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="entradasPrev" name="Entradas (Previstas)" fill="hsl(var(--vida) / 0.3)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidasPrev" name="Saídas (Previstas)" fill="hsl(var(--destructive) / 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Saldo Acumulado + Projeção</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="acumulado" name="Realizado" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="projetado" name="Projetado" stroke="hsl(var(--gold))" fill="hsl(var(--gold) / 0.08)" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {centroCustoData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Despesas por Centro de Custo ({selectedYear})</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centroCustoData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Despesas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
