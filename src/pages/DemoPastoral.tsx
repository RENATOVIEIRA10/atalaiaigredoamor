import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Heart, Users, Shield, Eye, Church, Crown, Waypoints,
  ChevronRight, ChevronLeft, ChevronDown, BookOpen,
  FileText, Star, AlertTriangle, BarChart3, CheckCircle2,
  Baby, Calendar, Activity, Target, Sparkles, UserCheck,
  TrendingUp, MessageCircle, MapPin, Phone, ArrowRight,
  RefreshCw, ClipboardCheck, Network, Search, UserPlus
} from 'lucide-react';

/* ─── Constants ─── */
const gold = '#C5A059';
const textMain = '#F4EDE4';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const headingFont = "'Outfit', sans-serif";

/* ─── Shared UI Pieces ─── */

function DemoBadge() {
  return (
    <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: `${gold}50`, color: gold, background: `${gold}15` }}>
      <Eye className="h-3 w-3 mr-1" />
      DEMONSTRAÇÃO
    </Badge>
  );
}

function PastoralMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 text-center" style={{ background: `${gold}0F`, border: `1px solid ${gold}26` }}>
      <Heart className="h-5 w-5 mx-auto mb-2" style={{ color: gold }} />
      <p className="text-sm italic leading-relaxed" style={{ color: textMain, fontFamily: headingFont }}>
        {children}
      </p>
    </div>
  );
}

function MockStat({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ background: `${gold}0A`, border: `1px solid ${gold}1A` }}>
      <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: accent ? gold : textMuted }} />
      <p className="text-lg font-bold" style={{ color: textMain }}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: textMuted }}>{label}</p>
    </div>
  );
}

function DemoCard({ title, icon: Icon, badge, children }: {
  title: string; icon: React.ElementType; badge?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: `${gold}08`, border: `1px solid ${gold}1A` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${gold}12` }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: gold }} />
          <h3 className="text-sm font-semibold" style={{ color: textMain, fontFamily: headingFont }}>{title}</h3>
        </div>
        {badge && <DemoBadge />}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ProgressItem({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: textMuted }}>{label}</span>
        <span className="font-medium" style={{ color: textMain }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${gold}15` }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${gold}, #D4B366)` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 0: TELA INICIAL — PROPÓSITO
   ═══════════════════════════════════════════════════ */

function StepProposito({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center py-8 sm:py-14 space-y-8">
      <AtalaiaLogoHeader size="sm" />

      <div className="space-y-3">
        <h1 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: headingFont, color: textMain, letterSpacing: '-0.02em' }}>
          ATALAIA
        </h1>
        <p className="text-sm sm:text-base" style={{ color: gold, fontFamily: headingFont }}>
          Saúde e Cuidado da Rede Amor a Dois
        </p>
        <p className="text-xs" style={{ color: textMuted }}>A serviço da Igreja do Amor</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="h-px w-16 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
        <p className="text-sm leading-relaxed" style={{ color: textBody }}>
          O Atalaia nasceu como resposta a um chamado.<br />
          Não para substituir pessoas,<br />
          mas para organizar o cuidado.
        </p>
        <p className="text-base font-semibold" style={{ color: gold, fontFamily: headingFont }}>
          Do altar à célula.<br />
          Da decisão ao acompanhamento.
        </p>
        <div className="h-px w-16 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
      </div>

      <div className="pt-4">
        <p className="text-xs mb-3" style={{ color: textMuted }}>
          Demonstração preparada para o Pastor Fábio
        </p>
        <Button onClick={onNext} size="lg" className="gap-2 rounded-full px-8"
          style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)`, color: '#1A2F4B' }}>
          Entrar na demonstração
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 1: RECOMEÇO
   ═══════════════════════════════════════════════════ */

function StepRecomeco() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <Heart className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Porta de Entrada</h2>
          <p className="text-xs" style={{ color: textMuted }}>Onde começa o cuidado com cada nova vida</p>
        </div>
      </div>

      <DemoCard title="Nova Vida Cadastrada" icon={UserPlus} badge>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${gold}26`, color: gold }}>JS</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: textMain }}>Julia Santos</p>
              <p className="text-xs" style={{ color: textMuted }}>Decisão no culto de domingo · 16/02/2026</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5" style={{ color: textBody }}>
              <Phone className="h-3 w-3" style={{ color: gold }} /> (81) 99999-1234
            </div>
            <div className="flex items-center gap-1.5" style={{ color: textBody }}>
              <MapPin className="h-3 w-3" style={{ color: gold }} /> Casa Caiada, Olinda
            </div>
            <div className="flex items-center gap-1.5" style={{ color: textBody }}>
              <Heart className="h-3 w-3" style={{ color: gold }} /> Casada
            </div>
            <div className="flex items-center gap-1.5" style={{ color: textBody }}>
              <Users className="h-3 w-3" style={{ color: gold }} /> 25–35 anos
            </div>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Mensagem de Boas-Vindas" icon={MessageCircle}>
        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: '#0e0e10', color: textBody, border: `1px solid ${gold}12` }}>
          <p>Olá, Julia! 🤗</p>
          <p className="mt-1">Que alegria saber da sua decisão! A equipe do Recomeço está aqui para te acompanhar nessa nova caminhada. Em breve vamos te conectar com uma família de célula perto de você.</p>
          <p className="mt-1" style={{ color: gold }}>— Equipe Recomeço · Igreja do Amor</p>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px]" style={{ color: textMuted }}>Mensagem enviada via WhatsApp</span>
        </div>
      </DemoCard>

      <DemoCard title="Status da Jornada" icon={Activity}>
        <div className="flex items-center gap-2">
          {['Nova', 'Contatada', 'Encaminhada'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className="h-6 px-3 rounded-full flex items-center text-[10px] font-semibold"
                style={i <= 1 ? { background: `${gold}26`, color: gold } : { background: `${gold}0A`, color: textMuted, border: `1px dashed ${gold}33` }}>
                {i <= 1 ? '✓' : ''} {s}
              </div>
              {i < 2 && <ArrowRight className="h-3 w-3" style={{ color: `${gold}40` }} />}
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralMessage>
        "Aqui começa o cuidado.<br />Nenhuma vida se perde."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 2: CENTRAL DE CÉLULAS
   ═══════════════════════════════════════════════════ */

function StepCentral() {
  const celulas = [
    { name: 'Célula Rute', bairro: 'Casa Caiada', dist: '0.8 km', members: 12, match: 95 },
    { name: 'Célula Ester', bairro: 'Rio Doce', dist: '2.1 km', members: 9, match: 78 },
    { name: 'Célula Miriã', bairro: 'Maranguape', dist: '3.5 km', members: 15, match: 62 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <Search className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Central de Células</h2>
          <p className="text-xs" style={{ color: textMuted }}>Discernimento e encaminhamento com critério</p>
        </div>
      </div>

      <DemoCard title="Vida na Fila de Triagem" icon={UserPlus} badge>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${gold}26`, color: gold }}>JS</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: textMain }}>Julia Santos</p>
            <p className="text-xs" style={{ color: textMuted }}>Casada · Casa Caiada · 25–35 anos</p>
          </div>
        </div>
      </DemoCard>

      <DemoCard title="Células Sugeridas (por proximidade e perfil)" icon={MapPin}>
        <div className="space-y-2.5">
          {celulas.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between py-2"
              style={i < celulas.length - 1 ? { borderBottom: `1px solid ${gold}12` } : {}}>
              <div>
                <p className="text-sm font-medium" style={{ color: textMain }}>{c.name}</p>
                <p className="text-xs" style={{ color: textMuted }}>{c.bairro} · {c.dist} · {c.members} membros</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold" style={{ color: i === 0 ? gold : textMuted }}>{c.match}%</span>
                <p className="text-[9px]" style={{ color: textMuted }}>match</p>
              </div>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Encaminhamento Realizado" icon={CheckCircle2}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" style={{ color: gold }} />
          <div>
            <p className="text-sm" style={{ color: textMain }}>
              Julia encaminhada para <strong>Célula Rute</strong> (Casa Caiada)
            </p>
            <p className="text-[10px]" style={{ color: textMuted }}>O líder será notificado para iniciar o acolhimento</p>
          </div>
        </div>
      </DemoCard>

      <PastoralMessage>
        "A Central não distribui vidas.<br />Ela discerne caminhos."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 3: LÍDER DE CÉLULA
   ═══════════════════════════════════════════════════ */

function StepLiderCelula() {
  const statusJornada = [
    { label: 'Contatada', done: true },
    { label: 'Agendada', done: true },
    { label: 'Integrada', done: false },
    { label: 'Membro', done: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <UserCheck className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Líder de Célula</h2>
          <p className="text-xs" style={{ color: textMuted }}>O cuidado na ponta — pessoas cuidando de pessoas</p>
        </div>
      </div>

      <DemoCard title="Nova Vida Recebida" icon={Heart} badge>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${gold}26`, color: gold }}>JS</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: textMain }}>Julia Santos</p>
            <p className="text-xs" style={{ color: textMuted }}>Encaminhada pela Central · Casa Caiada</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusJornada.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                style={s.done ? { background: `${gold}26`, color: gold } : { background: `${gold}08`, color: textMuted, border: `1px dashed ${gold}33` }}>
                {s.done ? '✓ ' : ''}{s.label}
              </span>
              {i < statusJornada.length - 1 && <ArrowRight className="h-3 w-3" style={{ color: `${gold}30` }} />}
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Relatório Semanal — Célula Rute" icon={FileText}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MockStat icon={Users} label="Presentes" value="13" />
          <MockStat icon={Star} label="Visitantes" value="2" accent />
          <MockStat icon={Heart} label="Discipulados" value="3" />
          <MockStat icon={Baby} label="Crianças" value="4" />
        </div>
        <p className="text-[10px] mt-3 flex items-center gap-1.5" style={{ color: textMuted }}>
          <Calendar className="h-3 w-3" /> Semana 17–23/02 · Terça 20h
        </p>
      </DemoCard>

      <DemoCard title="Membros da Célula" icon={Users}>
        <div className="space-y-1.5">
          {['Ana Costa', 'Pedro Santos', 'Maria Oliveira', 'João Silva', 'Julia Santos (nova)'].map((m) => (
            <div key={m} className="flex items-center gap-2 py-1" style={m.includes('nova') ? { } : { borderBottom: `1px solid ${gold}08` }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${gold}15`, color: gold }}>
                {m.charAt(0)}
              </div>
              <span className="text-xs" style={{ color: m.includes('nova') ? gold : textBody }}>
                {m}
              </span>
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralMessage>
        "O cuidado acontece aqui.<br />Pessoas cuidando de pessoas."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 4: SUPERVISOR
   ═══════════════════════════════════════════════════ */

function StepSupervisor() {
  const checkItems = [
    { label: 'Oração Inicial', ok: true }, { label: 'Louvor', ok: true },
    { label: 'Quebra-gelo', ok: true }, { label: 'Lição', ok: true },
    { label: 'Cadeira do Amor', ok: true }, { label: 'Oração Final', ok: true },
    { label: 'Selfie', ok: false }, { label: 'Pontualidade', ok: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <Shield className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Supervisor</h2>
          <p className="text-xs" style={{ color: textMuted }}>Acompanhamento e saúde das células</p>
        </div>
      </div>

      <DemoCard title="Células Supervisionadas" icon={Users} badge>
        {[
          { name: 'Célula Rute', leader: 'Ana & Pedro', m: 13, report: '20/02' },
          { name: 'Célula Ester', leader: 'Maria & João', m: 9, report: '19/02' },
          { name: 'Célula Miriã', leader: 'Carla & Lucas', m: 15, report: '21/02' },
        ].map((c, i, arr) => (
          <div key={c.name} className="flex items-center justify-between py-2"
            style={i < arr.length - 1 ? { borderBottom: `1px solid ${gold}12` } : {}}>
            <div>
              <p className="text-sm font-medium" style={{ color: textMain }}>{c.name}</p>
              <p className="text-[10px]" style={{ color: textMuted }}>👫 {c.leader}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: textMain }}>{c.m}</p>
              <p className="text-[9px]" style={{ color: textMuted }}>Último: {c.report}</p>
            </div>
          </div>
        ))}
      </DemoCard>

      <DemoCard title="Supervisão Realizada" icon={ClipboardCheck}>
        <p className="text-[10px] mb-2" style={{ color: textMuted }}>Célula Rute · 18/02 · 20h–21h30</p>
        <div className="flex flex-wrap gap-1.5">
          {checkItems.map(c => (
            <span key={c.label} className="text-[10px] px-2 py-0.5 rounded-full"
              style={c.ok ? { background: `${gold}20`, color: gold } : { background: 'rgba(211,47,47,0.1)', color: '#ef5350' }}>
              {c.ok ? '✓' : '✗'} {c.label}
            </span>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Radar de Saúde" icon={Activity}>
        <div className="space-y-2">
          <ProgressItem label="Pontualidade" pct={85} />
          <ProgressItem label="Louvor" pct={100} />
          <ProgressItem label="Lição" pct={70} />
          <ProgressItem label="Cadeira do Amor" pct={55} />
        </div>
      </DemoCard>

      <PastoralMessage>
        "O supervisor sustenta o cuidado."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 5: COORDENADOR
   ═══════════════════════════════════════════════════ */

function StepCoordenador() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <ClipboardCheck className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Coordenador</h2>
          <p className="text-xs" style={{ color: textMuted }}>Visão e governança da coordenação</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Users} label="Membros" value="87" />
        <MockStat icon={FileText} label="Relatórios" value="12/14" accent />
        <MockStat icon={Shield} label="Supervisões" value="8" />
        <MockStat icon={TrendingUp} label="Engajamento" value="86%" accent />
      </div>

      <DemoCard title="Engajamento de Relatórios" icon={BarChart3} badge>
        {[
          { name: 'Sup. André & Lia', sent: 5, total: 5 },
          { name: 'Sup. Bruno & Cíntia', sent: 4, total: 5 },
          { name: 'Sup. Daniel & Priscila', sent: 3, total: 4 },
        ].map(s => (
          <div key={s.name} className="flex items-center justify-between py-1.5">
            <span className="text-xs" style={{ color: textBody }}>{s.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: `${gold}15` }}>
                <div className="h-full rounded-full" style={{ width: `${(s.sent / s.total) * 100}%`, background: gold }} />
              </div>
              <span className="text-[10px]" style={{ color: textMuted }}>{s.sent}/{s.total}</span>
            </div>
          </div>
        ))}
      </DemoCard>

      <DemoCard title="Funil de Novas Vidas" icon={RefreshCw}>
        <div className="space-y-1.5">
          {[
            { label: 'Cadastradas (Recomeço)', value: 12 },
            { label: 'Em triagem (Central)', value: 3 },
            { label: 'Encaminhadas', value: 8 },
            { label: 'Integradas na célula', value: 6 },
            { label: 'Convertidas em membro', value: 4 },
          ].map((f, i) => (
            <div key={f.label} className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${gold}08` }}>
              <span className="text-xs" style={{ color: textBody }}>{f.label}</span>
              <span className="text-sm font-bold" style={{ color: i === 0 ? gold : textMain }}>{f.value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <PastoralMessage>
        "O coordenador enxerga o todo<br />sem perder o detalhe."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 6: LÍDER DE REDE
   ═══════════════════════════════════════════════════ */

function StepLiderRede() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <Waypoints className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Líder de Rede</h2>
          <p className="text-xs" style={{ color: textMuted }}>Inteligência e direção estratégica</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Network} label="Coordenações" value="4" />
        <MockStat icon={Users} label="Células" value="28" accent />
        <MockStat icon={Heart} label="Membros" value="312" />
        <MockStat icon={BarChart3} label="Engajamento" value="82%" accent />
      </div>

      <DemoCard title="Saúde da Rede" icon={Target} badge>
        <div className="space-y-2">
          <ProgressItem label="Células ativas" pct={93} />
          <ProgressItem label="Relatórios enviados" pct={82} />
          <ProgressItem label="Supervisões realizadas" pct={75} />
          <ProgressItem label="Marcos espirituais" pct={58} />
        </div>
      </DemoCard>

      <DemoCard title="Alertas da Rede" icon={AlertTriangle}>
        {[
          '3 células sem relatório esta semana',
          '2 supervisões pendentes no bimestre',
          '5 membros com estagnação espiritual (>2 anos)',
        ].map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-xs py-1.5" style={{ color: textBody }}>
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" style={{ color: gold }} />
            {a}
          </div>
        ))}
      </DemoCard>

      <PastoralMessage>
        "O líder de rede governa com clareza."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 7: VISÃO PASTORAL
   ═══════════════════════════════════════════════════ */

function StepPastoral() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <Church className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Visão Pastoral</h2>
          <p className="text-xs" style={{ color: textMuted }}>Dados consolidados para decisões espirituais</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MockStat icon={Heart} label="Saúde Geral" value="84%" accent />
        <MockStat icon={TrendingUp} label="Engajamento" value="82%" />
        <MockStat icon={UserCheck} label="Líderes Trein." value="14" accent />
      </div>

      <DemoCard title="Funil Completo — Do Altar à Célula" icon={RefreshCw} badge>
        <div className="space-y-2">
          {[
            { label: '🙏 Decisões no altar', value: '47', sub: 'este semestre' },
            { label: '💛 Acolhidas pelo Recomeço', value: '45', sub: '96% de cobertura' },
            { label: '📋 Triadas pela Central', value: '38', sub: 'encaminhadas' },
            { label: '🏠 Integradas em células', value: '31', sub: 'frequentando' },
            { label: '✅ Convertidas em membros', value: '22', sub: '47% de conversão' },
          ].map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${gold}0F` }}>
              <div>
                <p className="text-xs" style={{ color: textMain }}>{f.label}</p>
                <p className="text-[9px]" style={{ color: textMuted }}>{f.sub}</p>
              </div>
              <span className="text-base font-bold" style={{ color: gold }}>{f.value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Indicadores Pastorais" icon={Heart}>
        <div className="space-y-1.5 text-xs">
          {[
            ['Membros ativos na rede', '312'],
            ['Batizados este ano', '23'],
            ['Encontro com Deus realizados', '18'],
            ['Células multiplicadas', '3'],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between py-1" style={{ borderBottom: `1px solid ${gold}08` }}>
              <span style={{ color: textBody }}>{label}</span>
              <span className="font-semibold" style={{ color: textMain }}>{value}</span>
            </div>
          ))}
        </div>
      </DemoCard>

      <DemoCard title="Atenção Pastoral" icon={AlertTriangle}>
        <p className="text-xs leading-relaxed" style={{ color: textBody }}>
          5 membros ativos há mais de 2 anos sem os marcos básicos (Encontro com Deus, Batismo ou Curso Lidere). Identificados nominalmente para acompanhamento espiritual direto.
        </p>
      </DemoCard>

      <PastoralMessage>
        "O Atalaia não é sobre números.<br />É sobre responsabilidade espiritual."
      </PastoralMessage>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STEP 8: TESTEMUNHO INSTITUCIONAL
   ═══════════════════════════════════════════════════ */

function StepTestemunho() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)` }}>
          <BookOpen className="h-5 w-5 text-[#1A2F4B]" />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: gold, fontFamily: headingFont }}>Testemunho Institucional</h2>
          <p className="text-xs" style={{ color: textMuted }}>A história por trás do Atalaia</p>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-relaxed" style={{ color: textBody }}>
        <p>
          Antes do Atalaia existir como sistema, houve uma <strong style={{ color: textMain }}>palavra sobre criatividade</strong>. Não sobre tecnologia — mas sobre a disposição de colocar os dons a serviço do que é eterno.
        </p>
        <p>
          Deus não revelou o projeto. Revelou o <strong style={{ color: textMain }}>propósito</strong>. O projeto veio depois — como fruto de obediência.
        </p>
        <p>
          O Atalaia nasceu dentro da Igreja do Amor, a partir daquilo que já existia na vida real da rede. Ele não criou algo artificial — ele <strong style={{ color: textMain }}>organizou o que já existia</strong>, dando forma digital ao cuidado que a igreja já praticava.
        </p>
        <p>
          Com o tempo, Deus conduziu esse chamado para algo ainda maior. O Atalaia se tornou um <strong style={{ color: textMain }}>ecossistema completo</strong>: do altar ao Recomeço, da Central de Células ao cuidado contínuo nas células e na rede.
        </p>
      </div>

      <div className="rounded-xl p-6 text-center" style={{ background: `${gold}14`, border: `1px solid ${gold}2E` }}>
        <p className="text-base italic leading-relaxed" style={{ color: textMain, fontFamily: headingFont }}>
          "O que começou como uma palavra pessoal<br />se tornou um serviço coletivo."
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed" style={{ color: textBody }}>
        <p>
          Hoje, o Atalaia é um instrumento de <strong style={{ color: textMain }}>cuidado, zelo e responsabilidade pastoral</strong>. Ele não substitui liderança. Não tem finalidade comercial. É um serviço ao Reino.
        </p>
      </div>

      <div className="rounded-xl p-5" style={{ background: `${gold}0F`, border: `1px solid ${gold}1F` }}>
        <p className="text-sm italic leading-relaxed mb-2" style={{ color: gold, fontFamily: headingFont }}>
          "Filho do homem, eu te coloquei como atalaia para a casa de Israel."
        </p>
        <p className="text-xs" style={{ color: textMuted }}>Ezequiel 3:17</p>
      </div>

      {/* Final summary */}
      <div className="space-y-3 pt-2">
        <div className="text-center">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-3" style={{ color: gold }} />
          <h3 className="text-base font-bold mb-2" style={{ color: textMain, fontFamily: headingFont }}>
            O Atalaia cobre todo o fluxo pastoral
          </h3>
        </div>
        {[
          '🙏 Do altar — decisão acolhida pelo Recomeço',
          '📋 À Central — discernimento e encaminhamento',
          '🏠 À célula — cuidado, integração e discipulado',
          '👁 À supervisão — acompanhamento e saúde',
          '🧭 À coordenação — visão e governança',
          '🌐 À rede — inteligência e direção',
          '✝️ Ao pastoreio — responsabilidade espiritual',
        ].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs" style={{ color: textBody }}>
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6 text-center mt-4" style={{ background: `${gold}0F`, border: `1px solid ${gold}26` }}>
        <p className="text-sm italic leading-relaxed mb-3" style={{ color: gold, fontFamily: headingFont }}>
          "Cuidem de todo o rebanho sobre o qual o Espírito Santo os colocou como bispos, para pastorearem a igreja de Deus."
        </p>
        <p className="text-[10px]" style={{ color: textMuted }}>Atos 20:28</p>
      </div>

      <div className="text-center pt-2">
        <AtalaiaFooterSignature />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

const TOTAL_STEPS = 9;

const stepLabels = [
  'Propósito',
  'Recomeço',
  'Central de Células',
  'Líder de Célula',
  'Supervisor',
  'Coordenador',
  'Líder de Rede',
  'Visão Pastoral',
  'Testemunho',
];

export default function DemoPastoral() {
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1A2F4B 40%, #121212 100%)' }}>
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">

        {/* Progress */}
        {step > 0 && (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: textMuted }}>
                {stepLabels[step]} · {step}/{TOTAL_STEPS - 1}
              </span>
              <DemoBadge />
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${gold}15` }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%`, background: `linear-gradient(90deg, ${gold}, #D4B366)` }} />
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {step === 0 && <StepProposito onNext={next} />}
            {step === 1 && <StepRecomeco />}
            {step === 2 && <StepCentral />}
            {step === 3 && <StepLiderCelula />}
            {step === 4 && <StepSupervisor />}
            {step === 5 && <StepCoordenador />}
            {step === 6 && <StepLiderRede />}
            {step === 7 && <StepPastoral />}
            {step === 8 && <StepTestemunho />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step > 0 && (
          <div className="flex items-center justify-between pt-6 mt-4" style={{ borderTop: `1px solid ${gold}15` }}>
            <Button variant="ghost" size="sm" onClick={prev} className="gap-1.5 rounded-full px-4"
              style={{ color: textMuted }}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button size="sm" onClick={next} className="gap-1.5 rounded-full px-5"
                style={{ background: `linear-gradient(135deg, ${gold}, #D4B366)`, color: '#1A2F4B' }}>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="gap-1.5 rounded-full px-4"
                style={{ color: gold }}>
                <BookOpen className="h-4 w-4" />
                Voltar ao início
              </Button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 space-y-2 text-center" style={{ borderTop: `1px solid ${gold}10` }}>
          <div className="flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" style={{ color: `${gold}60` }} />
            <p className="text-[10px]" style={{ color: textMuted }}>
              Modo demonstração · Somente leitura · Nenhum dado real é alterado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}