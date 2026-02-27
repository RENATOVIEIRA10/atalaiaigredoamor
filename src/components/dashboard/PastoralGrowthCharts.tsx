import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye } from 'lucide-react';
import { usePastoralGrowthCharts } from '@/hooks/usePastoralGrowthCharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(200 70% 50%)',
  'hsl(120 60% 40%)',
  'hsl(45 90% 50%)',
];

function buildChartConfig(names: string[]): ChartConfig {
  const config: ChartConfig = {};
  names.forEach((name, i) => {
    config[name] = {
      label: name,
      color: COLORS[i % COLORS.length],
    };
  });
  return config;
}

export function PastoralGrowthCharts({ campoId }: { campoId?: string | null } = {}) {
  const { data, isLoading } = usePastoralGrowthCharts(campoId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data || data.redeNames.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Dados insuficientes para gerar gráficos de evolução</p>
        </CardContent>
      </Card>
    );
  }

  const redeConfig = buildChartConfig(data.redeNames);
  const coordConfig = buildChartConfig(data.coordNames);

  return (
    <Tabs defaultValue="presence" className="space-y-4">
      <TabsList>
        <TabsTrigger value="presence" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Presença
        </TabsTrigger>
        <TabsTrigger value="visitors" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Visitantes
        </TabsTrigger>
        <TabsTrigger value="coords" className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Coordenações
        </TabsTrigger>
      </TabsList>

      {/* Presença por Rede */}
      <TabsContent value="presence">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Presença por Rede</CardTitle>
            <CardDescription>Total de membros presentes por mês nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={redeConfig} className="h-72 w-full">
              <LineChart data={data.redePresenceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                {data.redeNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Visitantes por Rede */}
      <TabsContent value="visitors">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visitantes por Rede</CardTitle>
            <CardDescription>Total de visitantes registrados por mês nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={redeConfig} className="h-72 w-full">
              <BarChart data={data.redeVisitorsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                {data.redeNames.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={COLORS[i % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Presença por Coordenação */}
      <TabsContent value="coords">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Presença por Coordenação</CardTitle>
            <CardDescription>Evolução mensal de presença por coordenação</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={coordConfig} className="h-72 w-full">
              <LineChart data={data.coordPresenceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                {data.coordNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
