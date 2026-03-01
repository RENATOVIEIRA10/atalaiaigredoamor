import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Repeat, Eye, Settings, Crown, Network, FolderTree, ClipboardCheck, Home, Search, RefreshCw } from 'lucide-react';
import { forceClearAndReload } from '@/hooks/useVersionCheck';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRole } from '@/contexts/RoleContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useSupervisores } from '@/hooks/useSupervisoes';
import { useCelulas } from '@/hooks/useCelulas';
import { cn } from '@/lib/utils';

type DemoLevel = 'pastor' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';

const levels: { value: DemoLevel; label: string; icon: any; color: string }[] = [
  { value: 'pastor', label: 'Pastor Sênior', icon: Crown, color: 'text-amber-500' },
  { value: 'rede', label: 'Líder de Rede', icon: Network, color: 'text-primary' },
  { value: 'coordenacao', label: 'Coordenador', icon: FolderTree, color: 'text-blue-500' },
  { value: 'supervisor', label: 'Supervisor', icon: ClipboardCheck, color: 'text-green-500' },
  { value: 'celula', label: 'Líder de Célula', icon: Home, color: 'text-orange-500' },
];

interface AdminPWAPanelProps {
  onClose: () => void;
}

export function AdminPWAPanel({ onClose }: AdminPWAPanelProps) {
  const navigate = useNavigate();
  const { clearAccess, scopeType } = useRole();
  const { activateDemo, isDemoActive, deactivateDemo } = useDemoMode();
  const [view, setView] = useState<'menu' | 'demo'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<DemoLevel | null>(null);
  const [search, setSearch] = useState('');

  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: supervisores } = useSupervisores();
  const { data: celulas } = useCelulas();

  const getCoupleLabel = (lc: any) => {
    if (!lc) return null;
    const s1 = lc.spouse1?.name;
    const s2 = lc.spouse2?.name;
    if (s1 && s2) return `${s1} & ${s2}`;
    return s1 || s2 || null;
  };

  const handleSwitchRole = () => {
    clearAccess();
    navigate('/trocar-funcao');
    onClose();
  };

  const handleBackToAdmin = () => {
    if (isDemoActive) deactivateDemo();
    navigate('/dashboard');
    onClose();
  };

  const handleSelectDemoLevel = (level: DemoLevel) => {
    if (level === 'pastor') {
      activateDemo('pastor', null, 'Visão Pastoral');
      navigate('/dashboard');
      onClose();
    } else {
      setSelectedLevel(level);
    }
  };

  const handleSelectDemoScope = (scopeId: string | null, label: string) => {
    if (!selectedLevel) return;
    activateDemo(selectedLevel, scopeId, label);
    navigate('/dashboard');
    onClose();
  };

  const scopeOptions = (() => {
    if (!selectedLevel) return [];
    const s = search.toLowerCase();
    if (selectedLevel === 'rede') {
      return (redes || [])
        .filter(r => !s || r.name.toLowerCase().includes(s))
        .map(r => ({ id: r.id, name: r.name, subtitle: getCoupleLabel(r.leadership_couple) }));
    }
    if (selectedLevel === 'coordenacao') {
      return (coordenacoes || [])
        .filter(c => !s || c.name.toLowerCase().includes(s))
        .map(c => ({ id: c.id, name: c.name, subtitle: getCoupleLabel(c.leadership_couple) }));
    }
    if (selectedLevel === 'supervisor') {
      return (supervisores || [])
        .filter(sup => {
          const name = getCoupleLabel(sup.leadership_couple) || sup.profile?.name || '';
          return !s || name.toLowerCase().includes(s);
        })
        .map(sup => ({
          id: sup.id,
          name: getCoupleLabel(sup.leadership_couple) || sup.profile?.name || 'Supervisor',
          subtitle: sup.coordenacao?.name || '',
        }));
    }
    if (selectedLevel === 'celula') {
      return (celulas || [])
        .filter(c => !s || c.name.toLowerCase().includes(s))
        .map(c => ({ id: c.id, name: c.name, subtitle: getCoupleLabel(c.leadership_couple) || '' }));
    }
    return [];
  })();

  // Demo level selection screen
  if (view === 'demo' && !selectedLevel) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
        <header className="flex items-center gap-3 px-4 h-14 border-b border-border/30 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={() => setView('menu')} className="p-2 -ml-2 rounded-xl active:bg-accent/50 touch-manipulation">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            Modo Demonstração
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-4">
          <p className="text-sm text-muted-foreground mb-4">Escolha o nível para visualizar (somente leitura)</p>
          <div className="space-y-2">
            {levels.map(level => (
              <button
                key={level.value}
                onClick={() => handleSelectDemoLevel(level.value)}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 active:bg-accent/50 transition-all text-left touch-manipulation"
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0', level.color)}>
                  <level.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{level.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {level.value === 'pastor' && 'Visão pastoral estratégica'}
                    {level.value === 'rede' && `${redes?.length || 0} rede(s)`}
                    {level.value === 'coordenacao' && `${coordenacoes?.length || 0} coordenação(ões)`}
                    {level.value === 'supervisor' && `${supervisores?.length || 0} supervisor(es)`}
                    {level.value === 'celula' && `${celulas?.length || 0} célula(s)`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Demo scope selection screen
  if (view === 'demo' && selectedLevel) {
    const levelInfo = levels.find(l => l.value === selectedLevel);
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
        <header className="flex items-center gap-3 px-4 h-14 border-b border-border/30 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <button onClick={() => { setSelectedLevel(null); setSearch(''); }} className="p-2 -ml-2 rounded-xl active:bg-accent/50 touch-manipulation">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">{levelInfo?.label || 'Selecionar'}</h1>
        </header>
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-3">
          {scopeOptions.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          )}
          <div className="space-y-2">
            {scopeOptions.map((opt, i) => (
              <button
                key={opt.id || i}
                onClick={() => handleSelectDemoScope(opt.id, opt.name)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 active:bg-accent/50 transition-all text-left touch-manipulation"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{opt.name}</p>
                  {opt.subtitle && <p className="text-xs text-muted-foreground">{opt.subtitle}</p>}
                </div>
                <Badge variant="outline" className="text-xs shrink-0 ml-2">Entrar</Badge>
              </button>
            ))}
            {scopeOptions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum resultado</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Main admin menu
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ height: '100dvh' }}>
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border/30 shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <button onClick={onClose} className="p-2 -ml-2 rounded-xl active:bg-accent/50 touch-manipulation">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Administração
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto overscroll-y-contain p-4 space-y-3">
        {isDemoActive && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-amber-500" />
              <span className="text-amber-700 dark:text-amber-400 font-medium">Modo Demo ativo</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleBackToAdmin} className="h-9 text-xs border-amber-500/30 text-amber-600">
              <ArrowLeft className="h-3 w-3 mr-1" /> Voltar
            </Button>
          </div>
        )}

        <AdminMenuItem
          icon={Repeat}
          label="Trocar Função"
          description="Alternar entre funções vinculadas"
          onClick={handleSwitchRole}
        />

        <AdminMenuItem
          icon={Eye}
          label="Modo Demonstração"
          description="Visualizar dashboards (somente leitura)"
          onClick={() => setView('demo')}
          accent
        />

        {isDemoActive && (
          <AdminMenuItem
            icon={ArrowLeft}
            label="Voltar para Admin"
            description="Encerrar demonstração"
            onClick={handleBackToAdmin}
          />
        )}

        <AdminMenuItem
          icon={RefreshCw}
          label="Forçar Atualização"
          description="Limpar cache e recarregar app"
          onClick={forceClearAndReload}
        />
      </main>
    </div>
  );
}

function AdminMenuItem({ icon: Icon, label, description, onClick, accent }: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left touch-manipulation active:scale-[0.98]',
        accent
          ? 'border-amber-500/30 bg-amber-500/5'
          : 'border-border/50'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
        accent ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
