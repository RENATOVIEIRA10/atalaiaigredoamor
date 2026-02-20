import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';
import logoIgreja from '@/assets/logo-igreja-do-amor.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { BookOpen, Heart, Users, Shield, Eye, MessageCircle, BarChart3, Church, Crown, Waypoints, UserCheck, Sparkles, ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12 print:mb-8 print:break-inside-avoid">
    {children}
  </section>
);

const SectionTitle = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    {Icon && (
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #C9A24D 0%, #D4B366 100%)' }}>
        <Icon className="h-5 w-5 text-[#1a0a0b]" />
      </div>
    )}
    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'DM Serif Display', serif", color: '#C9A24D' }}>
      {children}
    </h2>
  </div>
);

const RoleCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="rounded-xl border p-5 flex gap-4 items-start" style={{ borderColor: 'rgba(201,162,77,0.2)', background: 'rgba(201,162,77,0.04)' }}>
    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(201,162,77,0.15)' }}>
      <Icon className="h-4.5 w-4.5" style={{ color: '#C9A24D' }} />
    </div>
    <div>
      <h3 className="font-semibold text-base mb-1" style={{ color: '#F6F4F1', fontFamily: "'DM Serif Display', serif" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#B8B6B3' }}>{description}</p>
    </div>
  </div>
);

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: '#D4D2CF' }}>
    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: '#C9A24D' }} />
    <span>{children}</span>
  </li>
);

const ValueCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="text-center p-5 rounded-xl" style={{ background: 'rgba(201,162,77,0.06)', border: '1px solid rgba(201,162,77,0.12)' }}>
    <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(201,162,77,0.15)' }}>
      <Icon className="h-5 w-5" style={{ color: '#C9A24D' }} />
    </div>
    <h3 className="font-semibold text-sm mb-1" style={{ color: '#F6F4F1', fontFamily: "'DM Serif Display', serif" }}>{title}</h3>
    <p className="text-xs leading-relaxed" style={{ color: '#B8B6B3' }}>{description}</p>
  </div>
);

export default function MaterialInstitucional() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)' }}>
      {/* Print-hidden controls */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="backdrop-blur-md rounded-full px-4"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#F6F4F1' }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.print()}
          className="backdrop-blur-md rounded-full px-4"
          style={{ background: 'rgba(201,162,77,0.2)', color: '#C9A24D' }}
        >
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        {/* ── CAPA ── */}
        <Section id="capa">
          <div className="text-center py-12 sm:py-20 print:py-16">
            <div className="flex justify-center gap-6 mb-8">
              <img src={logoIgreja} alt="Igreja do Amor" className="h-16 sm:h-20 w-auto object-contain opacity-80" />
              <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-16 sm:h-20 w-auto object-contain rounded-full shadow-xl ring-2 ring-[#C9A24D]/20" />
            </div>
            <h1
              className="text-3xl sm:text-5xl mb-4 leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: '#F6F4F1', letterSpacing: '-0.02em' }}
            >
              Sistema Rede Amor a 2
            </h1>
            <p
              className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
              style={{ color: '#C9A24D', fontFamily: "'DM Serif Display', serif" }}
            >
              Cuidando de pessoas. Organizando vidas.<br />Fortalecendo a visão.
            </p>
            <div className="mt-10 h-px w-24 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #C9A24D, transparent)' }} />
            <div className="mt-6 flex justify-center">
              <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-12 w-auto object-contain opacity-50" />
            </div>
          </div>
        </Section>

        {/* ── POR QUE EXISTE ── */}
        <Section id="por-que">
          <SectionTitle icon={Heart}>Por que esse sistema existe?</SectionTitle>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: '#D4D2CF' }}>
            <p>
              A Igreja do Amor cresce. E com o crescimento, vem a necessidade de cuidar melhor, organizar com sabedoria e garantir que nenhuma vida fique para trás.
            </p>
            <p>
              O <strong style={{ color: '#F6F4F1' }}>Sistema Rede Amor a 2</strong> nasceu para apoiar o trabalho das lideranças — não para substituí-lo. Ele existe para que cada líder tenha clareza, cada coordenador tenha visão, e cada pastor tenha a memória viva do que Deus está fazendo em cada célula.
            </p>
            <p>
              <strong style={{ color: '#C9A24D' }}>O sistema não substitui pessoas. Ele apoia pessoas.</strong>
            </p>
            <p>
              Ele organiza informações para que o cuidado pastoral aconteça com excelência, para que a visão da igreja avance com ordem, e para que cada vida seja acompanhada com amor.
            </p>
          </div>
        </Section>

        {/* ── PARA QUEM É ── */}
        <Section id="para-quem">
          <SectionTitle icon={Users}>Para quem é o sistema?</SectionTitle>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#B8B6B3' }}>
            Cada nível de liderança tem uma visão diferente dentro do sistema, com acesso adequado à sua responsabilidade:
          </p>
          <div className="grid gap-4">
            <RoleCard
              icon={Crown}
              title="Pastores Sêniores"
              description="Visão geral de toda a rede: saúde das células, crescimento, tendências e pontos de atenção pastoral. Tudo em um painel claro e direto."
            />
            <RoleCard
              icon={Waypoints}
              title="Líder de Rede"
              description="Acompanhamento de todas as coordenações, supervisores e células. Identifica padrões, celebra avanços e direciona esforços onde mais precisa."
            />
            <RoleCard
              icon={Shield}
              title="Coordenadores"
              description="Visão detalhada das células da sua coordenação. Acompanha relatórios, supervisões e a saúde de cada grupo sob sua responsabilidade."
            />
            <RoleCard
              icon={Eye}
              title="Supervisores"
              description="Registra supervisões das células do seu escopo. Acompanha de perto a qualidade dos encontros e apoia os líderes de célula."
            />
            <RoleCard
              icon={UserCheck}
              title="Líderes de Célula"
              description="Preenche o relatório semanal da célula de forma simples e rápida. Gerencia membros, aniversários e envia informações pelo WhatsApp."
            />
          </div>
        </Section>

        {/* ── O QUE FAZ ── */}
        <Section id="o-que-faz">
          <SectionTitle icon={BarChart3}>O que o sistema faz?</SectionTitle>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: '#B8B6B3' }}>
            De forma prática e objetiva, o sistema oferece:
          </p>
          <ul className="space-y-3">
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Relatórios de célula</strong> — padronizados, simples de preencher, com histórico completo.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Acompanhamento pastoral</strong> — visão clara de quem precisa de atenção, quem está crescendo, quem está ausente.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Histórico e memória</strong> — tudo fica registrado. Nenhuma informação se perde.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Organização por rede, coordenação e célula</strong> — estrutura visual clara e hierárquica.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Comunicação via WhatsApp</strong> — envio de relatórios e supervisões formatados diretamente pelo app.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Dados para decisão, não para cobrança</strong> — informações que ajudam a cuidar melhor, não a fiscalizar.</BulletItem>
          </ul>
        </Section>

        {/* ── O QUE NÃO É ── */}
        <Section id="o-que-nao-e">
          <SectionTitle icon={Shield}>O que o sistema NÃO é</SectionTitle>
          <div className="rounded-xl p-6" style={{ background: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.15)' }}>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm" style={{ color: '#D4D2CF' }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: '#F6F4F1' }}>Não é fiscalização.</strong> O objetivo é cuidar, não vigiar.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: '#D4D2CF' }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: '#F6F4F1' }}>Não é controle frio.</strong> Cada número representa uma vida, uma família, uma história.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: '#D4D2CF' }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: '#F6F4F1' }}>Não é burocracia.</strong> Foi pensado para ser simples — preencher um relatório leva menos de 2 minutos.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: '#D4D2CF' }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: '#F6F4F1' }}>Não substitui relacionamento.</strong> O sistema organiza; o cuidado é feito por pessoas.</span>
              </li>
            </ul>
          </div>
        </Section>

        {/* ── BENEFÍCIOS ── */}
        <Section id="beneficios">
          <SectionTitle icon={Sparkles}>Benefícios práticos</SectionTitle>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#C9A24D' }}>Para o Líder de Célula</h3>
              <ul className="space-y-2">
                <BulletItem>Relatório semanal rápido e padronizado (sem esquecer o que reportar)</BulletItem>
                <BulletItem>Controle dos membros e aniversários da célula na palma da mão</BulletItem>
                <BulletItem>Envio do relatório por WhatsApp em um toque</BulletItem>
                <BulletItem>Histórico completo de todas as semanas</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#C9A24D' }}>Para o Supervisor</h3>
              <ul className="space-y-2">
                <BulletItem>Registro de supervisão organizado e com checklist</BulletItem>
                <BulletItem>Visão de quais células estão ativas e quais precisam de atenção</BulletItem>
                <BulletItem>Envio de supervisão por WhatsApp para a coordenação</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#C9A24D' }}>Para o Coordenador</h3>
              <ul className="space-y-2">
                <BulletItem>Painel com todas as células da coordenação em um só lugar</BulletItem>
                <BulletItem>Indicadores de saúde: relatórios enviados, pendências, crescimento</BulletItem>
                <BulletItem>Dados para reuniões de alinhamento com a liderança</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#C9A24D' }}>Para o Líder de Rede e Pastores</h3>
              <ul className="space-y-2">
                <BulletItem>Visão macro de toda a rede: onde está crescendo, onde precisa de cuidado</BulletItem>
                <BulletItem>Memória institucional — nada se perde entre uma reunião e outra</BulletItem>
                <BulletItem>Decisões baseadas em dados reais, com sensibilidade pastoral</BulletItem>
                <BulletItem>Organograma visual de toda a estrutura</BulletItem>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── CULTURA ── */}
        <Section id="cultura">
          <SectionTitle icon={Church}>A cultura do sistema</SectionTitle>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#B8B6B3' }}>
            Mais do que uma ferramenta, o Sistema Rede Amor a 2 carrega valores que refletem o coração da nossa igreja:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <ValueCard icon={Sparkles} title="Simplicidade" description="Fácil de usar, sem complicação" />
            <ValueCard icon={Heart} title="Amor" description="Cada recurso foi pensado com cuidado pastoral" />
            <ValueCard icon={BarChart3} title="Ordem" description="Informações organizadas, decisões claras" />
            <ValueCard icon={Users} title="Cuidado" description="Nenhuma vida passa despercebida" />
            <ValueCard icon={Eye} title="Visão de Reino" description="Dados a serviço do propósito de Deus" />
            <ValueCard icon={Shield} title="Confiança" description="Acesso controlado e dados protegidos" />
          </div>
        </Section>

        {/* ── ENCERRAMENTO ── */}
        <Section id="encerramento">
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: 'rgba(201,162,77,0.06)', border: '1px solid rgba(201,162,77,0.15)' }}>
            <BookOpen className="h-8 w-8 mx-auto mb-4" style={{ color: '#C9A24D' }} />
            <p
              className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              style={{ color: '#F6F4F1', fontFamily: "'DM Serif Display', serif" }}
            >
              Esse sistema é uma expressão de amor pela igreja. Ele existe para que cada líder tenha suporte, cada célula seja acompanhada, e cada vida seja cuidada com a excelência que o Reino de Deus merece.
            </p>
            <p
              className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              style={{ color: '#D4D2CF' }}
            >
              Que possamos ser fiéis no pouco, para que o Senhor nos confie o muito. Que a tecnologia esteja a serviço do amor, e que a ordem reflita o caráter de Deus em tudo o que fazemos.
            </p>
            <div className="h-px w-16 mx-auto mb-6" style={{ background: 'linear-gradient(90deg, transparent, #C9A24D, transparent)' }} />
            <p
              className="text-sm italic mb-1"
              style={{ color: '#C9A24D', fontFamily: "'DM Serif Display', serif" }}
            >
              "Cuidem de todo o rebanho sobre o qual o Espírito Santo os colocou como bispos, para pastorearem a igreja de Deus, que ele comprou com o seu próprio sangue."
            </p>
            <p className="text-xs" style={{ color: '#B8B6B3' }}>Atos 20:28</p>

            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(201,162,77,0.1)' }}>
              <p
                className="text-xs italic mb-1"
                style={{ color: 'rgba(201,162,77,0.5)', fontFamily: "'DM Serif Display', serif" }}
              >
                "Tudo seja feito com decência e ordem."
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(184,182,179,0.4)' }}>1 Coríntios 14:40</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs" style={{ color: '#B8B6B3' }}>
              Igreja do Amor • Rede Amor a 2 • 2026
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
