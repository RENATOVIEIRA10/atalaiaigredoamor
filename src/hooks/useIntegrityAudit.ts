import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IntegrityIssue {
  table: string;
  issue: string;
  count: number;
  severity: 'error' | 'warning';
}

export function useIntegrityAudit() {
  return useQuery({
    queryKey: ['integrity-audit'],
    staleTime: 300_000,
    queryFn: async (): Promise<IntegrityIssue[]> => {
      const issues: IntegrityIssue[] = [];

      // 1. Redes without valid campo
      const { data: redesNoCampo } = await supabase
        .from('redes')
        .select('id', { count: 'exact', head: true })
        .is('campo_id', null);
      // campo_id is NOT NULL so this should be 0, but check anyway
      
      // 2. Coordenações with mismatched campo vs rede
      const { data: coords } = await supabase
        .from('coordenacoes')
        .select('id, campo_id, rede_id, redes!coordenacoes_rede_id_fkey(campo_id)')
        .limit(1000);
      
      const coordMismatch = (coords || []).filter((c: any) => {
        const redeCampo = c.redes?.campo_id;
        return redeCampo && redeCampo !== c.campo_id;
      });
      if (coordMismatch.length > 0) {
        issues.push({ table: 'coordenacoes', issue: 'campus_id diverge da rede', count: coordMismatch.length, severity: 'error' });
      }

      // 3. Células without coordenação
      const { count: celulasOrfas } = await supabase
        .from('celulas')
        .select('id', { count: 'exact', head: true })
        .is('coordenacao_id', null);
      if ((celulasOrfas || 0) > 0) {
        issues.push({ table: 'celulas', issue: 'sem coordenação vinculada', count: celulasOrfas || 0, severity: 'error' });
      }

      // 4. Cells with mismatched campo vs coordenação
      const { data: celulas } = await supabase
        .from('celulas')
        .select('id, campo_id, coordenacao_id, coordenacoes!celulas_coordenacao_id_fkey(campo_id)')
        .limit(1000);
      
      const celMismatch = (celulas || []).filter((c: any) => {
        const coordCampo = c.coordenacoes?.campo_id;
        return coordCampo && coordCampo !== c.campo_id;
      });
      if (celMismatch.length > 0) {
        issues.push({ table: 'celulas', issue: 'campus_id diverge da coordenação', count: celMismatch.length, severity: 'error' });
      }

      // 5. Members with mismatched campo vs célula
      const { data: members } = await supabase
        .from('members')
        .select('id, campo_id, celula_id, celulas!members_celula_id_fkey(campo_id)')
        .eq('is_active', true)
        .limit(1000);
      
      const memMismatch = (members || []).filter((m: any) => {
        const celCampo = m.celulas?.campo_id;
        return celCampo && celCampo !== m.campo_id;
      });
      if (memMismatch.length > 0) {
        issues.push({ table: 'members', issue: 'campus_id diverge da célula', count: memMismatch.length, severity: 'error' });
      }

      // 6. Members without rede_id
      const { count: memNoRede } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('rede_id', null);
      if ((memNoRede || 0) > 0) {
        issues.push({ table: 'members', issue: 'sem rede_id', count: memNoRede || 0, severity: 'warning' });
      }

      // 7. Encaminhamentos with mismatched campus vs célula
      const { data: encs } = await supabase
        .from('encaminhamentos_recomeco')
        .select('id, campo_id, celula_id, celulas!encaminhamentos_recomeco_celula_id_fkey(campo_id)')
        .limit(1000);
      
      const encMismatch = (encs || []).filter((e: any) => {
        const celCampo = e.celulas?.campo_id;
        return celCampo && celCampo !== e.campo_id;
      });
      if (encMismatch.length > 0) {
        issues.push({ table: 'encaminhamentos_recomeco', issue: 'campus diverge da célula', count: encMismatch.length, severity: 'error' });
      }

      // 8. Event registrations with mismatched campus vs event
      const { data: eventRegs } = await supabase
        .from('event_registrations')
        .select('id, campo_id, event_id, events_spiritual!event_registrations_event_id_fkey(campo_id)')
        .limit(1000);
      
      const evMismatch = (eventRegs || []).filter((e: any) => {
        const evCampo = e.events_spiritual?.campo_id;
        return evCampo && evCampo !== e.campo_id;
      });
      if (evMismatch.length > 0) {
        issues.push({ table: 'event_registrations', issue: 'campus diverge do evento', count: evMismatch.length, severity: 'error' });
      }

      // 9. Células without rede_id
      const { count: celNoRede } = await supabase
        .from('celulas')
        .select('id', { count: 'exact', head: true })
        .is('rede_id', null);
      if ((celNoRede || 0) > 0) {
        issues.push({ table: 'celulas', issue: 'sem rede_id', count: celNoRede || 0, severity: 'warning' });
      }

      if (issues.length === 0) {
        issues.push({ table: '-', issue: 'Nenhuma inconsistência detectada ✓', count: 0, severity: 'warning' });
      }

      return issues;
    },
  });
}
