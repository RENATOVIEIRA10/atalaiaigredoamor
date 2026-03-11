import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Types ──
export interface FinCategoria {
  id: string;
  nome: string;
  tipo: 'despesa' | 'receita' | 'ambos';
  ativa: boolean;
}

export interface FinCentroCusto {
  id: string;
  nome: string;
  descricao: string | null;
  campo_id: string | null;
  ativo: boolean;
}

export interface FinFornecedor {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  categoria: string | null;
  cidade: string | null;
  observacoes: string | null;
  campo_id: string | null;
  ativo: boolean;
}

export interface FinContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: 'pendente' | 'pago' | 'vencido';
  categoria_id: string | null;
  fornecedor_id: string | null;
  centro_custo_id: string | null;
  campo_id: string;
  observacoes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  categoria?: { nome: string } | null;
  fornecedor?: { nome: string } | null;
  centro_custo?: { nome: string } | null;
  campo?: { nome: string } | null;
}

export interface FinContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_prevista: string;
  data_recebimento: string | null;
  status: 'pendente' | 'recebido' | 'atrasado';
  categoria_id: string | null;
  centro_custo_id: string | null;
  campo_id: string;
  origem: string | null;
  observacoes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  categoria?: { nome: string } | null;
  centro_custo?: { nome: string } | null;
  campo?: { nome: string } | null;
}

// ── Audit helper ──
async function logAudit(tabela: string, registro_id: string, acao: string, campo_id: string | null, detalhes?: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle();
  await (supabase as any).from('fin_audit_log').insert({
    tabela,
    registro_id,
    acao,
    campo_id,
    user_id: user.id,
    user_name: profile?.name || user.email,
    detalhes: detalhes || {},
  });
}

// ── Categorias ──
export function useFinCategorias() {
  return useQuery({
    queryKey: ['fin_categorias'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('fin_categorias').select('*').eq('ativa', true).order('nome');
      if (error) throw error;
      return data as FinCategoria[];
    },
  });
}

// ── Centros de Custo ──
export function useFinCentrosCusto() {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_centros_custo', campoId, isGlobal],
    queryFn: async () => {
      let q = (supabase as any).from('fin_centros_custo').select('*').eq('ativo', true).order('nome');
      if (!isGlobal && campoId) q = q.or(`campo_id.eq.${campoId},campo_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinCentroCusto[];
    },
  });
}

// ── Fornecedores ──
export function useFinFornecedores() {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_fornecedores', campoId, isGlobal],
    queryFn: async () => {
      let q = (supabase as any).from('fin_fornecedores').select('*').eq('ativo', true).order('nome');
      if (!isGlobal && campoId) q = q.or(`campo_id.eq.${campoId},campo_id.is.null`);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinFornecedor[];
    },
  });
}

// ── Contas a Pagar ──
export function useFinContasPagar(filters?: { status?: string; periodo?: { from: Date; to: Date } }) {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_contas_pagar', campoId, isGlobal, filters?.status, filters?.periodo?.from?.toISOString(), filters?.periodo?.to?.toISOString()],
    queryFn: async () => {
      let q = (supabase as any)
        .from('fin_contas_pagar')
        .select('*, categoria:fin_categorias(nome), fornecedor:fin_fornecedores(nome), centro_custo:fin_centros_custo(nome), campo:campos(nome)')
        .order('data_vencimento', { ascending: true });
      if (!isGlobal && campoId) q = q.eq('campo_id', campoId);
      if (filters?.status && filters.status !== 'todos') q = q.eq('status', filters.status);
      if (filters?.periodo?.from) q = q.gte('data_vencimento', filters.periodo.from.toISOString().split('T')[0]);
      if (filters?.periodo?.to) q = q.lte('data_vencimento', filters.periodo.to.toISOString().split('T')[0]);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinContaPagar[];
    },
  });
}

export function useFinContaPagarMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fin_contas_pagar'] });

  const create = useMutation({
    mutationFn: async (values: Partial<FinContaPagar>) => {
      const { data, error } = await (supabase as any).from('fin_contas_pagar').insert(values).select().single();
      if (error) throw error;
      await logAudit('fin_contas_pagar', data.id, 'criou', values.campo_id || null, { descricao: values.descricao });
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Conta criada'); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: Partial<FinContaPagar> & { id: string }) => {
      const { data, error } = await (supabase as any).from('fin_contas_pagar').update(values).eq('id', id).select().single();
      if (error) throw error;
      await logAudit('fin_contas_pagar', id, 'editou', data.campo_id, { changes: values });
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Conta atualizada'); },
    onError: (e: any) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await (supabase as any).from('fin_contas_pagar').update({ status: 'pago', data_pagamento: today }).eq('id', id).select().single();
      if (error) throw error;
      await logAudit('fin_contas_pagar', id, 'marcou_pago', data.campo_id);
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Conta marcada como paga'); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fin_contas_pagar').delete().eq('id', id);
      if (error) throw error;
      await logAudit('fin_contas_pagar', id, 'excluiu', null);
    },
    onSuccess: () => { invalidate(); toast.success('Conta excluída'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, markPaid, remove };
}

// ── Contas a Receber ──
export function useFinContasReceber(filters?: { status?: string; periodo?: { from: Date; to: Date } }) {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_contas_receber', campoId, isGlobal, filters?.status, filters?.periodo?.from?.toISOString(), filters?.periodo?.to?.toISOString()],
    queryFn: async () => {
      let q = (supabase as any)
        .from('fin_contas_receber')
        .select('*, categoria:fin_categorias(nome), centro_custo:fin_centros_custo(nome), campo:campos(nome)')
        .order('data_prevista', { ascending: true });
      if (!isGlobal && campoId) q = q.eq('campo_id', campoId);
      if (filters?.status && filters.status !== 'todos') q = q.eq('status', filters.status);
      if (filters?.periodo?.from) q = q.gte('data_prevista', filters.periodo.from.toISOString().split('T')[0]);
      if (filters?.periodo?.to) q = q.lte('data_prevista', filters.periodo.to.toISOString().split('T')[0]);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinContaReceber[];
    },
  });
}

export function useFinContaReceberMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fin_contas_receber'] });

  const create = useMutation({
    mutationFn: async (values: Partial<FinContaReceber>) => {
      const { data, error } = await (supabase as any).from('fin_contas_receber').insert(values).select().single();
      if (error) throw error;
      await logAudit('fin_contas_receber', data.id, 'criou', values.campo_id || null, { descricao: values.descricao });
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Recebível criado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: Partial<FinContaReceber> & { id: string }) => {
      const { data, error } = await (supabase as any).from('fin_contas_receber').update(values).eq('id', id).select().single();
      if (error) throw error;
      await logAudit('fin_contas_receber', id, 'editou', data.campo_id, { changes: values });
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Recebível atualizado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const markReceived = useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await (supabase as any).from('fin_contas_receber').update({ status: 'recebido', data_recebimento: today }).eq('id', id).select().single();
      if (error) throw error;
      await logAudit('fin_contas_receber', id, 'marcou_recebido', data.campo_id);
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Marcado como recebido'); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fin_contas_receber').delete().eq('id', id);
      if (error) throw error;
      await logAudit('fin_contas_receber', id, 'excluiu', null);
    },
    onSuccess: () => { invalidate(); toast.success('Recebível excluído'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, markReceived, remove };
}

// ── Fornecedor Mutations ──
export function useFinFornecedorMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fin_fornecedores'] });

  const create = useMutation({
    mutationFn: async (values: Partial<FinFornecedor>) => {
      const { data, error } = await (supabase as any).from('fin_fornecedores').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Fornecedor criado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: Partial<FinFornecedor> & { id: string }) => {
      const { data, error } = await (supabase as any).from('fin_fornecedores').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Fornecedor atualizado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fin_fornecedores').update({ ativo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Fornecedor desativado'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ── Centro de Custo Mutations ──
export function useFinCentroCustoMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fin_centros_custo'] });

  const create = useMutation({
    mutationFn: async (values: Partial<FinCentroCusto>) => {
      const { data, error } = await (supabase as any).from('fin_centros_custo').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Centro de custo criado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: Partial<FinCentroCusto> & { id: string }) => {
      const { data, error } = await (supabase as any).from('fin_centros_custo').update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Centro de custo atualizado'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update };
}

// ── Categoria Mutations ──
export function useFinCategoriaMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fin_categorias'] });

  const create = useMutation({
    mutationFn: async (values: Partial<FinCategoria>) => {
      const { data, error } = await (supabase as any).from('fin_categorias').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Categoria criada'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { create };
}

// ── Dashboard KPIs ──
export function useFinDashboardKPIs() {
  const { campoId, isGlobal } = useDemoScope();
  return useQuery({
    queryKey: ['fin_dashboard_kpis', campoId, isGlobal],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = today.slice(0, 7) + '-01';
      const monthEnd = new Date(new Date(monthStart).getFullYear(), new Date(monthStart).getMonth() + 1, 0).toISOString().split('T')[0];

      // Contas a pagar
      let qPagar = (supabase as any).from('fin_contas_pagar').select('valor, status, data_vencimento');
      if (!isGlobal && campoId) qPagar = qPagar.eq('campo_id', campoId);
      const { data: pagar } = await qPagar;

      // Contas a receber
      let qReceber = (supabase as any).from('fin_contas_receber').select('valor, status, data_prevista');
      if (!isGlobal && campoId) qReceber = qReceber.eq('campo_id', campoId);
      const { data: receber } = await qReceber;

      const contasPagar = (pagar || []) as any[];
      const contasReceber = (receber || []) as any[];

      const totalSaidasMes = contasPagar
        .filter((c: any) => c.status === 'pago' && c.data_vencimento >= monthStart && c.data_vencimento <= monthEnd)
        .reduce((s: number, c: any) => s + Number(c.valor), 0);

      const totalEntradasMes = contasReceber
        .filter((c: any) => c.status === 'recebido' && c.data_prevista >= monthStart && c.data_prevista <= monthEnd)
        .reduce((s: number, c: any) => s + Number(c.valor), 0);

      const contasPendentes = contasPagar.filter((c: any) => c.status === 'pendente');
      const contasVencidas = contasPagar.filter((c: any) => c.status === 'pendente' && c.data_vencimento < today);
      const contasProximas = contasPagar.filter((c: any) => {
        if (c.status !== 'pendente') return false;
        const d = new Date(c.data_vencimento);
        const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });

      const receberPendentes = contasReceber.filter((c: any) => c.status === 'pendente');
      const receberAtrasados = contasReceber.filter((c: any) => c.status === 'pendente' && c.data_prevista < today);

      const saldo = totalEntradasMes - totalSaidasMes;

      const totalPendentePagar = contasPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);
      const totalPendenteReceber = receberPendentes.reduce((s: number, c: any) => s + Number(c.valor), 0);

      return {
        saldo,
        totalEntradasMes,
        totalSaidasMes,
        contasVencidasCount: contasVencidas.length,
        contasVencidasTotal: contasVencidas.reduce((s: number, c: any) => s + Number(c.valor), 0),
        contasProximasCount: contasProximas.length,
        contasProximasTotal: contasProximas.reduce((s: number, c: any) => s + Number(c.valor), 0),
        receberAtrasadosCount: receberAtrasados.length,
        totalPendentePagar,
        totalPendenteReceber,
      };
    },
  });
}

// ── Audit Log ──
export function useFinAuditLog(registroId?: string) {
  return useQuery({
    queryKey: ['fin_audit_log', registroId],
    enabled: !!registroId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fin_audit_log')
        .select('*')
        .eq('registro_id', registroId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}
