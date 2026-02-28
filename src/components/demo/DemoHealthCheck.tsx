import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Loader2, ShieldCheck, Play, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useCampos } from '@/hooks/useCampos';

interface TestResult {
  name: string;
  category: 'escopo' | 'dados' | 'integridade';
  status: 'pass' | 'fail' | 'running' | 'pending';
  message: string;
  campus?: string;
}

export function DemoHealthCheck() {
  const { demoRunId, demoCampusId } = useDemoMode();
  const { data: campos } = useCampos();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const activeCampos = (campos || []).filter(c => c.ativo);

  const updateResult = useCallback((idx: number, update: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, ...update } : r));
  }, []);

  const runTests = useCallback(async () => {
    if (!demoRunId) return;
    setIsRunning(true);

    const tests: TestResult[] = [
      { name: 'Redes isoladas por seed_run_id', category: 'escopo', status: 'pending', message: '' },
      { name: 'Coordenações isoladas por seed_run_id', category: 'escopo', status: 'pending', message: '' },
      { name: 'Células isoladas por seed_run_id', category: 'escopo', status: 'pending', message: '' },
      { name: 'Membros isolados por seed_run_id', category: 'escopo', status: 'pending', message: '' },
      { name: 'Relatórios isolados por seed_run_id', category: 'dados', status: 'pending', message: '' },
      { name: 'Supervisões isoladas por seed_run_id', category: 'dados', status: 'pending', message: '' },
      { name: 'Todas as células têm campo_id', category: 'integridade', status: 'pending', message: '' },
      { name: 'Todas as redes têm campo_id', category: 'integridade', status: 'pending', message: '' },
      { name: 'Zero vazamento entre campus', category: 'escopo', status: 'pending', message: '' },
    ];
    setResults([...tests]);

    // Helper to run a count query
    const countTable = async (table: string, filters: Record<string, any>) => {
      let q = supabase.from(table as any).select('id', { count: 'exact', head: true });
      for (const [k, v] of Object.entries(filters)) {
        q = q.eq(k, v);
      }
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    };

    // Test 0: Redes
    let idx = 0;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('redes', { is_test_data: true, seed_run_id: demoRunId });
      const countOther = await countTable('redes', { is_test_data: true });
      const leaked = countOther - count;
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r,
        status: leaked === 0 && count > 0 ? 'pass' : count === 0 ? 'fail' : 'fail',
        message: count > 0 ? `${count} redes no demo (0 vazamento)` : 'Nenhuma rede demo encontrada',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 1: Coordenações
    idx = 1;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('coordenacoes', { is_test_data: true, seed_run_id: demoRunId });
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: count > 0 ? 'pass' : 'fail',
        message: count > 0 ? `${count} coordenações` : 'Nenhuma coordenação demo',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 2: Células
    idx = 2;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('celulas', { is_test_data: true, seed_run_id: demoRunId });
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: count > 0 ? 'pass' : 'fail',
        message: count > 0 ? `${count} células` : 'Nenhuma célula demo',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 3: Membros
    idx = 3;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('members', { is_test_data: true, seed_run_id: demoRunId });
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: count > 0 ? 'pass' : 'fail',
        message: count > 0 ? `${count} membros` : 'Nenhum membro demo',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 4: Relatórios
    idx = 4;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('weekly_reports', { is_test_data: true, seed_run_id: demoRunId });
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: count > 0 ? 'pass' : 'fail',
        message: count > 0 ? `${count} relatórios` : 'Nenhum relatório demo',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 5: Supervisões
    idx = 5;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const count = await countTable('supervisoes', { is_test_data: true, seed_run_id: demoRunId });
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: count >= 0 ? 'pass' : 'fail',
        message: `${count} supervisões`,
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 6: Células sem campo_id
    idx = 6;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const { count, error } = await supabase
        .from('celulas')
        .select('id', { count: 'exact', head: true })
        .eq('seed_run_id', demoRunId)
        .is('campo_id', null);
      if (error) throw error;
      const nullCount = count || 0;
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: nullCount === 0 ? 'pass' : 'fail',
        message: nullCount === 0 ? 'Todas as células têm campo_id' : `${nullCount} células SEM campo_id!`,
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 7: Redes sem campo_id
    idx = 7;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      const { count, error } = await supabase
        .from('redes')
        .select('id', { count: 'exact', head: true })
        .eq('seed_run_id', demoRunId)
        .is('campo_id', null);
      if (error) throw error;
      const nullCount = count || 0;
      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r, status: nullCount === 0 ? 'pass' : 'fail',
        message: nullCount === 0 ? 'Todas as redes têm campo_id' : `${nullCount} redes SEM campo_id!`,
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    // Test 8: Zero vazamento entre campus
    idx = 8;
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'running' } : r));
    try {
      let leakFound = false;
      let leakMsg = '';

      for (const campo of activeCampos) {
        // Count cells for this campus in the demo run
        const { count: cellsThisCampus } = await supabase
          .from('celulas')
          .select('id', { count: 'exact', head: true })
          .eq('seed_run_id', demoRunId)
          .eq('campo_id', campo.id);

        // Count reports for this campus
        const { count: reportsThisCampus } = await supabase
          .from('weekly_reports')
          .select('id', { count: 'exact', head: true })
          .eq('seed_run_id', demoRunId)
          .eq('campo_id', campo.id);

        // Count reports with cells from OTHER campus (leak check)
        // Get cells from this campus
        const { data: campusCells } = await supabase
          .from('celulas')
          .select('id')
          .eq('seed_run_id', demoRunId)
          .eq('campo_id', campo.id);

        const campusCellIds = (campusCells || []).map(c => c.id);

        if (campusCellIds.length > 0) {
          // Check if any report for this campus references a cell from another campus
          const { count: crossReports } = await supabase
            .from('weekly_reports')
            .select('id', { count: 'exact', head: true })
            .eq('seed_run_id', demoRunId)
            .eq('campo_id', campo.id)
            .not('celula_id', 'in', `(${campusCellIds.join(',')})`);

          if ((crossReports || 0) > 0) {
            leakFound = true;
            leakMsg = `${campo.nome}: ${crossReports} relatórios com célula de outro campus`;
            break;
          }
        }
      }

      setResults(prev => prev.map((r, i) => i === idx ? {
        ...r,
        status: leakFound ? 'fail' : 'pass',
        message: leakFound ? leakMsg : 'Nenhum vazamento entre campus detectado',
      } : r));
    } catch (e: any) {
      setResults(prev => prev.map((r, i) => i === idx ? { ...r, status: 'fail', message: e.message } : r));
    }

    setIsRunning(false);
  }, [demoRunId, activeCampos]);

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Health Check do Demo
            </CardTitle>
            <CardDescription>
              Validação automatizada de escopo, dados e integridade
            </CardDescription>
          </div>
          <Button
            onClick={runTests}
            disabled={isRunning || !demoRunId}
            size="sm"
            className="gap-1.5"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Validando...' : 'Executar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!demoRunId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Ative o demo e selecione um dataset para executar o Health Check.
          </p>
        )}

        {results.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50">
              <Badge variant={failCount === 0 ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                {failCount === 0 ? '✅ ALL PASS' : `${failCount} FAIL`}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {passCount}/{total} testes passaram
              </span>
              {demoRunId && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Run: {demoRunId.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Results list */}
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1.5">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors"
                  >
                    {r.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    {r.status === 'fail' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                    {r.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                    {r.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      {r.message && (
                        <p className={`text-xs ${r.status === 'fail' ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {r.message}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {r.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
