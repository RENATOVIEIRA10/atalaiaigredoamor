import { RecomecoKPIs } from '@/hooks/useRecomecoFunnel';
import { StatCard } from '@/components/ui/stat-card';
import { UserPlus, Clock, MessageCircle, Home, Users, XCircle, TrendingUp, Timer } from 'lucide-react';

interface RecomecoKPICardsProps {
  kpis: RecomecoKPIs;
  compact?: boolean;
}

export function RecomecoKPICards({ kpis, compact }: RecomecoKPICardsProps) {
  if (compact) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserPlus} label="Encaminhadas" value={kpis.encaminhadas} />
        <StatCard icon={Clock} label="Pendentes" value={kpis.pendentes} className={kpis.pendentes > 0 ? 'border-amber-500/20' : ''} />
        <StatCard icon={Home} label="Integradas" value={kpis.integradas} />
        <StatCard icon={Users} label="Membros" value={kpis.promovidas} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={UserPlus} label="Encaminhadas" value={kpis.encaminhadas} />
        <StatCard icon={Clock} label="Pendentes" value={kpis.pendentes} className={kpis.pendentes > 0 ? 'border-amber-500/20' : ''} />
        <StatCard icon={MessageCircle} label="Contatadas" value={kpis.contatadas} />
        <StatCard icon={Home} label="Integradas" value={kpis.integradas} />
        <StatCard icon={Users} label="Convertidas (Membro)" value={kpis.promovidas} />
        <StatCard icon={XCircle} label="Sem Resposta" value={kpis.sem_resposta} />
      </div>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatCard icon={TrendingUp} label="Taxa de Contato" value={`${kpis.taxaContato}%`} />
        <StatCard icon={TrendingUp} label="Taxa de Integração" value={`${kpis.taxaIntegracao}%`} />
        <StatCard icon={TrendingUp} label="Taxa de Conversão" value={`${kpis.taxaConversao}%`} />
      </div>
      {(kpis.tempoMedioContato !== null || kpis.tempoMedioIntegracao !== null) && (
        <div className="grid gap-3 grid-cols-2">
          {kpis.tempoMedioContato !== null && (
            <StatCard icon={Timer} label="Tempo Médio p/ Contato" value={`${kpis.tempoMedioContato}d`} />
          )}
          {kpis.tempoMedioIntegracao !== null && (
            <StatCard icon={Timer} label="Tempo Médio p/ Integração" value={`${kpis.tempoMedioIntegracao}d`} />
          )}
        </div>
      )}
    </div>
  );
}
