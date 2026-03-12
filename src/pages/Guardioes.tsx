/**
 * Guardiões — Contagem Inteligente de Culto
 * Interface de contagem presencial para o ministério Guardiões.
 *
 * Fluxo ministerial:
 *  1. Guardião inicia a contagem (data/horário detectados automaticamente)
 *  2. Durante o culto: conta o público (botão +1 / +10 / −1)
 *  3. Ao encerrar: informa Novas Vidas e observações
 *  4. Após conclusão: pode iniciar nova contagem (novo horário do mesmo dia)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useContagemHoje,
  useContagemHistorico,
  useSaveContagem,
  saveOfflineSession,
  loadOfflineSession,
  type CultoContagem,
  type SaveContagemPayload,
} from '@/hooks/useGuardioesCulto';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Users, Plus, Minus, RotateCcw, Save, CheckCircle,
  History, Shield, TrendingUp, Hash, Heart, PlusCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  return format(new Date(iso + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR });
}

/** Retorna horário atual no formato "Xh" ou "Xh30" */
function currentHorario(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// ─── Counter Button ───────────────────────────────────────────────────────────

interface CounterBtnProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

function CounterBtn({ label, onClick, variant = 'secondary', className }: CounterBtnProps) {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onClick();
  };

  return (
    <button
      onPointerDown={handlePress}
      className={cn(
        'select-none touch-manipulation rounded-2xl font-bold transition-all active:scale-95',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90',
        variant === 'secondary' && 'bg-muted text-foreground hover:bg-muted/80',
        variant === 'ghost' && 'bg-transparent border border-border text-muted-foreground hover:bg-muted/50',
        pressed && 'scale-95 brightness-90',
        className,
      )}
    >
      {label}
    </button>
  );
}

// ─── Iniciar Contagem ─────────────────────────────────────────────────────────

interface IniciarProps {
  onIniciar: (horario: string) => void;
  isLoading: boolean;
}

function IniciarContagem({ onIniciar, isLoading }: IniciarProps) {
  // Pré-preenche com o horário atual para vincular automaticamente ao culto
  const [horario, setHorario] = useState(currentHorario);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-primary/10 p-5 border border-primary/20">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Iniciar Contagem</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Horário detectado automaticamente. Ajuste se necessário e inicie a contagem.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2">
        <Label htmlFor="horario">Horário do culto</Label>
        <Input
          id="horario"
          placeholder="ex: 18h, 10h30"
          value={horario}
          onChange={e => setHorario(e.target.value)}
          className="text-center text-lg h-12"
        />
      </div>

      <Button
        size="lg"
        className="w-full max-w-xs h-14 text-base font-bold rounded-2xl"
        onClick={() => onIniciar(horario)}
        disabled={isLoading}
      >
        <Plus className="h-5 w-5 mr-2" />
        Iniciar Contagem
      </Button>
    </motion.div>
  );
}

// ─── Novas Vidas Form (encerramento) ─────────────────────────────────────────

interface NovasVidasFormProps {
  values: { novas_vidas_count: number; observacoes: string };
  onChange: (key: string, value: number | string) => void;
}

function NovasVidasForm({ values, onChange }: NovasVidasFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Heart className="h-4 w-4 text-rose-500" />
        Novas Vidas
      </h3>
      <div className="flex flex-col items-center gap-1.5 max-w-[120px]">
        <Heart className="h-4 w-4 text-rose-500" />
        <span className="text-[10px] text-muted-foreground text-center leading-tight">Novas Vidas</span>
        <Input
          type="number"
          min="0"
          value={values.novas_vidas_count}
          onChange={e => onChange('novas_vidas_count', parseInt(e.target.value) || 0)}
          className="text-center h-12 text-2xl font-bold px-2 w-24"
        />
      </div>
      <div>
        <Label htmlFor="observacoes" className="text-xs">Observações</Label>
        <Textarea
          id="observacoes"
          placeholder="Alguma observação sobre o culto..."
          rows={2}
          value={values.observacoes}
          onChange={e => onChange('observacoes', e.target.value)}
          className="resize-none text-sm mt-1"
        />
      </div>
    </div>
  );
}

// ─── Contador Ativo ───────────────────────────────────────────────────────────

interface ContadorAtivoProps {
  contagem: CultoContagem;
  campoId: string;
  userId: string | null;
  onEncerrar: (updated: CultoContagem) => void;
}

function ContadorAtivo({ contagem, campoId, userId, onEncerrar }: ContadorAtivoProps) {
  const [count, setCount] = useState(contagem.total_presentes);
  const [encerrandoMode, setEncerrandoMode] = useState(false);
  const [novasVidas, setNovasVidas] = useState({
    novas_vidas_count: contagem.novas_vidas_count,
    observacoes: contagem.observacoes ?? '',
  });
  const lastPressRef = useRef<number>(0);
  const { mutate: save, isPending: isSaving } = useSaveContagem();

  // Sync to localStorage on every change (offline support)
  useEffect(() => {
    saveOfflineSession(campoId, contagem.data, {
      id: contagem.id,
      campo_id: campoId,
      data: contagem.data,
      horario: contagem.horario,
      total_presentes: count,
      status: 'em_andamento',
      guardiao_user_id: userId,
      novas_vidas_count: novasVidas.novas_vidas_count,
      decisoes_espirituais: 0,
      batismos_agendados: 0,
      observacoes: novasVidas.observacoes || null,
    });
  }, [count, campoId, contagem.data, contagem.horario, contagem.id, userId, novasVidas]);

  const handleCount = useCallback((delta: number) => {
    const now = Date.now();
    if (now - lastPressRef.current < 250) return;
    lastPressRef.current = now;
    navigator.vibrate?.(15);
    setCount(prev => Math.max(0, prev + delta));
  }, []);

  const handleZerar = () => {
    navigator.vibrate?.([20, 50, 20]);
    setCount(0);
  };

  const buildPayload = (status: 'em_andamento' | 'encerrado'): SaveContagemPayload => ({
    id: contagem.id,
    campo_id: campoId,
    data: contagem.data,
    horario: contagem.horario,
    total_presentes: count,
    status,
    guardiao_user_id: userId,
    novas_vidas_count: novasVidas.novas_vidas_count,
    decisoes_espirituais: 0,
    batismos_agendados: 0,
    observacoes: novasVidas.observacoes || null,
  });

  const handleSalvarParcial = () => {
    save(buildPayload('em_andamento'));
  };

  const handleEncerrar = () => {
    save(buildPayload('encerrado'), {
      onSuccess: (saved) => onEncerrar(saved as CultoContagem),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Date + horario */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground capitalize">{formatDate(contagem.data)}</p>
        {contagem.horario && (
          <Badge variant="outline" className="text-xs mt-1">{contagem.horario}</Badge>
        )}
      </div>

      {/* Big counter */}
      <div className="flex flex-col items-center py-4">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={count}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="text-8xl font-black tabular-nums text-foreground leading-none"
          >
            {count.toLocaleString('pt-BR')}
          </motion.div>
        </AnimatePresence>
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          pessoas presentes
        </p>
      </div>

      {/* Counter buttons */}
      <div className="grid grid-cols-3 gap-3">
        <CounterBtn
          label="−1"
          onClick={() => handleCount(-1)}
          variant="ghost"
          className="h-14 text-xl"
        />
        <CounterBtn
          label="+1"
          onClick={() => handleCount(1)}
          variant="primary"
          className="h-20 text-3xl col-start-2"
        />
        <CounterBtn
          label="+10"
          onClick={() => handleCount(10)}
          variant="secondary"
          className="h-14 text-lg"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="ghost" size="sm" onClick={handleZerar} className="text-xs gap-1 h-9">
          <RotateCcw className="h-3.5 w-3.5" />
          Zerar
        </Button>
        <Button variant="outline" size="sm" onClick={handleSalvarParcial} disabled={isSaving} className="text-xs gap-1 h-9">
          <Save className="h-3.5 w-3.5" />
          Salvar
        </Button>
        <Button size="sm" onClick={() => setEncerrandoMode(true)} className="text-xs gap-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
          <CheckCircle className="h-3.5 w-3.5" />
          Encerrar
        </Button>
      </div>

      {/* Encerramento form — só Novas Vidas */}
      <AnimatePresence>
        {encerrandoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-4 border-emerald-500/30 bg-emerald-500/5">
              <NovasVidasForm
                values={novasVidas}
                onChange={(key, val) => setNovasVidas(prev => ({ ...prev, [key]: val }))}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEncerrandoMode(false)} className="flex-1 h-10">
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleEncerrar}
                  disabled={isSaving}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSaving ? 'Salvando…' : 'Concluir Contagem'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Encerrado Banner ─────────────────────────────────────────────────────────

interface EncerradoBannerProps {
  contagem: CultoContagem;
  onNovaContagem?: () => void;
}

function EncerradoBanner({ contagem, onNovaContagem }: EncerradoBannerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-500/15 p-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contagem concluída</p>
            <p className="text-xs text-muted-foreground capitalize">
              {formatDate(contagem.data)}{contagem.horario ? ` · ${contagem.horario}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          {/* Público */}
          <div className="rounded-xl bg-background/60 py-3 px-2">
            <p className="text-3xl font-black text-foreground">{contagem.total_presentes.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">presentes</p>
          </div>
          {/* Novas Vidas */}
          <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 py-3 px-2">
            <div className="flex justify-center mb-1">
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-3xl font-black text-rose-500">{contagem.novas_vidas_count}</p>
            <p className="text-[10px] text-muted-foreground">novas vidas</p>
          </div>
        </div>

        {contagem.observacoes && (
          <p className="text-xs text-muted-foreground italic">{contagem.observacoes}</p>
        )}
      </Card>

      {/* Botão para iniciar nova contagem (novo horário) */}
      {onNovaContagem && (
        <Button
          variant="outline"
          className="w-full h-11 gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5"
          onClick={onNovaContagem}
        >
          <PlusCircle className="h-4 w-4" />
          Iniciar nova contagem
        </Button>
      )}
    </motion.div>
  );
}

// ─── Histórico ────────────────────────────────────────────────────────────────

function HistoricoTab() {
  const { data: historico, isLoading } = useContagemHistorico();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!historico?.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <History className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Nenhuma contagem encerrada ainda.</p>
      </div>
    );
  }

  const total = historico.reduce((s, c) => s + c.total_presentes, 0);
  const media = Math.round(total / historico.length);
  const maxPresentes = Math.max(...historico.map(c => c.total_presentes));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Hash, label: 'Cultos', value: historico.length, color: 'text-primary' },
          { icon: TrendingUp, label: 'Média', value: media.toLocaleString('pt-BR'), color: 'text-amber-500' },
          { icon: Users, label: 'Maior', value: maxPresentes.toLocaleString('pt-BR'), color: 'text-emerald-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label} className="p-3 text-center">
            <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
            <p className="text-lg font-bold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {historico.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground capitalize">{formatDate(c.data)}</p>
                <p className="text-xs text-muted-foreground">{c.horario || 'Horário não informado'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">{c.total_presentes.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">presentes</p>
              </div>
            </div>
            {c.novas_vidas_count > 0 && (
              <div className="flex gap-3 mt-2 pt-2 border-t border-border/40">
                <span className="flex items-center gap-1 text-[10px] text-rose-500">
                  <Heart className="h-3 w-3" />{c.novas_vidas_count} novas vidas
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Guardioes() {
  const { isGuardioesCulto, isPastor, isPastorDeCampo, isPastorSeniorGlobal, isAdmin } = useRole();
  const { activeCampoId } = useCampo();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'historico' ? 'historico' : 'contagem';

  const { data: contagemHoje, isLoading } = useContagemHoje();
  const { mutate: save, isPending: isCreating } = useSaveContagem();

  // Sessão encerrada neste ciclo de UI (para exibir EncerradoBanner imediato)
  const [encerrado, setEncerrado] = useState<CultoContagem | null>(null);
  // Forçar início de nova contagem (mesmo com encerrado hoje)
  const [forceNovaContagem, setForceNovaContagem] = useState(false);

  // Role guard
  const hasAccess = isGuardioesCulto || isPastor || isPastorDeCampo || isPastorSeniorGlobal || isAdmin;
  if (!hasAccess) return <Navigate to="/home" replace />;

  const today = todayIso();

  const handleIniciar = (horario: string) => {
    if (!activeCampoId) return;
    const offline = loadOfflineSession(activeCampoId, today);
    save({
      campo_id: activeCampoId,
      data: today,
      horario: horario || null,
      total_presentes: offline?.total_presentes ?? 0,
      status: 'em_andamento',
      guardiao_user_id: user?.id ?? null,
      novas_vidas_count: 0,
      decisoes_espirituais: 0,
      batismos_agendados: 0,
      observacoes: null,
    }, {
      onSuccess: () => {
        setForceNovaContagem(false);
        setEncerrado(null);
      },
    });
  };

  const handleNovaContagem = () => {
    setEncerrado(null);
    setForceNovaContagem(true);
  };

  // Deriva o estado da contagem
  const activeContagem = encerrado ?? contagemHoje;
  const showIniciar = forceNovaContagem || (!isLoading && !activeContagem);
  const showEncerrado = !forceNovaContagem && (encerrado || activeContagem?.status === 'encerrado');
  const showContador = !forceNovaContagem && !encerrado && activeContagem?.status === 'em_andamento';

  return (
    <AppLayout title="Guardiões">
      <div className="max-w-md mx-auto pb-28 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Guardiões</h1>
            <p className="text-xs text-muted-foreground">Contagem inteligente de culto</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-muted p-1 gap-1">
          {[
            { id: 'contagem', label: 'Contagem', icon: Shield },
            { id: 'historico', label: 'Histórico', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSearchParams(tab.id === 'historico' ? { tab: 'historico' } : {})}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'historico' ? (
          <HistoricoTab />
        ) : (
          <Card className="p-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-40 mx-auto" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : showEncerrado ? (
              <EncerradoBanner
                contagem={(encerrado ?? activeContagem) as CultoContagem}
                onNovaContagem={handleNovaContagem}
              />
            ) : showContador ? (
              <ContadorAtivo
                contagem={activeContagem as CultoContagem}
                campoId={activeCampoId!}
                userId={user?.id ?? null}
                onEncerrar={setEncerrado}
              />
            ) : showIniciar ? (
              <IniciarContagem onIniciar={handleIniciar} isLoading={isCreating} />
            ) : null}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
