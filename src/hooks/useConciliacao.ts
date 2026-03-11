import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { toast } from 'sonner';

export interface FinConciliacao {
  id: string;
  campo_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  saldo_inicial: number;
  saldo_final: number;
  banco: string | null;
  conta: string | null;
  total_itens: number;
  total_conciliados: number;
  total_pendentes: number;
  total_divergentes: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinExtratoItem {
  id: string;
  conciliacao_id: string;
  campo_id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: string;
  saldo: number | null;
  status_conciliacao: string;
  conta_pagar_id: string | null;
  conta_receber_id: string | null;
  match_score: number | null;
  match_sugerido_label: string | null;
  conciliado_por: string | null;
  conciliado_at: string | null;
  justificativa_ignorar: string | null;
  created_at: string;
}

// ── Conciliacoes list ──
export function useFinConciliacoes() {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_conciliacoes', campoId, isGlobal],
    queryFn: async () => {
      let q = (supabase as any).from('fin_conciliacoes').select('*').order('created_at', { ascending: false });
      if (!isGlobal && campoId) q = q.eq('campo_id', campoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinConciliacao[];
    },
  });
}

// ── Single conciliacao with items ──
export function useFinConciliacaoDetail(id: string | null) {
  return useQuery({
    queryKey: ['fin_conciliacao_detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: conc, error: e1 } = await (supabase as any)
        .from('fin_conciliacoes').select('*').eq('id', id).single();
      if (e1) throw e1;

      const { data: items, error: e2 } = await (supabase as any)
        .from('fin_extrato_items').select('*').eq('conciliacao_id', id).order('data', { ascending: true });
      if (e2) throw e2;

      return { conciliacao: conc as FinConciliacao, items: items as FinExtratoItem[] };
    },
  });
}

// ── Mutations ──
export function useFinConciliacaoMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['fin_conciliacoes'] });
    qc.invalidateQueries({ queryKey: ['fin_conciliacao_detail'] });
  };

  const createConciliacao = useMutation({
    mutationFn: async (values: {
      campo_id: string;
      periodo_inicio: string;
      periodo_fim: string;
      saldo_inicial: number;
      saldo_final: number;
      banco?: string;
      conta?: string;
      items: Omit<FinExtratoItem, 'id' | 'conciliacao_id' | 'created_at'>[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { items, ...concData } = values;

      // ── Deduplication: check existing items by data+valor+descricao ──
      const { data: existingItems } = await (supabase as any)
        .from('fin_extrato_items')
        .select('data, valor, descricao')
        .eq('campo_id', values.campo_id);

      const existingSet = new Set(
        (existingItems || []).map((e: any) => `${e.data}|${Number(e.valor).toFixed(2)}|${e.descricao}`)
      );

      const uniqueItems = items.filter(it => {
        const key = `${it.data}|${Number(it.valor).toFixed(2)}|${it.descricao}`;
        return !existingSet.has(key);
      });

      const duplicateCount = items.length - uniqueItems.length;

      // Calculate totals from the actual items to insert
      const totalConciliados = uniqueItems.filter((i: any) => i.status_conciliacao === 'conciliado').length;
      const totalSugeridos = uniqueItems.filter((i: any) => i.status_conciliacao === 'sugerido').length;
      const totalPendentes = uniqueItems.filter((i: any) => i.status_conciliacao === 'pendente').length;

      // Create conciliation session
      const { data: conc, error: e1 } = await (supabase as any)
        .from('fin_conciliacoes')
        .insert({
          ...concData,
          total_itens: uniqueItems.length,
          total_conciliados: totalConciliados,
          total_pendentes: totalPendentes + totalSugeridos,
          status: totalPendentes + totalSugeridos === 0 && uniqueItems.length > 0 ? 'concluida' : 'em_andamento',
          created_by: user?.id || null,
        })
        .select()
        .single();
      if (e1) throw e1;

      // Insert items
      if (uniqueItems.length > 0) {
        const rows = uniqueItems.map(it => ({
          ...it,
          conciliacao_id: conc.id,
          campo_id: values.campo_id,
        }));
        const { error: e2 } = await (supabase as any).from('fin_extrato_items').insert(rows);
        if (e2) throw e2;

        // Auto-mark linked contas as paid/received for auto-conciliated items
        const today = new Date().toISOString().split('T')[0];
        for (const it of uniqueItems) {
          if ((it as any).status_conciliacao === 'conciliado') {
            if ((it as any).conta_pagar_id) {
              await (supabase as any).from('fin_contas_pagar')
                .update({ status: 'pago', data_pagamento: today })
                .eq('id', (it as any).conta_pagar_id);
            }
            if ((it as any).conta_receber_id) {
              await (supabase as any).from('fin_contas_receber')
                .update({ status: 'recebido', data_recebimento: today })
                .eq('id', (it as any).conta_receber_id);
            }
          }
        }
      }

      // Audit
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle();
        await (supabase as any).from('fin_audit_log').insert({
          tabela: 'fin_conciliacoes',
          registro_id: conc.id,
          acao: 'importou_extrato',
          campo_id: values.campo_id,
          user_id: user.id,
          user_name: profile?.name || user.email,
          detalhes: {
            total_itens: uniqueItems.length,
            duplicados_ignorados: duplicateCount,
            conciliados_auto: totalConciliados,
            sugeridos: totalSugeridos,
            pendentes: totalPendentes,
            banco: values.banco,
          },
        });
      }

      return { ...conc, _stats: { total: uniqueItems.length, duplicateCount, totalConciliados, totalSugeridos, totalPendentes } };
    },
    onSuccess: (data: any) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['fin_contas_pagar'] });
      qc.invalidateQueries({ queryKey: ['fin_contas_receber'] });
      qc.invalidateQueries({ queryKey: ['fin_dashboard_kpis'] });
      qc.invalidateQueries({ queryKey: ['fin_analytics'] });
      const s = data._stats;
      if (s) {
        const parts = [`${s.total} transação(ões) importada(s)`];
        if (s.duplicateCount > 0) parts.push(`${s.duplicateCount} duplicada(s) ignorada(s)`);
        if (s.totalConciliados > 0) parts.push(`${s.totalConciliados} conciliada(s) automaticamente`);
        if (s.totalSugeridos > 0) parts.push(`${s.totalSugeridos} sugestão(ões)`);
        if (s.totalPendentes > 0) parts.push(`${s.totalPendentes} pendente(s)`);
        toast.success(parts.join(' • '));
      } else {
        toast.success('Extrato importado com sucesso');
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const conciliarItem = useMutation({
    mutationFn: async (params: {
      itemId: string;
      contaPagarId?: string | null;
      contaReceberId?: string | null;
      status: 'conciliado' | 'ignorado';
      justificativa?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const update: any = {
        status_conciliacao: params.status,
        conciliado_por: user?.id || null,
        conciliado_at: new Date().toISOString(),
      };
      if (params.contaPagarId) update.conta_pagar_id = params.contaPagarId;
      if (params.contaReceberId) update.conta_receber_id = params.contaReceberId;
      if (params.justificativa) update.justificativa_ignorar = params.justificativa;

      const { error } = await (supabase as any)
        .from('fin_extrato_items').update(update).eq('id', params.itemId);
      if (error) throw error;

      // Also mark linked conta as paid/received if conciliado
      if (params.status === 'conciliado') {
        const today = new Date().toISOString().split('T')[0];
        if (params.contaPagarId) {
          await (supabase as any).from('fin_contas_pagar')
            .update({ status: 'pago', data_pagamento: today }).eq('id', params.contaPagarId);
        }
        if (params.contaReceberId) {
          await (supabase as any).from('fin_contas_receber')
            .update({ status: 'recebido', data_recebimento: today }).eq('id', params.contaReceberId);
        }
      }
    },
    onSuccess: () => { invalidate(); toast.success('Item conciliado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateConciliacaoTotals = useMutation({
    mutationFn: async (concId: string) => {
      const { data: items } = await (supabase as any)
        .from('fin_extrato_items').select('status_conciliacao').eq('conciliacao_id', concId);
      if (!items) return;

      const total = items.length;
      const conciliados = items.filter((i: any) => i.status_conciliacao === 'conciliado').length;
      const pendentes = items.filter((i: any) => i.status_conciliacao === 'pendente' || i.status_conciliacao === 'sugerido').length;
      const divergentes = items.filter((i: any) => i.status_conciliacao === 'divergente').length;

      const status = pendentes === 0 && divergentes === 0 ? 'concluida' : 'em_andamento';

      await (supabase as any).from('fin_conciliacoes').update({
        total_conciliados: conciliados,
        total_pendentes: pendentes,
        total_divergentes: divergentes,
        status,
      }).eq('id', concId);
    },
    onSuccess: () => invalidate(),
  });

  const deleteConciliacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fin_conciliacoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Conciliação excluída'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { createConciliacao, conciliarItem, updateConciliacaoTotals, deleteConciliacao };
}

// ── Matching engine ──
export interface MatchCandidate {
  id: string;
  type: 'pagar' | 'receber';
  descricao: string;
  valor: number;
  data: string;
  score: number;
}

export function matchExtratoItem(
  item: { descricao: string; valor: number; data: string; tipo: string },
  contasPagar: { id: string; descricao: string; valor: number; data_vencimento: string; status: string; fornecedor?: { nome: string } | null }[],
  contasReceber: { id: string; descricao: string; valor: number; data_prevista: string; status: string; origem?: string | null }[],
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  const absVal = Math.abs(item.valor);
  const itemDate = new Date(item.data).getTime();
  const descLower = item.descricao.toLowerCase();

  // Match against contas a pagar (for debits)
  if (item.tipo === 'saida' || item.valor < 0) {
    for (const cp of contasPagar) {
      if (cp.status === 'pago') continue;
      let score = 0;
      // Value match
      const valDiff = Math.abs(Number(cp.valor) - absVal);
      if (valDiff === 0) score += 50;
      else if (valDiff < absVal * 0.02) score += 30;
      else if (valDiff < absVal * 0.1) score += 10;
      else continue; // too different

      // Date proximity
      const cpDate = new Date(cp.data_vencimento).getTime();
      const daysDiff = Math.abs(cpDate - itemDate) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) score += 30;
      else if (daysDiff <= 7) score += 20;
      else if (daysDiff <= 30) score += 5;

      // Description similarity
      const cpDesc = cp.descricao.toLowerCase();
      const fornNome = cp.fornecedor?.nome?.toLowerCase() || '';
      if (descLower.includes(cpDesc) || cpDesc.includes(descLower)) score += 15;
      if (fornNome && descLower.includes(fornNome)) score += 15;

      if (score >= 30) {
        candidates.push({ id: cp.id, type: 'pagar', descricao: cp.descricao, valor: Number(cp.valor), data: cp.data_vencimento, score });
      }
    }
  }

  // Match against contas a receber (for credits)
  if (item.tipo === 'entrada' || item.valor > 0) {
    for (const cr of contasReceber) {
      if (cr.status === 'recebido') continue;
      let score = 0;
      const valDiff = Math.abs(Number(cr.valor) - absVal);
      if (valDiff === 0) score += 50;
      else if (valDiff < absVal * 0.02) score += 30;
      else if (valDiff < absVal * 0.1) score += 10;
      else continue;

      const crDate = new Date(cr.data_prevista).getTime();
      const daysDiff = Math.abs(crDate - itemDate) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) score += 30;
      else if (daysDiff <= 7) score += 20;
      else if (daysDiff <= 30) score += 5;

      const crDesc = cr.descricao.toLowerCase();
      if (descLower.includes(crDesc) || crDesc.includes(descLower)) score += 15;
      if (cr.origem && descLower.includes(cr.origem.toLowerCase())) score += 15;

      if (score >= 30) {
        candidates.push({ id: cr.id, type: 'receber', descricao: cr.descricao, valor: Number(cr.valor), data: cr.data_prevista, score });
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}
