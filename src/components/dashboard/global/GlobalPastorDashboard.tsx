import { useState } from 'react';
import { Loader2, Globe, Church, Users, Home, GitBranch, Heart, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { useGlobalKingdomData, CampusKPI } from '@/hooks/useGlobalKingdomData';
import { KingdomCampusCard } from './KingdomCampusCard';
import { CampusDetailView } from './CampusDetailView';
import { GlobalValidationPanel } from '../GlobalValidationPanel';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from '../MissionVerse';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type DrillLevel = 'kingdom' | 'campus' | 'rede';

interface DrillState {
  level: DrillLevel;
  campoId?: string;
  campoNome?: string;
  redeId?: string;
  redeNome?: string;
}

export function GlobalPastorDashboard() {
  const [drill, setDrill] = useState<DrillState>({ level: 'kingdom' });
  const [tab, setTab] = useState<string>('visao');
  const [includeSynthetic, setIncludeSynthetic] = useState(false);
  const { data: campusData, isLoading } = useGlobalKingdomData(includeSynthetic);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allCampus = campusData || [];
  const activeCampus = allCampus.filter(c => c.celulas_ativas > 0 || c.membros_total > 0);
  const inactiveCampus = allCampus.filter(c => c.celulas_ativas === 0 && c.membros_total === 0);

  const totalCelulas = allCampus.reduce((s, c) => s + c.celulas_ativas, 0);
  const totalMembros = allCampus.reduce((s, c) => s + c.membros_total, 0);
  const totalNV = allCampus.reduce((s, c) => s + c.novas_vidas_total, 0);
  const avgEngajamento = activeCampus.length > 0
    ? Math.round(activeCampus.reduce((s, c) => s + c.engajamento_pct, 0) / activeCampus.length)
    : 0;

  const handleSelectCampus = (campoId: string, campoNome: string) => {
    setDrill({ level: 'campus', campoId, campoNome });
  };

  const handleSelectRede = (redeId: string, redeNome: string) => {
    setDrill({ ...drill, level: 'rede', redeId, redeNome });
  };

  const handleBackToKingdom = () => setDrill({ level: 'kingdom' });
  const handleBackToCampus = () => setDrill({ level: 'campus', campoId: drill.campoId, campoNome: drill.campoNome });

  // Level 2
  if (drill.level === 'campus' && drill.campoId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Visão Global" subtitle={`Detalhes do campus: ${drill.campoNome}`} icon={Globe} />
        <SyntheticToggle value={includeSynthetic} onChange={setIncludeSynthetic} />
        <CampusDetailView
          campoId={drill.campoId}
          campoNome={drill.campoNome!}
          onBack={handleBackToKingdom}
          onSelectRede={handleSelectRede}
          includeSynthetic={includeSynthetic}
        />
      </div>
    );
  }

  // Level 3
  if (drill.level === 'rede' && drill.redeId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Visão Global" subtitle={`${drill.campoNome} › ${drill.redeNome}`} icon={Globe} />
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackToCampus}>
            ← Voltar para {drill.campoNome}
          </Button>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Para detalhes da rede <strong>{drill.redeNome}</strong>, selecione o campus no seletor global e acesse a visão de pastor de campo.
          </p>
        </div>
      </div>
    );
  }

  // Level 1: Kingdom view
  return (
    <div className="space-y-8">
      <PageHeader
        title="Visão do Reino"
        subtitle="Panorama executivo de todos os campos"
        icon={Globe}
      />

      <MissionVerse role="pastor" />

      <SyntheticToggle value={includeSynthetic} onChange={setIncludeSynthetic} />

      {/* Global KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Consolidado Global {includeSynthetic && <Badge variant="secondary" className="ml-2 text-xs">incl. sintéticos</Badge>}
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Church} label="Campus Ativos" value={activeCampus.length} subtitle={`de ${allCampus.length} total`} />
          <StatCard icon={Home} label="Células" value={totalCelulas} />
          <StatCard icon={Users} label="Membros" value={totalMembros} />
          <StatCard icon={Heart} label="Novas Vidas" value={totalNV} />
          <StatCard icon={GitBranch} label="Engajamento Médio" value={`${avgEngajamento}%`} subtitle="relatórios na semana" />
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="visao">Campus</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="validacao">Validação</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          {activeCampus.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                📊 Campus com Dados Operacionais
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeCampus.map(campus => (
                  <KingdomCampusCard key={campus.campo_id} campus={campus} onSelect={handleSelectCampus} />
                ))}
              </div>
            </section>
          )}

          {inactiveCampus.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                🏗️ Campus em Implantação ({inactiveCampus.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inactiveCampus.map(campus => (
                  <KingdomCampusCard key={campus.campo_id} campus={campus} onSelect={handleSelectCampus} />
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="auditoria">
          <SyntheticAuditPanel data={allCampus} />
        </TabsContent>

        <TabsContent value="validacao">
          <GlobalValidationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SyntheticToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
      <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
      <Label htmlFor="synthetic-toggle" className="text-sm text-muted-foreground cursor-pointer flex-1">
        Incluir dados sintéticos (Seed Run)
      </Label>
      <Switch
        id="synthetic-toggle"
        checked={value}
        onCheckedChange={onChange}
      />
      {value && (
        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600">
          Modo simulação ativo
        </Badge>
      )}
    </div>
  );
}

function SyntheticAuditPanel({ data }: { data: CampusKPI[] }) {
  const totals = data.reduce(
    (acc, c) => ({
      celulasReais: acc.celulasReais + c.celulas_reais,
      celulasSinteticas: acc.celulasSinteticas + c.celulas_sinteticas,
      membrosReais: acc.membrosReais + c.membros_reais,
      membrosSinteticos: acc.membrosSinteticos + c.membros_sinteticos,
      relatoriosReais: acc.relatoriosReais + c.relatorios_reais,
      relatoriosSinteticos: acc.relatoriosSinteticos + c.relatorios_sinteticos,
    }),
    { celulasReais: 0, celulasSinteticas: 0, membrosReais: 0, membrosSinteticos: 0, relatoriosReais: 0, relatoriosSinteticos: 0 }
  );

  const campusWithSynthetic = data.filter(c => c.celulas_sinteticas > 0 || c.membros_sinteticos > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          Auditoria: Dados Reais vs. Sintéticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Campus</TableHead>
                <TableHead className="text-center">Células (R)</TableHead>
                <TableHead className="text-center">Células (S)</TableHead>
                <TableHead className="text-center">Células (T)</TableHead>
                <TableHead className="text-center">Membros (R)</TableHead>
                <TableHead className="text-center">Membros (S)</TableHead>
                <TableHead className="text-center">Membros (T)</TableHead>
                <TableHead className="text-center">Relatórios (R)</TableHead>
                <TableHead className="text-center">Relatórios (S)</TableHead>
                <TableHead className="text-center">Relatórios (T)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(c => {
                const hasSynthetic = c.celulas_sinteticas > 0 || c.membros_sinteticos > 0;
                return (
                  <TableRow key={c.campo_id} className={hasSynthetic ? 'bg-amber-500/5' : ''}>
                    <TableCell className="font-medium">{c.campo_nome}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.celulas_reais}</TableCell>
                    <TableCell className="text-center tabular-nums text-amber-600">{c.celulas_sinteticas}</TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">{c.celulas_reais + c.celulas_sinteticas}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.membros_reais}</TableCell>
                    <TableCell className="text-center tabular-nums text-amber-600">{c.membros_sinteticos}</TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">{c.membros_reais + c.membros_sinteticos}</TableCell>
                    <TableCell className="text-center tabular-nums">{c.relatorios_reais}</TableCell>
                    <TableCell className="text-center tabular-nums text-amber-600">{c.relatorios_sinteticos}</TableCell>
                    <TableCell className="text-center tabular-nums font-semibold">{c.relatorios_reais + c.relatorios_sinteticos}</TableCell>
                  </TableRow>
                );
              })}
              {/* Total row */}
              <TableRow className="bg-muted font-bold border-t-2">
                <TableCell>TOTAL GLOBAL</TableCell>
                <TableCell className="text-center tabular-nums">{totals.celulasReais}</TableCell>
                <TableCell className="text-center tabular-nums text-amber-600">{totals.celulasSinteticas}</TableCell>
                <TableCell className="text-center tabular-nums">{totals.celulasReais + totals.celulasSinteticas}</TableCell>
                <TableCell className="text-center tabular-nums">{totals.membrosReais}</TableCell>
                <TableCell className="text-center tabular-nums text-amber-600">{totals.membrosSinteticos}</TableCell>
                <TableCell className="text-center tabular-nums">{totals.membrosReais + totals.membrosSinteticos}</TableCell>
                <TableCell className="text-center tabular-nums">{totals.relatoriosReais}</TableCell>
                <TableCell className="text-center tabular-nums text-amber-600">{totals.relatoriosSinteticos}</TableCell>
                <TableCell className="text-center tabular-nums">{totals.relatoriosReais + totals.relatoriosSinteticos}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Consistency check */}
        <div className="mt-4 space-y-2">
          {(() => {
            const sumCelulas = data.reduce((s, c) => s + c.celulas_reais + c.celulas_sinteticas, 0);
            const totalCelulas = totals.celulasReais + totals.celulasSinteticas;
            const celulasPass = sumCelulas === totalCelulas;

            const sumMembros = data.reduce((s, c) => s + c.membros_reais + c.membros_sinteticos, 0);
            const totalMembros = totals.membrosReais + totals.membrosSinteticos;
            const membrosPass = sumMembros === totalMembros;

            return (
              <>
                <div className="flex items-center gap-2 text-sm">
                  {celulasPass ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  <span>Células: soma campus ({sumCelulas}) = total ({totalCelulas})</span>
                  <Badge variant={celulasPass ? 'secondary' : 'destructive'} className="text-xs">
                    {celulasPass ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {membrosPass ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  <span>Membros: soma campus ({sumMembros}) = total ({totalMembros})</span>
                  <Badge variant={membrosPass ? 'secondary' : 'destructive'} className="text-xs">
                    {membrosPass ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
              </>
            );
          })()}
        </div>

        {campusWithSynthetic.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700">
              <FlaskConical className="h-4 w-4 inline mr-1" />
              {campusWithSynthetic.length} campus com dados sintéticos: {campusWithSynthetic.map(c => c.campo_nome).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
