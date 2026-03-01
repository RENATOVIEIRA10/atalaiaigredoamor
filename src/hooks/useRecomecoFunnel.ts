import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCelulas } from '@/hooks/useCelulas';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';

export interface RecomecoEncRow {
  id: string;
  nova_vida_id: string;
  celula_id: string;
  rede_id: string | null;
  status: string;
  data_encaminhamento: string;
  contatado_at: string | null;
  integrado_at: string | null;
  promovido_membro_at: string | null;
  membro_id: string | null;
  nova_vida?: { id: string; nome: string; bairro: string | null; cidade: string | null; whatsapp: string | null };
}

export interface RecomecoKPIs {
  encaminhadas: number;
  pendentes: number;
  contatadas: number;
  integradas: number;
  promovidas: number;
  sem_resposta: number;
  taxaContato: number;
  taxaIntegracao: number;
  taxaConversao: number;
  tempoMedioContato: number | null; // days
  tempoMedioIntegracao: number | null; // days
}

export interface RecomecoByGroup {
  groupId: string;
  groupName: string;
  kpis: RecomecoKPIs;
  encaminhamentos: RecomecoEncRow[];
}

function calcKPIs(rows: RecomecoEncRow[]): RecomecoKPIs {
  const encaminhadas = rows.length;
  const pendentes = rows.filter(r => r.status === 'pendente').length;
  const contatadas = rows.filter(r => ['contatado', 'integrado'].includes(r.status) || r.contatado_at).length;
  const integradas = rows.filter(r => r.status === 'integrado' || r.integrado_at).length;
  const promovidas = rows.filter(r => r.promovido_membro_at || r.membro_id).length;
  const sem_resposta = rows.filter(r => r.status === 'sem_resposta').length;

  const taxaContato = encaminhadas > 0 ? Math.round((contatadas / encaminhadas) * 100) : 0;
  const taxaIntegracao = encaminhadas > 0 ? Math.round((integradas / encaminhadas) * 100) : 0;
  const taxaConversao = encaminhadas > 0 ? Math.round((promovidas / encaminhadas) * 100) : 0;

  // avg time to contact
  const contactTimes = rows
    .filter(r => r.contatado_at && r.data_encaminhamento)
    .map(r => (new Date(r.contatado_at!).getTime() - new Date(r.data_encaminhamento).getTime()) / (1000 * 60 * 60 * 24));
  const tempoMedioContato = contactTimes.length > 0 ? Math.round(contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length * 10) / 10 : null;

  const integTimes = rows
    .filter(r => r.integrado_at && r.data_encaminhamento)
    .map(r => (new Date(r.integrado_at!).getTime() - new Date(r.data_encaminhamento).getTime()) / (1000 * 60 * 60 * 24));
  const tempoMedioIntegracao = integTimes.length > 0 ? Math.round(integTimes.reduce((a, b) => a + b, 0) / integTimes.length * 10) / 10 : null;

  return { encaminhadas, pendentes, contatadas, integradas, promovidas, sem_resposta, taxaContato, taxaIntegracao, taxaConversao, tempoMedioContato, tempoMedioIntegracao };
}

function useAllEncaminhamentos(campoId?: string | null) {
  return useQuery({
    queryKey: ['recomeco-funnel-all', campoId],
    queryFn: async () => {
      let q = supabase
        .from('encaminhamentos_recomeco')
        .select(`*, nova_vida:novas_vidas(id, nome, bairro, cidade, whatsapp)`)
        .neq('status', 'devolvido')
        .order('data_encaminhamento', { ascending: false });
      if (campoId) q = q.eq('campo_id', campoId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as RecomecoEncRow[];
    },
    staleTime: 30_000,
  });
}

// scope: 'coordenacao' | 'rede' | 'all'
export function useRecomecoFunnel(scopeType: 'coordenacao' | 'rede' | 'all', scopeId?: string, campoId?: string | null) {
  const { data: allEnc, isLoading: encLoading } = useAllEncaminhamentos(campoId);
  const { data: celulas } = useCelulas();
  const { data: coordenacoes } = useCoordenacoes();

  // Derive celula->coordenacao->rede mapping
  const coordMap = new Map<string, { name: string; rede_id: string }>();
  (coordenacoes || []).forEach(c => {
    coordMap.set(c.id, { name: c.name, rede_id: c.rede_id });
  });

  const celulaMap = new Map<string, { coordenacao_id: string; rede_id: string | null; celula_name: string }>();
  (celulas || []).forEach(c => {
    // Derive rede_id: prefer celula.rede_id, fallback to coordenacao.rede_id (single source of truth)
    const effectiveRedeId = c.rede_id || coordMap.get(c.coordenacao_id)?.rede_id || null;
    celulaMap.set(c.id, { coordenacao_id: c.coordenacao_id, rede_id: effectiveRedeId, celula_name: c.name });
  });

  // Filter by scope — always derive rede from coordenação hierarchy to avoid NULL rede_id gaps
  let filtered = allEnc || [];
  if (scopeType === 'coordenacao' && scopeId) {
    const coordCelulaIds = new Set((celulas || []).filter(c => c.coordenacao_id === scopeId).map(c => c.id));
    filtered = filtered.filter(e => coordCelulaIds.has(e.celula_id));
  } else if (scopeType === 'rede' && scopeId) {
    const redeCelulaIds = new Set((celulas || []).filter(c => {
      const effectiveRedeId = c.rede_id || coordMap.get(c.coordenacao_id)?.rede_id;
      return effectiveRedeId === scopeId;
    }).map(c => c.id));
    filtered = filtered.filter(e => redeCelulaIds.has(e.celula_id));
  }

  const totalKPIs = calcKPIs(filtered);

  // Group by cell (for coordenador)
  const byCelula: RecomecoByGroup[] = [];
  const celGroups = new Map<string, RecomecoEncRow[]>();
  filtered.forEach(e => {
    const arr = celGroups.get(e.celula_id) || [];
    arr.push(e);
    celGroups.set(e.celula_id, arr);
  });
  celGroups.forEach((rows, celId) => {
    byCelula.push({
      groupId: celId,
      groupName: celulaMap.get(celId)?.celula_name || 'Célula',
      kpis: calcKPIs(rows),
      encaminhamentos: rows,
    });
  });

  // Group by coordenacao (for rede leader)
  const byCoordenacao: RecomecoByGroup[] = [];
  const coordGroups = new Map<string, RecomecoEncRow[]>();
  filtered.forEach(e => {
    const cel = celulaMap.get(e.celula_id);
    const coordId = cel?.coordenacao_id || 'unknown';
    const arr = coordGroups.get(coordId) || [];
    arr.push(e);
    coordGroups.set(coordId, arr);
  });
  coordGroups.forEach((rows, coordId) => {
    byCoordenacao.push({
      groupId: coordId,
      groupName: coordMap.get(coordId)?.name || 'Coordenação',
      kpis: calcKPIs(rows),
      encaminhamentos: rows,
    });
  });

  // Group by rede (for pastor)
  const byRede: RecomecoByGroup[] = [];
  const redeGroups = new Map<string, RecomecoEncRow[]>();
  filtered.forEach(e => {
    const cel = celulaMap.get(e.celula_id);
    const coord = cel ? coordMap.get(cel.coordenacao_id) : null;
    const redeId = cel?.rede_id || coord?.rede_id || 'unknown';
    const arr = redeGroups.get(redeId) || [];
    arr.push(e);
    redeGroups.set(redeId, arr);
  });

  // Pending alerts
  const pendingOver3Days = filtered.filter(e => {
    if (e.status !== 'pendente') return false;
    const days = (Date.now() - new Date(e.data_encaminhamento).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 3;
  });
  const noResponseOver7Days = filtered.filter(e => {
    if (e.status !== 'sem_resposta') return false;
    const days = (Date.now() - new Date(e.data_encaminhamento).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 7;
  });

  return {
    isLoading: encLoading,
    totalKPIs,
    byCelula: byCelula.sort((a, b) => b.kpis.encaminhadas - a.kpis.encaminhadas),
    byCoordenacao: byCoordenacao.sort((a, b) => b.kpis.encaminhadas - a.kpis.encaminhadas),
    byRede,
    allEncaminhamentos: filtered,
    pendingOver3Days,
    noResponseOver7Days,
    celulaMap,
    coordMap,
  };
}
