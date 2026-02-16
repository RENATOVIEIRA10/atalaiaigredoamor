import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Eye, Network, FolderTree, ClipboardCheck, Home, Crown } from 'lucide-react';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useSupervisores } from '@/hooks/useSupervisoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useNavigate } from 'react-router-dom';

interface DemoModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DemoLevel = 'pastor' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';

const levels: { value: DemoLevel; label: string; icon: any; color: string }[] = [
  { value: 'pastor', label: 'Pastores Sêniores', icon: Crown, color: 'text-amber-500' },
  { value: 'rede', label: 'Líder de Rede', icon: Network, color: 'text-primary' },
  { value: 'coordenacao', label: 'Coordenador', icon: FolderTree, color: 'text-blue-500' },
  { value: 'supervisor', label: 'Supervisor', icon: ClipboardCheck, color: 'text-green-500' },
  { value: 'celula', label: 'Líder de Célula', icon: Home, color: 'text-orange-500' },
];

export function DemoModeDialog({ open, onOpenChange }: DemoModeDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<DemoLevel | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { activateDemo } = useDemoMode();

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

  const scopeOptions = useMemo(() => {
    if (!selectedLevel) return [];
    const s = search.toLowerCase();

    if (selectedLevel === 'pastor') {
      return [{ id: null, name: 'Visão Pastoral', subtitle: 'Pr. Arthur & Pra. Talitha' }];
    }
    if (selectedLevel === 'rede') {
      return (redes || [])
        .filter(r => !s || r.name.toLowerCase().includes(s))
        .map(r => ({
          id: r.id,
          name: r.name,
          subtitle: getCoupleLabel(r.leadership_couple),
        }));
    }
    if (selectedLevel === 'coordenacao') {
      return (coordenacoes || [])
        .filter(c => !s || c.name.toLowerCase().includes(s))
        .map(c => ({
          id: c.id,
          name: c.name,
          subtitle: getCoupleLabel(c.leadership_couple),
        }));
    }
    if (selectedLevel === 'supervisor') {
      return (supervisores || [])
        .filter(sup => {
          const name = getCoupleLabel(sup.leadership_couple) || sup.profile?.name || '';
          return !s || name.toLowerCase().includes(s) || (sup.coordenacao?.name || '').toLowerCase().includes(s);
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
        .map(c => ({
          id: c.id,
          name: c.name,
          subtitle: getCoupleLabel(c.leadership_couple) || '',
        }));
    }
    return [];
  }, [selectedLevel, search, redes, coordenacoes, supervisores, celulas]);

  const handleSelect = (scopeId: string | null, label: string) => {
    if (!selectedLevel) return;
    activateDemo(selectedLevel, scopeId, label);
    onOpenChange(false);
    setSelectedLevel(null);
    setSearch('');
    navigate('/dashboard');
  };

  const handleBack = () => {
    setSelectedLevel(null);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedLevel(null); setSearch(''); } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-amber-500" />
            Modo Demonstração
          </DialogTitle>
          <DialogDescription>
            {selectedLevel
              ? 'Selecione o escopo para visualizar'
              : 'Escolha o nível de visualização'
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedLevel ? (
          <div className="space-y-2 py-2">
            {levels.map(level => (
              <button
                key={level.value}
                onClick={() => {
                  if (level.value === 'pastor') {
                    handleSelect(null, 'Visão Pastoral');
                  } else {
                    setSelectedLevel(level.value);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${level.color}`}>
                  <level.icon className="h-5 w-5" />
                </div>
                <div>
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
        ) : (
          <div className="space-y-3 py-2">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-xs">
              ← Voltar
            </Button>
            {scopeOptions.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {scopeOptions.map((opt, i) => (
                  <button
                    key={opt.id || i}
                    onClick={() => handleSelect(opt.id, opt.name)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-all text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{opt.name}</p>
                      {opt.subtitle && <p className="text-xs text-muted-foreground">{opt.subtitle}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">Entrar</Badge>
                  </button>
                ))}
                {scopeOptions.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Nenhum resultado</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
