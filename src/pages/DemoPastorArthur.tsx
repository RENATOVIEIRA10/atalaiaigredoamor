/**
 * Demo Guiada Premium — Pastor Arthur & Pastora Talitha
 * Rota pública: /demo/pastor-arthur
 *
 * Narrativa: A jornada de Fernanda Costa — do culto ao discipulado.
 * Uma vida rastreada de ponta a ponta pelo Atalaia.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import { Button } from '@/components/ui/button';
import {
  Heart, Users, Shield, Eye, Church, Crown, Waypoints,
  ChevronRight, ChevronLeft, BookOpen, FileText, Star,
  AlertTriangle, BarChart3, CheckCircle2, Baby, Calendar,
  Activity, Target, Sparkles, UserCheck, TrendingUp,
  MessageCircle, MapPin, Phone, ArrowRight, RefreshCw,
  ClipboardCheck, Network, UserPlus, Radio, Home,
  BookMarked, Layers, Zap, ArrowDown, Lock
} from 'lucide-react';

/* ─── Design tokens ─── */
const gold   = '#C5A059';
const goldHi = '#D4B366';
const bg1    = '#0A0D12';
const bg2    = '#0F1927';
const tMain  = '#F4EDE4';
const tBody  = '#D4D2CF';
const tMuted = '#8A8886';
const serif  = "'Playfair Display', Georgia, serif";
const sans   = "'Manrope', 'Inter', sans-serif";

/* ─── Shared primitives ─── */

const goldGrad = `linear-gradient(135deg, ${gold}, ${goldHi})`;

function GoldDivider() {
  return (
    <div className="h-px w-16 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
  );
}

function DemoBadge({ label = 'DEMONSTRAÇÃO' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase"
      style={{ background: `${gold}18`, border: `1px solid ${gold}40`, color: gold }}>
      <Eye className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: goldGrad }}>
        <Icon className="h-5 w-5" style={{ color: bg1 }} />
      </div>
      <div>
        <h2 className="text-lg font-bold leading-tight" style={{ color: gold, fontFamily: serif }}>{title}</h2>
        <p className="text-xs leading-snug" style={{ color: tMuted }}>{sub}</p>
      </div>
    </div>
  );
}

function DemoCard({ title, icon: Icon, badge, children, accent }: {
  title: string; icon: React.ElementType; badge?: boolean; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: accent ? `${gold}0C` : `${gold}07`, border: `1px solid ${accent ? gold + '2A' : gold + '14'}` }}>
      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${gold}12`, background: accent ? `${gold}08` : 'transparent' }}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color: gold }} />
          <h3 className="text-xs font-semibold tracking-wide" style={{ color: tMain, fontFamily: sans }}>{title}</h3>
        </div>
        {badge && <DemoBadge />}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MockStat({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: `${gold}0A`, border: `1px solid ${gold}18` }}>
      <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: accent ? gold : tMuted }} />
      <p className="text-xl font-bold leading-none mb-1" style={{ color: tMain, fontFamily: serif }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: tMuted }}>{label}</p>
    </div>
  );
}

function BarStat({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: tMuted }}>{label}</span>
        <span className="font-semibold" style={{ color: tMain }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${gold}15` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: goldGrad }} />
      </div>
    </div>
  );
}

function PastoralWord({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: `${gold}0E`, border: `1px solid ${gold}22` }}>
      <Heart className="h-5 w-5 mx-auto mb-3" style={{ color: gold }} />
      <p className="text-sm italic leading-relaxed" style={{ color: tMain, fontFamily: serif }}>{children}</p>
    </div>
  );
}

/** Fernanda avatar badge reutilizável */
function FernandaAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-10 w-10 text-sm';
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ background: `${gold}28`, color: gold, border: `2px solid ${gold}50` }}>
      FC
    </div>
  );
}

/** Chip de jornada — mostra status da Fernanda */
function JorneyChips({ active }: { active: number }) {
  const steps = ['Culto', 'Recomeço', 'Central', 'Célula', 'Membro', 'Discipulado'];
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s, i) => (
        <span key={s} className="text-[9px] px-2.5 py-1 rounded-full font-semibold"
          style={
            i < active
              ? { background: `${gold}26`, color: gold, border: `1px solid ${gold}40` }
              : i === active
              ? { background: goldGrad, color: bg1 }
              : { background: `${gold}07`, color: tMuted, border: `1px dashed ${gold}25` }
          }>
          {i < active ? '✓ ' : ''}{s}
        </span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 0 — BOAS-VINDAS PERSONALIZADAS
══════════════════════════════════════════════════════════ */

function StepBemVindo({ onNext, onFree }: { onNext: () => void; onFree: () => void }) {
  return (
    <div className="text-center py-8 sm:py-14 space-y-8">
      <AtalaiaLogoHeader size="sm" />

      <div className="space-y-3">
        <DemoBadge label="DEMONSTRAÇÃO EXCLUSIVA" />
        <h1 className="text-3xl sm:text-5xl font-bold leading-tight mt-3"
          style={{ fontFamily: serif, color: tMain, letterSpacing: '-0.02em' }}>
          ATALAIA
        </h1>
        <p className="text-sm sm:text-base" style={{ color: gold, fontFamily: serif }}>
          Sistema Operacional Pastoral
        </p>
        <p className="text-xs" style={{ color: tMuted }}>Rede Amor a Dois · Igreja do Amor</p>
      </div>

      <GoldDivider />

      <div className="max-w-md mx-auto space-y-5 text-left">
        <div className="rounded-2xl p-6 space-y-3"
          style={{ background: `${gold}0C`, border: `1px solid ${gold}28` }}>
          <p className="text-base font-semibold" style={{ color: gold, fontFamily: serif }}>
            Graça e paz, Pastor Arthur e Pastora Talitha.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: tBody }}>
            Esta demonstração foi preparada especialmente para vocês, mostrando como o Atalaia acompanha cada vida — do primeiro culto ao discipulado.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: tBody }}>
            Não é uma apresentação de slides. É o sistema real, funcionando, com uma narrativa pastoral que conecta tudo.
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tMuted }}>
            O que vocês vão ver:
          </p>
          {[
            { icon: Radio,       text: 'Como o culto gera inteligência pastoral' },
            { icon: Heart,       text: 'A jornada de Fernanda — uma nova vida' },
            { icon: Home,        text: 'O cuidado célula por célula' },
            { icon: Layers,      text: 'A visão de cada nível de liderança' },
            { icon: Church,      text: 'O que o pastor vê — campo e global' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${gold}18` }}>
                <Icon className="h-3 w-3" style={{ color: gold }} />
              </div>
              <span className="text-xs" style={{ color: tBody }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <GoldDivider />

      <div className="space-y-3">
        <Button onClick={onNext} size="lg" className="gap-2 rounded-full px-8 w-full max-w-xs"
          style={{ background: goldGrad, color: bg1, fontWeight: 700 }}>
          Iniciar Demonstração
          <ChevronRight className="h-4 w-4" />
        </Button>
        <button onClick={onFree}
          className="block mx-auto text-xs underline underline-offset-2"
          style={{ color: tMuted }}>
          Explorar livremente
        </button>
      </div>

      <div className="rounded-xl p-4 text-center max-w-xs mx-auto"
        style={{ background: `${gold}07`, border: `1px solid ${gold}15` }}>
        <p className="text-xs italic leading-relaxed" style={{ color: gold, fontFamily: serif }}>
          "Filho do homem, eu te coloquei<br />como atalaia para a casa de Israel."
        </p>
        <p className="text-[10px] mt-2" style={{ color: tMuted }}>Ezequiel 3:17</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 1 — O CULTO (GUARDIÕES)
══════════════════════════════════════════════════════════ */

function StepCulto() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Radio} title="O Culto" sub="Onde tudo começa — o altar como ponto de partida pastoral" />
      <JorneyChips active={0} />

      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: `${gold}08`, border: `1px solid ${gold}20` }}>
        <p className="text-xs" style={{ color: tMuted }}>
          <strong style={{ color: tMain }}>O problema antes do Atalaia:</strong> o culto terminava, as pessoas iam embora e ninguém sabia quantas almas estavam ali. Novas vidas passavam pelo altar e se perdiam.
        </p>
        <p className="text-xs" style={{ color: tMuted }}>
          <strong style={{ color: tMain }}>Com o Atalaia:</strong> o culto vira inteligência pastoral. Guardiões contam em tempo real. Dados chegam ao painel do pastor em segundos.
        </p>
      </div>

      <DemoCard title="Culto Dominical · 09/03/2026" icon={Radio} badge accent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MockStat icon={Users} label="Total presente" value="347" accent />
          <MockStat icon={Star} label="Visitantes" value="28" accent />
          <MockStat icon={Baby} label="Crianças" value="41" />
          <MockStat icon={Heart} label="Novas vidas" value="6" accent />
        </div>
        <div className="flex items-center justify-between text-xs py-2"
          style={{ borderTop: `1px solid ${gold}15` }}>
          <span style={{ color: tMuted }}>Responsáveis de contagem</span>
          <span style={{ color: tMain }}>3 guardiões ativos</span>
        </div>
      </DemoCard>

      <DemoCard title="Como os Guardiões funcionam" icon={Users}>
        <div className="space-y-2.5">
          {[
            { step: '1', text: 'Guardião abre o módulo no celular antes do culto' },
            { step: '2', text: 'Conta presentes por zona (frente, meio, fundos)' },
            { step: '3', text: 'Registra visitantes e crianças em tempo real' },
            { step: '4', text: 'Ao encerrar, dados chegam ao dashboard do pastor' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: goldGrad, color: bg1 }}>{s.step}</div>
              <p className="text-xs leading-relaxed" style={{ color: tBody }}>{s.text}</p>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Nova vida registrada neste culto" icon={UserPlus}>
        <div className="flex items-center gap-3">
          <FernandaAvatar size="md" />
          <div>
            <p className="text-sm font-semibold" style={{ color: tMain }}>Fernanda Costa</p>
            <p className="text-xs" style={{ color: tMuted }}>Decisão no altar · 09/03/2026 · Culto Dominical</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: `${gold}20`, color: gold }}>
              ✓ Registrada pelo Recomeço
            </span>
          </div>
        </div>
      </DemoCard>

      <PastoralWord>
        "O altar deixou de ser apenas o início da pregação.<br />
        Passou a ser o início de um acompanhamento."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 2 — RECOMEÇO
══════════════════════════════════════════════════════════ */

function StepRecomeco() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Heart} title="Recomeço" sub="Nenhuma vida se perde — acolhimento imediato" />
      <JorneyChips active={1} />

      <DemoCard title="Nova Vida — Ficha Cadastral" icon={UserPlus} badge accent>
        <div className="flex items-center gap-3 mb-4">
          <FernandaAvatar size="lg" />
          <div>
            <p className="text-base font-bold" style={{ color: tMain }}>Fernanda Costa</p>
            <p className="text-xs" style={{ color: tMuted }}>Decisão · 09/03/2026 · Culto Dominical</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {[
            { icon: Phone,   label: 'WhatsApp',   value: '(81) 99841-5522' },
            { icon: MapPin,  label: 'Bairro',      value: 'Poço da Panela, Recife' },
            { icon: Heart,   label: 'Estado civil', value: 'Casada' },
            { icon: Users,   label: 'Faixa etária', value: '25–35 anos' },
            { icon: Clock_,  label: 'Preferência', value: 'Terça ou Quinta' },
            { icon: Home,    label: 'Tipo de célula', value: 'Casais' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="h-3 w-3 shrink-0" style={{ color: gold }} />
              <div>
                <span style={{ color: tMuted }}>{label}: </span>
                <span style={{ color: tBody }}>{value}</span>
              </div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Mensagem de Boas-vindas — enviada automaticamente" icon={MessageCircle}>
        <div className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: '#0C1015', border: `1px solid ${gold}12`, color: tBody }}>
          <p>Olá, Fernanda! 🤗</p>
          <p className="mt-2">Que alegria estar com você nessa decisão! A equipe do Recomeço vai caminhar com você nessa nova fase. Em breve vamos te conectar com uma família de célula pertinho da sua casa.</p>
          <p className="mt-2" style={{ color: gold }}>— Equipe Recomeço · Igreja do Amor ❤️</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px]" style={{ color: tMuted }}>Entregue via WhatsApp · 09/03 às 20h47</span>
        </div>
      </DemoCard>

      <DemoCard title="Status da Jornada de Fernanda" icon={Activity}>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Decisão', done: true },
            { label: 'Cadastrada', done: true },
            { label: 'Contatada', done: true },
            { label: 'Central', done: false },
            { label: 'Célula', done: false },
            { label: 'Membro', done: false },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold"
                style={s.done
                  ? { background: `${gold}26`, color: gold }
                  : { background: `${gold}07`, color: tMuted, border: `1px dashed ${gold}25` }}>
                {s.done ? '✓ ' : ''}{s.label}
              </span>
              {i < arr.length - 1 && <ArrowRight className="h-2.5 w-2.5" style={{ color: `${gold}35` }} />}
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralWord>
        "Aqui começa o cuidado.<br />
        Cada nome tem rosto.<br />
        Cada rosto tem história."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 3 — CENTRAL DE CÉLULAS
══════════════════════════════════════════════════════════ */

function StepCentral() {
  const celulas = [
    { name: 'Célula Rute',  bairro: 'Poço da Panela', dist: '0.7 km', members: 11, horario: 'Terça 20h',  match: 97 },
    { name: 'Célula Ester', bairro: 'Parnamirim',     dist: '1.9 km', members: 8,  horario: 'Quinta 20h', match: 81 },
    { name: 'Célula Miriã', bairro: 'Casa Amarela',   dist: '3.2 km', members: 14, horario: 'Sábado 16h', match: 64 },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader icon={Network} title="Central de Células" sub="Discernimento com critério — a vida certa, na célula certa" />
      <JorneyChips active={2} />

      <div className="rounded-xl p-4" style={{ background: `${gold}08`, border: `1px solid ${gold}18` }}>
        <p className="text-xs leading-relaxed" style={{ color: tBody }}>
          O sistema usa um <strong style={{ color: tMain }}>motor de match</strong> para calcular a célula mais adequada considerando localização (35%), tipo (30%), faixa etária (25%) e horário (10%).
        </p>
      </div>

      <DemoCard title="Fernanda em triagem" icon={UserPlus} badge>
        <div className="flex items-center gap-3">
          <FernandaAvatar />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: tMain }}>Fernanda Costa</p>
            <p className="text-xs" style={{ color: tMuted }}>Casada · Poço da Panela · Terça ou Quinta · 25–35 anos</p>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Células Sugeridas" icon={MapPin}>
        <div className="space-y-3">
          {celulas.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between py-2.5"
              style={i < celulas.length - 1 ? { borderBottom: `1px solid ${gold}10` } : {}}>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold" style={{ color: i === 0 ? tMain : tBody }}>{c.name}</p>
                  {i === 0 && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full"
                      style={{ background: goldGrad, color: bg1, fontWeight: 700 }}>
                      Recomendada
                    </span>
                  )}
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: tMuted }}>
                  {c.bairro} · {c.dist} · {c.horario} · {c.members} membros
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color: i === 0 ? gold : tMuted }}>
                  {c.match}%
                </span>
                <p className="text-[9px]" style={{ color: tMuted }}>match</p>
              </div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Encaminhamento confirmado" icon={CheckCircle2} accent>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: gold }} />
          <div>
            <p className="text-sm" style={{ color: tMain }}>
              Fernanda encaminhada para <strong>Célula Rute</strong>
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: tMuted }}>
              Líder notificado · Poço da Panela · Terça 20h · Ana & Rodrigo Costa
            </p>
          </div>
        </div>
      </DemoCard>

      <PastoralWord>
        "A Central não distribui vidas.<br />
        Ela discerne caminhos com cuidado pastoral."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 4 — CÉLULA (relatório, membros, discipulado)
══════════════════════════════════════════════════════════ */

function StepCelula() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Home} title="A Célula" sub="O cuidado de perto — onde vidas são transformadas" />
      <JorneyChips active={3} />

      <DemoCard title="Relatório Semanal — Célula Rute" icon={FileText} badge accent>
        <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: tMuted }}>
          <Calendar className="h-3.5 w-3.5" style={{ color: gold }} />
          Semana 10–16/03/2026 · Terça 20h · Poço da Panela
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <MockStat icon={Users} label="Presentes" value="14" accent />
          <MockStat icon={Star}  label="Visitantes" value="3" />
          <MockStat icon={Baby}  label="Crianças" value="2" />
          <MockStat icon={Heart} label="Novas vidas" value="1" accent />
        </div>
        <div className="rounded-lg p-3 text-xs leading-relaxed"
          style={{ background: `${gold}08`, border: `1px solid ${gold}12` }}>
          <p style={{ color: tBody }}>
            <strong style={{ color: tMain }}>Observação pastoral:</strong> Fernanda Costa veio pela primeira vez. Muito receptiva, permaneceu até o final. Marido promete vir semana que vem.
          </p>
        </div>
      </DemoCard>

      <DemoCard title="Membros da Célula Rute" icon={Users}>
        <div className="space-y-1">
          {[
            { name: 'Ana Costa (líder)',    active: true },
            { name: 'Rodrigo Costa (líder)', active: true },
            { name: 'Carla Andrade',         active: true },
            { name: 'Jorge Santos',          active: true },
            { name: 'Beatriz Lima',          active: true },
            { name: 'Fernanda Costa 🆕',     active: true, new: true },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-2 py-1.5"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: m.new ? `${gold}30` : `${gold}12`, color: gold }}>
                {m.name.charAt(0)}
              </div>
              <span className="text-xs" style={{ color: m.new ? gold : tBody }}>{m.name}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3" style={{ color: tMuted }}>11 membros ativos · LIT: 1 em formação</p>
      </DemoCard>

      <DemoCard title="Discipulados desta semana" icon={BookMarked}>
        <div className="space-y-2">
          {[
            { nome: 'Carla Andrade',   tipo: 'Encontro com Deus', data: '12/03' },
            { nome: 'Jorge Santos',    tipo: 'Batismo',           data: '08/03' },
          ].map(d => (
            <div key={d.nome} className="flex items-center justify-between py-1.5"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <div>
                <p className="text-xs font-medium" style={{ color: tMain }}>{d.nome}</p>
                <p className="text-[10px]" style={{ color: tMuted }}>{d.tipo}</p>
              </div>
              <span className="text-[10px]" style={{ color: tMuted }}>{d.data}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralWord>
        "O cuidado acontece aqui.<br />
        Pessoas cuidando de pessoas,<br />
        semana após semana."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 5 — MEMBRO
══════════════════════════════════════════════════════════ */

function StepMembro() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={UserCheck} title="Membro" sub="A vida consolidada — do culto à comunidade" />
      <JorneyChips active={4} />

      <DemoCard title="Fernanda Costa — perfil de membro" icon={UserCheck} badge accent>
        <div className="flex items-center gap-3 mb-4">
          <FernandaAvatar size="lg" />
          <div>
            <p className="text-base font-bold" style={{ color: tMain }}>Fernanda Costa</p>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: goldGrad, color: bg1 }}>
              ✓ Membro Ativo
            </span>
            <p className="text-xs mt-1" style={{ color: tMuted }}>Desde 30/03/2026 · Célula Rute</p>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            ['Célula',       'Rute — Poço da Panela'],
            ['Líderes',      'Ana & Rodrigo Costa'],
            ['Frequência',   '100% (4 de 4 semanas)'],
            ['Marco atual',  'Aguardando Encontro com Deus'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <span style={{ color: tMuted }}>{label}</span>
              <span style={{ color: tBody }}>{value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="A jornada de Fernanda — completa até aqui" icon={Activity}>
        <div className="space-y-3">
          {[
            { icon: Radio,    label: 'Culto',         date: '09/03', done: true },
            { icon: Heart,    label: 'Recomeço',       date: '09/03', done: true },
            { icon: Network,  label: 'Central',        date: '11/03', done: true },
            { icon: Home,     label: 'Célula Rute',    date: '11/03', done: true },
            { icon: UserCheck, label: 'Membro ativo',  date: '30/03', done: true },
            { icon: BookMarked, label: 'Discipulado',  date: 'Em breve', done: false },
          ].map(({ icon: Icon, label, date, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0`}
                style={{ background: done ? goldGrad : `${gold}0F`, border: done ? 'none' : `1px dashed ${gold}30` }}>
                <Icon className="h-3.5 w-3.5" style={{ color: done ? bg1 : tMuted }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: done ? tMain : tMuted }}>{label}</p>
              </div>
              <span className="text-[10px]" style={{ color: tMuted }}>{date}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <div className="rounded-xl p-4 text-center" style={{ background: `${gold}0C`, border: `1px solid ${gold}25` }}>
        <p className="text-sm font-semibold" style={{ color: tMain, fontFamily: serif }}>
          21 dias.
        </p>
        <p className="text-xs mt-1" style={{ color: tBody }}>
          Do primeiro culto ao primeiro registro como membro.<br />
          Fernanda não se perdeu. O sistema a acompanhou.
        </p>
      </div>

      <PastoralWord>
        "A igreja passa a enxergar<br />
        quem entrou, quem permaneceu<br />
        e quem foi consolidado."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 6 — DISCIPULADO
══════════════════════════════════════════════════════════ */

function StepDiscipulado() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={BookMarked} title="Discipulado" sub="O cuidado contínuo — da integração à maturidade espiritual" />
      <JorneyChips active={5} />

      <DemoCard title="Marcos Espirituais — o que o Atalaia acompanha" icon={Target} badge>
        <div className="space-y-2">
          {[
            { marco: 'Encontro com Deus',   pct: 73, desc: '73% dos membros realizaram' },
            { marco: 'Batismo',             pct: 61, desc: '61% dos membros batizados' },
            { marco: 'Curso Lidere',        pct: 44, desc: '44% com curso concluído' },
            { marco: 'LIT (Líder Trein.)', pct: 18, desc: '18% em formação de liderança' },
          ].map(m => (
            <div key={m.marco} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span style={{ color: tBody }}>{m.marco}</span>
                <span style={{ color: gold }}>{m.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${gold}12` }}>
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: goldGrad }} />
              </div>
              <p className="text-[9px]" style={{ color: tMuted }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Alerta — membros estagnados" icon={AlertTriangle}>
        <p className="text-xs leading-relaxed" style={{ color: tBody }}>
          O sistema identificou <strong style={{ color: tMain }}>7 membros com mais de 2 anos de participação</strong> sem realizar nenhum marco espiritual. Eles são listados nominalmente para acompanhamento pastoral direto.
        </p>
        <p className="text-[10px] mt-3" style={{ color: tMuted }}>
          ← Esse tipo de alerta não existia antes do Atalaia. Agora, nenhum membro fica invisível.
        </p>
      </DemoCard>

      <DemoCard title="Discipulados registrados — Célula Rute (este mês)" icon={BookOpen}>
        <div className="space-y-2">
          {[
            { nome: 'Carla Andrade',   marco: 'Encontro com Deus', data: '12/03/2026', ok: true },
            { nome: 'Jorge Santos',    marco: 'Batismo',            data: '08/03/2026', ok: true },
            { nome: 'Beatriz Lima',    marco: 'Curso Lidere',       data: '01/03/2026', ok: true },
            { nome: 'Fernanda Costa',  marco: 'Aguardando Enc. c/ Deus', data: 'Agendado', ok: false },
          ].map(d => (
            <div key={d.nome} className="flex items-center gap-3 py-1.5"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: `${gold}15`, color: gold }}>
                {d.nome.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: d.ok ? tMain : tMuted }}>{d.nome}</p>
                <p className="text-[10px]" style={{ color: tMuted }}>{d.marco}</p>
              </div>
              <span className="text-[10px]" style={{ color: d.ok ? gold : tMuted }}>{d.data}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralWord>
        "Membro não é destino.<br />
        É o começo de uma vida<br />
        mais profunda no Reino."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 7 — SUPERVISOR
══════════════════════════════════════════════════════════ */

function StepSupervisor() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Shield} title="Supervisor" sub="O cuidado de cima — visitando, avaliando, sustentando" />

      <div className="rounded-xl p-4" style={{ background: `${gold}08`, border: `1px solid ${gold}18` }}>
        <p className="text-xs leading-relaxed" style={{ color: tBody }}>
          O supervisor visita as células presencialmente, registra a supervisão no Atalaia e o sistema calcula automaticamente a saúde de cada célula com base nas avaliações.
        </p>
      </div>

      <DemoCard title="Supervisão Presencial — Célula Rute" icon={ClipboardCheck} badge>
        <p className="text-[10px] mb-3" style={{ color: tMuted }}>
          Supervisor: André & Lia Santos · 18/03/2026 · 20h–21h45
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { item: 'Oração Inicial',   ok: true },
            { item: 'Louvor',           ok: true },
            { item: 'Quebra-gelo',      ok: true },
            { item: 'Lição',            ok: true },
            { item: 'Cadeira do Amor',  ok: true },
            { item: 'Oração Final',     ok: true },
            { item: 'Selfie da célula', ok: false },
            { item: 'Pontualidade',     ok: true },
          ].map(c => (
            <span key={c.item} className="text-[10px] px-2 py-1 rounded-lg"
              style={c.ok
                ? { background: `${gold}18`, color: gold }
                : { background: 'rgba(211,47,47,0.1)', color: '#ef5350' }}>
              {c.ok ? '✓' : '✗'} {c.item}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${gold}10` }}>
          <p className="text-[10px]" style={{ color: tMuted }}>Pontuação de saúde: </p>
          <p className="text-2xl font-bold" style={{ color: gold, fontFamily: serif }}>4.2 / 5.0</p>
          <p className="text-[10px]" style={{ color: tMuted }}>Status: <span style={{ color: '#4ade80' }}>Saudável ●</span></p>
        </div>
      </DemoCard>

      <DemoCard title="Radar de Saúde — suas células" icon={Activity}>
        <div className="space-y-2.5">
          <BarStat label="Pontualidade" pct={87} />
          <BarStat label="Lição" pct={75} />
          <BarStat label="Cadeira do Amor" pct={60} />
          <BarStat label="Relatórios em dia" pct={91} />
        </div>
      </DemoCard>

      <DemoCard title="Células no escopo" icon={Users}>
        {[
          { name: 'Célula Rute',  leader: 'Ana & Rodrigo', m: 11, saude: '🟢 Saudável' },
          { name: 'Célula Ester', leader: 'Maria & João',  m: 9,  saude: '🟡 Atenção' },
          { name: 'Célula Miriã', leader: 'Carla & Lucas', m: 14, saude: '🟢 Saudável' },
        ].map((c, i, arr) => (
          <div key={c.name} className="flex items-center justify-between py-2"
            style={i < arr.length - 1 ? { borderBottom: `1px solid ${gold}10` } : {}}>
            <div>
              <p className="text-xs font-semibold" style={{ color: tMain }}>{c.name}</p>
              <p className="text-[10px]" style={{ color: tMuted }}>👫 {c.leader} · {c.m} membros</p>
            </div>
            <span className="text-[10px]">{c.saude}</span>
          </div>
        ))}
      </DemoCard>

      <PastoralWord>
        "O supervisor não fiscaliza.<br />
        Ele cuida das células<br />
        como um pastor cuida do rebanho."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 8 — COORDENADOR
══════════════════════════════════════════════════════════ */

function StepCoordenador() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={ClipboardCheck} title="Coordenador" sub="Visão da coordenação — governança e estratégia" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Users}        label="Membros"       value="94"   />
        <MockStat icon={FileText}     label="Relatórios"    value="12/14" accent />
        <MockStat icon={Shield}       label="Supervisões"   value="9"    />
        <MockStat icon={TrendingUp}   label="Engajamento"   value="86%"  accent />
      </div>

      <DemoCard title="Relatórios por supervisor" icon={BarChart3} badge>
        {[
          { name: 'André & Lia Santos',      sent: 5, total: 5 },
          { name: 'Bruno & Cíntia Ferreira', sent: 4, total: 5 },
          { name: 'Daniel & Priscila Lima',  sent: 3, total: 4 },
        ].map(s => (
          <div key={s.name} className="flex items-center justify-between py-2"
            style={{ borderBottom: `1px solid ${gold}0A` }}>
            <span className="text-xs" style={{ color: tBody }}>{s.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: `${gold}12` }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(s.sent / s.total) * 100}%`, background: goldGrad }} />
              </div>
              <span className="text-[10px]" style={{ color: tMuted }}>{s.sent}/{s.total}</span>
            </div>
          </div>
        ))}
      </DemoCard>

      <DemoCard title="Funil de novas vidas — Coordenação" icon={RefreshCw}>
        {[
          { label: 'Cadastradas no Recomeço', value: 14 },
          { label: 'Em triagem na Central',   value: 4  },
          { label: 'Encaminhadas',             value: 10 },
          { label: 'Integradas em células',   value: 8  },
          { label: 'Convertidas em membros',  value: 5  },
        ].map((f, i) => (
          <div key={f.label} className="flex items-center justify-between py-1.5"
            style={{ borderBottom: `1px solid ${gold}08` }}>
            <span className="text-xs" style={{ color: tBody }}>{f.label}</span>
            <span className="text-sm font-bold" style={{ color: i === 0 ? gold : tMain }}>{f.value}</span>
          </div>
        ))}
      </DemoCard>

      <PastoralWord>
        "O coordenador enxerga o todo<br />
        sem perder o detalhe.<br />
        Esse é o poder do Atalaia."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 9 — LÍDER DE REDE
══════════════════════════════════════════════════════════ */

function StepLiderRede() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Waypoints} title="Líder de Rede" sub="Inteligência e direção estratégica da rede" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Network}    label="Coordenações" value="4"   />
        <MockStat icon={Users}      label="Células"      value="31"  accent />
        <MockStat icon={Heart}      label="Membros"      value="341" />
        <MockStat icon={BarChart3}  label="Engajamento"  value="83%" accent />
      </div>

      <DemoCard title="Saúde da Rede" icon={Target} badge>
        <div className="space-y-2.5">
          <BarStat label="Células ativas (sem alerta)" pct={90} />
          <BarStat label="Relatórios na semana" pct={83} />
          <BarStat label="Supervisões bimestrais" pct={76} />
          <BarStat label="Marcos espirituais" pct={61} />
        </div>
      </DemoCard>

      <DemoCard title="Alertas pastorais" icon={AlertTriangle}>
        <div className="space-y-2">
          {[
            '4 células sem relatório há 2+ semanas',
            '3 supervisões bimestrais pendentes',
            '7 membros sem marcos há mais de 2 anos',
            '1 célula com pontuação crítica (< 3.0)',
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 text-xs"
              style={{ color: tBody, borderBottom: `1px solid ${gold}08` }}>
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" style={{ color: gold }} />
              {a}
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Funil completo — Rede" icon={RefreshCw}>
        {[
          { label: '🙏 Decisões no culto',           value: '38', sub: 'este mês' },
          { label: '💛 Acolhidas pelo Recomeço',      value: '36', sub: '95% de cobertura' },
          { label: '📋 Triadas pela Central',         value: '29', sub: 'encaminhadas' },
          { label: '🏠 Integradas em células',        value: '23', sub: 'frequentando' },
          { label: '✅ Convertidas em membros',       value: '17', sub: '45% de conversão' },
        ].map((f, i) => (
          <div key={i} className="flex items-center justify-between py-1.5"
            style={{ borderBottom: `1px solid ${gold}0C` }}>
            <div>
              <p className="text-xs" style={{ color: tMain }}>{f.label}</p>
              <p className="text-[9px]" style={{ color: tMuted }}>{f.sub}</p>
            </div>
            <span className="text-base font-bold" style={{ color: gold }}>{f.value}</span>
          </div>
        ))}
      </DemoCard>

      <PastoralWord>
        "O líder de rede governa com clareza.<br />
        Ele não precisa adivinhar.<br />
        O Atalaia lhe diz."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 10 — VISÃO PASTORAL (Pastor de Campo + Global)
══════════════════════════════════════════════════════════ */

function StepPastoral() {
  return (
    <div className="space-y-5">
      <SectionHeader icon={Church} title="Visão Pastoral" sub="O que o pastor vê — campo e global" />

      <div className="rounded-xl p-4 space-y-2"
        style={{ background: `${gold}08`, border: `1px solid ${gold}20` }}>
        <p className="text-xs font-semibold" style={{ color: tMain }}>Dois níveis de visão pastoral:</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: goldGrad }}>
              <Church className="h-3 w-3" style={{ color: bg1 }} />
            </div>
            <p style={{ color: tBody }}><strong style={{ color: tMain }}>Pastor de Campo</strong> — enxerga tudo de um campus específico</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: goldGrad }}>
              <Crown className="h-3 w-3" style={{ color: bg1 }} />
            </div>
            <p style={{ color: tBody }}><strong style={{ color: tMain }}>Pastor Global</strong> — visão consolidada de toda a igreja</p>
          </div>
        </div>
      </div>

      <DemoCard title="Dashboard do Pastor de Campo" icon={Church} badge accent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MockStat icon={Heart}      label="Saúde do campo" value="83%" accent />
          <MockStat icon={TrendingUp} label="Engajamento"    value="81%" />
          <MockStat icon={UserCheck}  label="LITs ativos"    value="17"  accent />
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            ['Redes ativas',           '6'],
            ['Células ativas',         '74'],
            ['Membros cadastrados',    '856'],
            ['Relatórios esta semana', '61 de 74'],
            ['Supervisões este mês',   '38'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-1"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <span style={{ color: tMuted }}>{label}</span>
              <span className="font-semibold" style={{ color: tMain }}>{value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Funil pastoral — Do Altar à Consolidação" icon={RefreshCw} badge>
        {[
          { label: '🙏 Decisões no altar',        value: '47', sub: 'este semestre' },
          { label: '💛 Acolhidas pelo Recomeço',  value: '45', sub: '96% de cobertura' },
          { label: '📋 Triadas pela Central',     value: '38', sub: 'encaminhadas' },
          { label: '🏠 Integradas em células',    value: '31', sub: 'frequentando' },
          { label: '✅ Convertidas em membros',   value: '22', sub: '47% de conversão final' },
        ].map((f, i) => (
          <div key={i} className="flex items-center justify-between py-1.5"
            style={{ borderBottom: `1px solid ${gold}0C` }}>
            <div>
              <p className="text-xs" style={{ color: tMain }}>{f.label}</p>
              <p className="text-[9px]" style={{ color: tMuted }}>{f.sub}</p>
            </div>
            <span className="text-lg font-bold" style={{ color: gold }}>{f.value}</span>
          </div>
        ))}
      </DemoCard>

      <DemoCard title="Atenção pastoral — por nome" icon={AlertTriangle}>
        <p className="text-xs leading-relaxed" style={{ color: tBody }}>
          O sistema identifica 5 membros ativos há mais de 2 anos sem nenhum marco espiritual (Encontro com Deus, Batismo, Curso Lidere). Eles são <strong style={{ color: tMain }}>listados nominalmente</strong> para contato pastoral direto.
        </p>
        <p className="text-[10px] mt-3" style={{ color: tMuted }}>
          ← Antes do Atalaia, essa informação não existia. As pessoas se perdiam no crescimento numérico da igreja.
        </p>
      </DemoCard>

      <DemoCard title="Indicadores espirituais" icon={Heart}>
        <div className="space-y-1.5 text-xs">
          {[
            ['Batizados este semestre',         '23'],
            ['Encontros com Deus realizados',   '18'],
            ['Células multiplicadas',           '3'],
            ['Novos líderes formados (LIT)',    '7'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-1"
              style={{ borderBottom: `1px solid ${gold}08` }}>
              <span style={{ color: tBody }}>{label}</span>
              <span className="font-semibold" style={{ color: gold }}>{value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralWord>
        "O pastor não precisa mais adivinhar<br />
        como está o rebanho.<br />
        O Atalaia lhe mostra."
      </PastoralWord>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP 11 — CONCLUSÃO E TESTEMUNHO
══════════════════════════════════════════════════════════ */

function StepConclusao({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="space-y-7">
      <div className="text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: goldGrad }}>
          <Church className="h-7 w-7" style={{ color: bg1 }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: tMain, fontFamily: serif }}>
          Um ecossistema completo
        </h2>
        <p className="text-sm" style={{ color: tBody }}>
          Do altar ao discipulado, cada vida acompanhada.
        </p>
      </div>

      <div className="rounded-2xl p-6 space-y-3"
        style={{ background: `${gold}0C`, border: `1px solid ${gold}28` }}>
        <p className="text-sm font-semibold text-center" style={{ color: gold, fontFamily: serif }}>
          A jornada de Fernanda Costa
        </p>
        <div className="space-y-2">
          {[
            { icon: Radio,     label: 'Culto',     date: '09/03', desc: 'Decisão no altar → registrada pelos Guardiões' },
            { icon: Heart,     label: 'Recomeço',  date: '09/03', desc: 'Acolhida, cadastrada, mensagem enviada' },
            { icon: Network,   label: 'Central',   date: '11/03', desc: 'Match 97% → Célula Rute recomendada' },
            { icon: Home,      label: 'Célula',    date: '11/03', desc: 'Integrada, acompanhada, relatório registrado' },
            { icon: UserCheck, label: 'Membro',    date: '30/03', desc: 'Consolidada — 21 dias depois do culto' },
            { icon: BookMarked,label: 'Discipulado',date: 'Próx.', desc: 'Aguardando Encontro com Deus' },
          ].map(({ icon: Icon, label, date, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: goldGrad }}>
                <Icon className="h-3 w-3" style={{ color: bg1 }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold" style={{ color: tMain }}>{label}</p>
                  <span className="text-[10px]" style={{ color: tMuted }}>{date}</span>
                </div>
                <p className="text-[10px]" style={{ color: tMuted }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-sm leading-relaxed" style={{ color: tBody }}>
        <p>
          O Atalaia nasceu dentro da Igreja do Amor, a partir da vida real da rede. Ele não criou algo artificial — ele <strong style={{ color: tMain }}>organizou o que já existia</strong>, dando forma digital ao cuidado que a igreja já praticava.
        </p>
        <p>
          Não é tecnologia pela tecnologia.<br />
          É <strong style={{ color: tMain }}>pastoreio organizado</strong>.
        </p>
      </div>

      <div className="rounded-2xl p-6 text-center"
        style={{ background: `${gold}12`, border: `1px solid ${gold}30` }}>
        <p className="text-base italic leading-relaxed" style={{ color: tMain, fontFamily: serif }}>
          "Cuidem de todo o rebanho sobre o qual<br />
          o Espírito Santo os colocou como bispos,<br />
          para pastorearem a Igreja de Deus."
        </p>
        <p className="text-xs mt-3" style={{ color: tMuted }}>Atos 20:28</p>
      </div>

      <div className="rounded-2xl p-6 text-center space-y-4"
        style={{ background: `${gold}08`, border: `1px solid ${gold}1E` }}>
        <p className="text-sm font-semibold" style={{ color: gold, fontFamily: serif }}>
          O Atalaia cobre todo o fluxo pastoral
        </p>
        <div className="grid grid-cols-1 gap-2 text-left max-w-xs mx-auto">
          {[
            '🙏 Do altar — decisão acolhida',
            '📋 À Central — discernimento com critério',
            '🏠 À célula — cuidado e integração',
            '👁 À supervisão — saúde acompanhada',
            '🧭 À coordenação — governança e visão',
            '🌐 À rede — inteligência estratégica',
            '✝️ Ao pastoreio — responsabilidade espiritual',
          ].map(item => (
            <p key={item} className="text-xs" style={{ color: tBody }}>{item}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ background: `${gold}0C`, border: `1px solid ${gold}25` }}>
        <p className="text-xs italic leading-relaxed" style={{ color: gold, fontFamily: serif }}>
          "Filho do homem, eu te coloquei como atalaia<br />para a casa de Israel."
        </p>
        <p className="text-[10px] mt-2" style={{ color: tMuted }}>Ezequiel 3:17</p>
      </div>

      <div className="text-center space-y-4">
        <p className="text-xs" style={{ color: tMuted }}>
          Demonstração preparada com carinho para<br />
          <strong style={{ color: tBody }}>Pastor Arthur & Pastora Talita</strong>
        </p>
        <Button onClick={onRestart} variant="ghost" size="sm"
          className="gap-2 rounded-full px-6 mx-auto"
          style={{ color: gold, border: `1px solid ${gold}30` }}>
          <BookOpen className="h-4 w-4" />
          Rever demonstração
        </Button>
        <AtalaiaFooterSignature />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STEP MAP & NAVIGATION
══════════════════════════════════════════════════════════ */

const STEPS = [
  { label: 'Boas-vindas',    key: 'bemvindo'     },
  { label: 'O Culto',        key: 'culto'         },
  { label: 'Recomeço',       key: 'recomeco'      },
  { label: 'Central',        key: 'central'       },
  { label: 'A Célula',       key: 'celula'        },
  { label: 'Membro',         key: 'membro'        },
  { label: 'Discipulado',    key: 'discipulado'   },
  { label: 'Supervisor',     key: 'supervisor'    },
  { label: 'Coordenador',    key: 'coordenador'   },
  { label: 'Líder de Rede',  key: 'lider_rede'    },
  { label: 'Visão Pastoral', key: 'pastoral'      },
  { label: 'Conclusão',      key: 'conclusao'     },
] as const;

const TOTAL = STEPS.length;

/* ══════════════════════════════════════════════════════════
   MAIN PAGE EXPORT
══════════════════════════════════════════════════════════ */

// Small inline clock icon (avoids naming clash with lucide Clock)
function Clock_({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <Calendar className={className} style={style} />;
}

export default function DemoPastorArthur() {
  const [step, setStep] = useState(0);

  const next    = () => setStep(s => Math.min(s + 1, TOTAL - 1));
  const prev    = () => setStep(s => Math.max(s - 1, 0));
  const restart = () => setStep(0);
  const goFree  = () => setStep(1); // skip welcome, start from culto

  return (
    <div className="min-h-screen"
      style={{ background: `linear-gradient(160deg, ${bg1} 0%, ${bg2} 50%, ${bg1} 100%)` }}>
      <div className="max-w-xl mx-auto px-5 py-8 sm:py-12">

        {/* Progress bar — only after welcome */}
        {step > 0 && (
          <div className="mb-8 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: tMuted }}>
                  {STEPS[step].label}
                </span>
                <span className="text-[10px] ml-2" style={{ color: tMuted }}>
                  {step} / {TOTAL - 1}
                </span>
              </div>
              <DemoBadge label="PASTOR ARTHUR" />
            </div>
            <div className="h-0.5 rounded-full overflow-hidden" style={{ background: `${gold}15` }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / (TOTAL - 1)) * 100}%`, background: goldGrad }} />
            </div>
            {/* Step pills */}
            <div className="flex gap-1 flex-wrap">
              {STEPS.slice(1).map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => setStep(i + 1)}
                  className="text-[9px] px-2 py-0.5 rounded-full transition-all"
                  style={step === i + 1
                    ? { background: goldGrad, color: bg1, fontWeight: 700 }
                    : step > i + 1
                    ? { background: `${gold}20`, color: gold }
                    : { background: `${gold}08`, color: tMuted }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Animated step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            {step === 0  && <StepBemVindo onNext={next} onFree={goFree} />}
            {step === 1  && <StepCulto />}
            {step === 2  && <StepRecomeco />}
            {step === 3  && <StepCentral />}
            {step === 4  && <StepCelula />}
            {step === 5  && <StepMembro />}
            {step === 6  && <StepDiscipulado />}
            {step === 7  && <StepSupervisor />}
            {step === 8  && <StepCoordenador />}
            {step === 9  && <StepLiderRede />}
            {step === 10 && <StepPastoral />}
            {step === 11 && <StepConclusao onRestart={restart} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && step < TOTAL - 1 && (
          <div className="flex items-center justify-between pt-8 mt-4"
            style={{ borderTop: `1px solid ${gold}12` }}>
            <Button variant="ghost" size="sm" onClick={prev}
              className="gap-1.5 rounded-full px-4" style={{ color: tMuted }}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <button onClick={restart}
              className="text-[10px] underline underline-offset-2" style={{ color: tMuted }}>
              Reiniciar
            </button>

            <Button size="sm" onClick={next}
              className="gap-1.5 rounded-full px-5"
              style={{ background: goldGrad, color: bg1, fontWeight: 700 }}>
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === TOTAL - 1 && (
          <div className="flex justify-center pt-6 mt-2"
            style={{ borderTop: `1px solid ${gold}10` }}>
            <Button variant="ghost" size="sm" onClick={prev}
              className="gap-1.5 rounded-full px-4" style={{ color: tMuted }}>
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-4 text-center" style={{ borderTop: `1px solid ${gold}0C` }}>
          <div className="flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" style={{ color: `${gold}50` }} />
            <p className="text-[10px]" style={{ color: tMuted }}>
              Modo demonstração · Dados ilustrativos · Nenhum dado real é alterado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
