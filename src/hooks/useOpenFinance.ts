import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDemoScope } from './useDemoScope';
import { toast } from 'sonner';

export interface BankConnection {
  id: string;
  campo_id: string;
  pluggy_item_id: string;
  bank_name: string | null;
  account_type: string | null;
  account_number: string | null;
  status: string;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

async function invokeProxy(action: string, body: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('open-finance-proxy', {
    body: { action, ...body },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useBankConnections() {
  const { campoId } = useDemoScope();
  return useQuery({
    queryKey: ['fin_bank_connections', campoId],
    enabled: !!campoId,
    queryFn: async () => {
      const data = await invokeProxy('list_connections', { campoId });
      return (data?.connections || []) as BankConnection[];
    },
  });
}

export function useOpenFinanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['fin_bank_connections'] });
    qc.invalidateQueries({ queryKey: ['fin_conciliacoes'] });
    qc.invalidateQueries({ queryKey: ['fin_conciliacao_detail'] });
  };

  const getConnectToken = useMutation({
    mutationFn: async (itemId?: string) => {
      const data = await invokeProxy('create_connect_token', { itemId });
      return data.accessToken as string;
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao gerar token de conexão'),
  });

  const saveConnection = useMutation({
    mutationFn: async (params: { campoId: string; itemId: string }) => {
      return await invokeProxy('save_connection', params);
    },
    onSuccess: () => { invalidate(); toast.success('Conta bancária conectada!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const syncTransactions = useMutation({
    mutationFn: async (params: { connectionId: string; campoId: string; dateFrom?: string; dateTo?: string }) => {
      return await invokeProxy('sync_transactions', params);
    },
    onSuccess: (data) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['fin_contas_pagar'] });
      qc.invalidateQueries({ queryKey: ['fin_contas_receber'] });
      toast.success(`${data.totalTransactions} transações sincronizadas (${data.conciliados} conciliadas automaticamente)`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      return await invokeProxy('delete_connection', { connectionId });
    },
    onSuccess: () => { invalidate(); toast.success('Conexão removida'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { getConnectToken, saveConnection, syncTransactions, deleteConnection };
}
