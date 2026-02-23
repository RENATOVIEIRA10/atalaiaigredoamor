import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, Heart, ClipboardCheck, Network, Shield,
  ChevronRight, ChevronLeft, ChevronDown, Eye,
  Calendar, FileText, Star, AlertTriangle,
  BarChart3, CheckCircle2, Church, Baby,
  BookOpen, MapPin, TrendingUp, UserCheck,
  Activity, Target, Sparkles
} from 'lucide-react';

/* ─── Shared UI ─── */

function DemoBadge() {
  return (
    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 bg-amber-50 dark:bg-amber-950/30 shrink-0">
      <Eye className="h-3 w-3 mr-1" />
      DEMONSTRAÇÃO
    </Badge>
  );
}

function DemoFooter() {
  return (
    <div className="mt-8 pt-4 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <Shield className="h-3 w-3 text-primary/50" />
        <p className="text-[11px] text-muted-foreground/70 text-center font-medium">
          Privacidade e segurança são pilares deste sistema.
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center italic leading-relaxed">
        O Atalaia é uma ferramenta interna, criada por amor à igreja,<br />
        sem qualquer finalidade comercial.
      </p>
    </div>
  );
}

function RoleHeader({ icon: Icon, emoji, title, description }: {
  icon: React.ElementType;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-lg">
            {emoji}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PedagogicalNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-3">
      <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed italic">{text}</p>
    </div>
  );
}

function MockStat({ icon: Icon, label, value, color = 'text-primary' }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 text-center space-y-1">
      <Icon className={`h-4 w-4 mx-auto ${color}`} />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── STEP 0: Introduction ─── */

function StepIntro({ onNext }: { onNext: () => void }) {
  const hierarchy = [
    { icon: Users, label: 'Líder de Célula', color: 'bg-emerald-500' },
    { icon: Shield, label: 'Supervisor', color: 'bg-blue-500' },
    { icon: ClipboardCheck, label: 'Coordenador', color: 'bg-violet-500' },
    { icon: Network, label: 'Líder de Rede', color: 'bg-amber-500' },
    { icon: Church, label: 'Pastores', color: 'bg-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">
          Como o Atalaia funciona na prática
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          O Atalaia organiza o cuidado da igreja respeitando a hierarquia.
          Cada liderança vê apenas o que é da sua responsabilidade,
          e as informações sobem de forma organizada até a liderança pastoral.
        </p>
      </div>

      <div className="flex flex-col items-center gap-1 py-4">
        {hierarchy.map((item, i) => (
          <div key={item.label} className="flex flex-col items-center">
            <div className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 shadow-sm w-64">
              <div className={`h-9 w-9 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </div>
            {i < hierarchy.length - 1 && (
              <ChevronDown className="h-5 w-5 text-muted-foreground/40 my-0.5" />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={onNext} className="gap-2" size="lg">
          Explorar o sistema por função
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── STEP 1: Cell Leader Demo ─── */

function StepCelula() {
  const mockMembers = [
    { name: 'Ana Costa', marcos: 3, birthday: '15/03' },
    { name: 'Pedro Santos', marcos: 2, birthday: null },
    { name: 'Maria Oliveira', marcos: 4, birthday: '22/02' },
    { name: 'João Silva', marcos: 1, birthday: null },
    { name: 'Carla Mendes', marcos: 3, birthday: null },
  ];

  return (
    <div className="space-y-4">
      <RoleHeader
        icon={Users}
        emoji="👤"
        title="Visão do Líder de Célula"
        description="Aqui é onde os dados começam: membros, relatórios e acompanhamento semanal."
      />

      {/* Mock Weekly Report */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Relatório Semanal — Célula Rute
            </CardTitle>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MockStat icon={Users} label="Presentes" value="12" />
            <MockStat icon={Star} label="Visitantes" value="3" color="text-amber-500" />
            <MockStat icon={Heart} label="Discipulados" value="2" color="text-rose-500" />
            <MockStat icon={Baby} label="Crianças" value="4" color="text-emerald-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            Semana de 17/02 a 23/02 — Terça-feira às 20h
          </p>
        </CardContent>
      </Card>

      {/* Mock Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Membros da Célula
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockMembers.map(m => (
            <div key={m.name} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {m.name.charAt(0)}
                </div>
                <span className="text-sm text-foreground">{m.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {m.birthday && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                    🎂 {m.birthday}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{m.marcos}/5 marcos</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PedagogicalNote text="Tudo o que é registrado aqui alimenta automaticamente os níveis acima." />
    </div>
  );
}

/* ─── STEP 2: Supervisor Demo ─── */

function StepSupervisor() {
  const mockCelulas = [
    { name: 'Célula Rute', leader: 'Ana & Pedro', members: 12, lastReport: '20/02' },
    { name: 'Célula Ester', leader: 'Maria & João', members: 9, lastReport: '19/02' },
    { name: 'Célula Miriã', leader: 'Carla & Lucas', members: 15, lastReport: '21/02' },
  ];

  const checklistItems = [
    'Oração Inicial', 'Louvor', 'Quebra-gelo', 'Lição',
    'Cadeira do Amor', 'Oração Final', 'Selfie', 'Pontualidade'
  ];

  return (
    <div className="space-y-4">
      <RoleHeader
        icon={Shield}
        emoji="👥"
        title="Visão do Supervisor"
        description="O supervisor acompanha várias células e garante saúde e alinhamento."
      />

      {/* Supervised Cells */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Células Supervisionadas
            </CardTitle>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockCelulas.map(c => (
            <div key={c.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">👫 {c.leader}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{c.members} membros</p>
                <p className="text-[10px] text-muted-foreground">Último: {c.lastReport}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mock Supervision Record */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Supervisão Realizada — Exemplo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">Célula Rute · 18/02/2026 · 20h–21h30</p>
          <div className="flex flex-wrap gap-1.5">
            {checklistItems.map((item, i) => (
              <span
                key={item}
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  i < 6
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {i < 6 ? '✓' : '✗'} {item}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mock Health Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Radar de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Pontualidade', pct: 85 },
            { label: 'Louvor', pct: 100 },
            { label: 'Lição', pct: 70 },
            { label: 'Cadeira do Amor', pct: 55 },
          ].map(item => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.pct}%</span>
              </div>
              <Progress value={item.pct} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      <PedagogicalNote text="O supervisor não cria dados novos: ele acompanha e valida o que vem das células." />
    </div>
  );
}

/* ─── STEP 3: Coordinator Demo ─── */

function StepCoordenador() {
  return (
    <div className="space-y-4">
      <RoleHeader
        icon={ClipboardCheck}
        emoji="🧭"
        title="Visão do Coordenador"
        description="Aqui acontece a consolidação de várias supervisões dentro de uma coordenação."
      />

      {/* Coordination Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Users} label="Membros" value="87" />
        <MockStat icon={FileText} label="Relatórios" value="12/14" color="text-emerald-500" />
        <MockStat icon={Shield} label="Supervisões" value="8" color="text-blue-500" />
        <MockStat icon={TrendingUp} label="Engajamento" value="86%" color="text-amber-500" />
      </div>

      {/* Engagement */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Engajamento de Relatórios
            </CardTitle>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'Sup. André & Lia', sent: 5, total: 5 },
              { name: 'Sup. Bruno & Cíntia', sent: 4, total: 5 },
              { name: 'Sup. Daniel & Priscila', sent: 3, total: 4 },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{s.name}</span>
                <div className="flex items-center gap-2">
                  <Progress value={(s.sent / s.total) * 100} className="h-1.5 w-20" />
                  <span className="text-xs text-muted-foreground">{s.sent}/{s.total}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aggregated Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Marcos Espirituais — Coordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Encontro com Deus', pct: 72 },
              { label: 'Batismo', pct: 65 },
              { label: 'Curso Lidere', pct: 41 },
              { label: 'Encontro de Casais', pct: 28 },
            ].map(m => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium">{m.pct}%</span>
                </div>
                <Progress value={m.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PedagogicalNote text="O coordenador enxerga padrões, necessidades e direcionamentos." />
    </div>
  );
}

/* ─── STEP 4: Network Leader Demo ─── */

function StepRede() {
  return (
    <div className="space-y-4">
      <RoleHeader
        icon={Network}
        emoji="🌐"
        title="Visão do Líder de Rede"
        description="O líder de rede acompanha todas as coordenações da Rede Amor a Dois."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MockStat icon={Network} label="Coordenações" value="4" />
        <MockStat icon={Users} label="Células" value="28" color="text-emerald-500" />
        <MockStat icon={Heart} label="Membros" value="312" color="text-rose-500" />
        <MockStat icon={BarChart3} label="Engajamento" value="82%" color="text-amber-500" />
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas Agregados
            </CardTitle>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { text: '3 células sem relatório esta semana', level: 'warn' },
            { text: '2 supervisões pendentes no bimestre', level: 'warn' },
            { text: '5 membros com estagnação espiritual (>2 anos)', level: 'info' },
          ].map((a, i) => (
            <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-md ${
              a.level === 'warn'
                ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
                : 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300'
            }`}>
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              {a.text}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Macro Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Saúde Macro da Rede
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Células ativas', pct: 93 },
              { label: 'Relatórios enviados', pct: 82 },
              { label: 'Supervisões realizadas', pct: 75 },
              { label: 'Marcos espirituais', pct: 58 },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.pct}%</span>
                </div>
                <Progress value={item.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PedagogicalNote text="Aqui não se entra em detalhe de célula, mas em visão estratégica." />
    </div>
  );
}

/* ─── STEP 5: Pastoral Demo ─── */

function StepPastoral() {
  return (
    <div className="space-y-4">
      <RoleHeader
        icon={Church}
        emoji="✝️"
        title="Visão Pastoral"
        description="Este painel apoia o cuidado espiritual e decisões pastorais."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MockStat icon={Heart} label="Saúde Geral" value="84%" color="text-rose-500" />
        <MockStat icon={TrendingUp} label="Engajamento" value="82%" color="text-emerald-500" />
        <MockStat icon={UserCheck} label="Líd. Treinamento" value="14" color="text-blue-500" />
      </div>

      {/* Pastoral Indicators */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Indicadores Pastorais
            </CardTitle>
            <DemoBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Membros ativos na rede</span>
            <span className="font-semibold text-foreground">312</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Batizados este ano</span>
            <span className="font-semibold text-foreground">23</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Encontro com Deus realizados</span>
            <span className="font-semibold text-foreground">18</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Células multiplicadas</span>
            <span className="font-semibold text-foreground">3</span>
          </div>
        </CardContent>
      </Card>

      {/* Attention Alert */}
      <Card className="border-amber-200/50 dark:border-amber-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Atenção Pastoral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            5 membros ativos há mais de 2 anos sem os marcos básicos (Encontro com Deus, Batismo ou Curso Lidere).
            Identificados nominalmente para acompanhamento espiritual direto.
          </p>
        </CardContent>
      </Card>

      <PedagogicalNote text="Os pastores recebem visão, não tarefas." />
    </div>
  );
}

/* ─── STEP 6: Final Summary ─── */

function StepResumo() {
  const checks = [
    'Cada um vê apenas o que precisa',
    'Dados não se perdem',
    'Não há exposição',
    'Não há interesse comercial',
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 pt-2">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          O Atalaia funciona como um fluxo saudável de informação
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Os dados nascem na célula, sobem com responsabilidade
          e chegam à liderança pastoral com clareza e segurança.
        </p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-5 space-y-3">
          {checks.map(check => (
            <div key={check} className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-foreground">{check}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "O Atalaia é uma ferramenta a serviço da igreja,<br />
            projetada para cuidar com responsabilidade e amor."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */

const TOTAL_STEPS = 7;

const stepLabels = [
  'Introdução',
  'Líder de Célula',
  'Supervisor',
  'Coordenador',
  'Líder de Rede',
  'Pastores',
  'Resumo',
];

export function InstitutionalDashboard() {
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-4">
      {/* Welcome Message */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-base">
              👋
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Bem-vinda, Milka!
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este é um ambiente de demonstração preparado especialmente para você.
                Aqui você poderá conhecer como o Atalaia funciona, com total{' '}
                <span className="font-semibold text-primary">privacidade</span> e segurança.
                Nenhum dado real é exposto nesta visualização.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {step > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {stepLabels[step]} · {step}/{TOTAL_STEPS - 1}
            </span>
            <DemoBadge />
          </div>
          <Progress value={(step / (TOTAL_STEPS - 1)) * 100} className="h-1" />
        </div>
      )}

      {/* Step Content */}
      {step === 0 && <StepIntro onNext={next} />}
      {step === 1 && <StepCelula />}
      {step === 2 && <StepSupervisor />}
      {step === 3 && <StepCoordenador />}
      {step === 4 && <StepRede />}
      {step === 5 && <StepPastoral />}
      {step === 6 && <StepResumo />}

      {/* Navigation */}
      {step > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={prev} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button size="sm" onClick={next} className="gap-1.5">
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              Voltar ao início
            </Button>
          )}
        </div>
      )}

      <DemoFooter />
    </div>
  );
}
