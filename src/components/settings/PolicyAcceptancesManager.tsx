import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { POLICY_VERSION } from '@/lib/policyVersion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AcceptanceRow {
  access_key_id: string;
  code: string;
  scope_type: string;
  entity_name: string;
  accepted_at: string | null;
  policy_version: string | null;
}

export function PolicyAcceptancesManager() {
  const { data, isLoading } = useQuery({
    queryKey: ['policy-acceptances-admin'],
    queryFn: async () => {
      // Get all active access keys
      const { data: keys, error } = await supabase
        .from('access_keys')
        .select('id, code, scope_type, scope_id')
        .eq('active', true)
        .order('scope_type');

      if (error) throw error;

      // Get all acceptances for current version
      const { data: acceptances } = await supabase
        .from('policy_acceptances')
        .select('access_key_id, policy_version, accepted_at')
        .eq('policy_version', POLICY_VERSION);

      const acceptanceMap = new Map(
        (acceptances || []).map(a => [a.access_key_id, a])
      );

      // Enrich with entity names
      const rows: AcceptanceRow[] = [];
      for (const key of keys || []) {
        let entityName = key.scope_type;
        if (key.scope_type === 'admin') entityName = 'Administrador';
        else if (key.scope_type === 'pastor') entityName = 'Pastor Sênior';
        else if (key.scope_id) {
          if (key.scope_type === 'celula') {
            const { data: c } = await supabase.from('celulas').select('name').eq('id', key.scope_id).single();
            entityName = c?.name || 'Célula';
          } else if (key.scope_type === 'coordenacao') {
            const { data: c } = await supabase.from('coordenacoes').select('name').eq('id', key.scope_id).single();
            entityName = c?.name || 'Coordenação';
          } else if (key.scope_type === 'rede') {
            const { data: r } = await supabase.from('redes').select('name').eq('id', key.scope_id).single();
            entityName = r?.name || 'Rede';
          } else if (key.scope_type === 'supervisor') {
            entityName = 'Supervisor';
          }
        }

        const acceptance = acceptanceMap.get(key.id);
        rows.push({
          access_key_id: key.id,
          code: key.code,
          scope_type: key.scope_type,
          entity_name: entityName,
          accepted_at: acceptance?.accepted_at || null,
          policy_version: acceptance?.policy_version || null,
        });
      }

      return rows;
    },
  });

  const accepted = data?.filter(r => r.accepted_at) || [];
  const pending = data?.filter(r => !r.accepted_at) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Privacidade – Aceites de Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Privacidade – Aceites de Onboarding</CardTitle>
        <CardDescription>
          Versão atual: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{POLICY_VERSION}</code>
          {' · '}
          <span className="text-green-600">{accepted.length} aceitos</span>
          {' · '}
          <span className="text-amber-600">{pending.length} pendentes</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Pending first */}
          {pending.map(row => (
            <div key={row.access_key_id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <XCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{row.entity_name}</p>
                <p className="text-xs text-muted-foreground">{row.scope_type} · <code className="text-[10px]">{row.code}</code></p>
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">Pendente</Badge>
            </div>
          ))}
          {/* Accepted */}
          {accepted.map(row => (
            <div key={row.access_key_id} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{row.entity_name}</p>
                <p className="text-xs text-muted-foreground">{row.scope_type} · <code className="text-[10px]">{row.code}</code></p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {row.accepted_at ? format(new Date(row.accepted_at), 'dd/MM/yyyy HH:mm') : ''}
              </span>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma chave de acesso ativa.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
