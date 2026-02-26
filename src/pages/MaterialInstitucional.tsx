import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { BookOpen, Heart, Users, Shield, Eye, MessageCircle, BarChart3, Church, Crown, Waypoints, UserCheck, Sparkles, ArrowLeft, Printer, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const gold = '#C5A059';
const textMain = '#F4EDE4';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const headingFont = "'Outfit', sans-serif";
const bodyFont = "'Inter', sans-serif";

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12 print:mb-8 print:break-inside-avoid">
    {children}
  </section>
);

const SectionTitle = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    {Icon && (
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${gold} 0%, #D4B366 100%)` }}>
        <Icon className="h-5 w-5 text-[#1A2F4B]" />
      </div>
    )}
    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: headingFont, color: gold }}>
      {children}
    </h2>
  </div>
);

const RoleCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="rounded-xl border p-5 flex gap-4 items-start" style={{ borderColor: `${gold}33`, background: `${gold}0A` }}>
    <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${gold}26` }}>
      <Icon className="h-4.5 w-4.5" style={{ color: gold }} />
    </div>
    <div>
      <h3 className="font-semibold text-base mb-1" style={{ color: textMain, fontFamily: headingFont }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: textMuted, fontFamily: bodyFont }}>{description}</p>
    </div>
  </div>
);

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: gold }} />
    <span>{children}</span>
  </li>
);

const ValueCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="text-center p-5 rounded-xl" style={{ background: `${gold}0F`, border: `1px solid ${gold}1F` }}>
    <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${gold}26` }}>
      <Icon className="h-5 w-5" style={{ color: gold }} />
    </div>
    <h3 className="font-semibold text-sm mb-1" style={{ color: textMain, fontFamily: headingFont }}>{title}</h3>
    <p className="text-xs leading-relaxed" style={{ color: textMuted }}>{description}</p>
  </div>
);

const FlowStep = ({ n, title, description }: { n: number; title: string; description: string }) => (
  <div className="flex gap-4 items-start">
    <div className="flex flex-col items-center">
      <span className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: gold, color: '#1A2F4B' }}>{n}</span>
      <div className="w-px flex-1 mt-1" style={{ background: `${gold}33` }} />
    </div>
    <div className="pb-6">
      <h4 className="font-semibold text-sm mb-1" style={{ color: textMain, fontFamily: headingFont }}>{title}</h4>
      <p className="text-xs leading-relaxed" style={{ color: textMuted }}>{description}</p>
    </div>
  </div>
);

export default function MaterialInstitucional() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1A2F4B 40%, #121212 100%)' }}>
      {/* Print-hidden controls */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}
          className="backdrop-blur-md rounded-full px-4" style={{ background: 'rgba(0,0,0,0.5)', color: textMain }}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}
          className="backdrop-blur-md rounded-full px-4" style={{ background: `${gold}33`, color: gold }}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20">
        {/* ── CAPA ── */}
        <Section id="capa">
          <div className="text-center py-12 sm:py-20 print:py-16">
            <div className="mb-8">
              <AtalaiaLogoHeader />
            </div>
            <h1 className="text-3xl sm:text-5xl mb-4 leading-tight"
              style={{ fontFamily: headingFont, color: textMain, letterSpacing: '-0.02em' }}>
              ATALAIA
            </h1>
            <p className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
              style={{ color: gold, fontFamily: headingFont }}>
              Saúde e Cuidado da Rede Amor a Dois
            </p>
            <p className="text-sm mt-3 max-w-md mx-auto leading-relaxed" style={{ color: textMuted }}>
              Do altar à célula — um ecossistema completo de cuidado pastoral
            </p>
            <div className="mt-10 h-px w-24 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <div className="mt-6 flex justify-center">
              <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-12 w-auto object-contain opacity-50" />
            </div>
          </div>
        </Section>

        {/* ── POR QUE EXISTE ── */}
        <Section id="por-que">
          <SectionTitle icon={Heart}>Por que o Atalaia existe?</SectionTitle>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: textBody }}>
            <p>
              A Igreja do Amor cresce. E com o crescimento, vem a necessidade de cuidar melhor, organizar com sabedoria e garantir que nenhuma vida fique para trás.
            </p>
            <p>
              O <strong style={{ color: textMain }}>Atalaia</strong> nasceu para apoiar o trabalho das lideranças — não para substituí-lo. Ele existe para que cada líder tenha clareza, cada coordenador tenha visão, e cada pastor tenha a memória viva do que Deus está fazendo em cada célula.
            </p>
            <p>
              Hoje, o Atalaia é mais do que uma ferramenta de acompanhamento: é um <strong style={{ color: textMain }}>ecossistema completo</strong> que conecta o altar à célula, organizando o cuidado desde a decisão de uma vida até sua caminhada dentro da igreja.
            </p>
            <p>
              <strong style={{ color: gold }}>O Atalaia organiza o cuidado desde a decisão até a caminhada.</strong>
            </p>
          </div>
        </Section>

        {/* ── DO ALTAR À CÉLULA ── */}
        <Section id="altar-celula">
          <SectionTitle icon={RefreshCw}>Do Altar à Célula</SectionTitle>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: textBody }}>
            O Atalaia conecta cada etapa do cuidado pastoral em um fluxo contínuo — da decisão no altar até a integração completa na célula:
          </p>
          <div className="rounded-xl p-6" style={{ background: `${gold}0A`, border: `1px solid ${gold}1F` }}>
            <FlowStep n={1} title="A vida se converte" description="No culto, no altar, no momento mais sagrado — uma decisão é tomada." />
            <FlowStep n={2} title="É acolhida pelo Recomeço" description="A equipe do Recomeço recebe essa vida com carinho, registra seus dados e inicia o acompanhamento." />
            <FlowStep n={3} title="Dados registrados com cuidado" description="Nome, contato, bairro, perfil — tudo é guardado com responsabilidade para que nenhuma informação se perca." />
            <FlowStep n={4} title="Encaminhada pela Central de Células" description="A Central avalia o perfil, a localização e sugere a célula mais adequada para acolher essa vida." />
            <FlowStep n={5} title="Chega ao líder já acompanhada" description="O líder de célula recebe a nova vida com contexto — sabe de onde veio, como chegou, e o que precisa." />
            <FlowStep n={6} title="Cuidada, integrada e discipulada" description="Dentro da célula, a vida é acolhida, cresce na fé e passa a fazer parte da família." />
          </div>
          <div className="mt-6 rounded-xl p-5 text-center" style={{ background: `${gold}14`, border: `1px solid ${gold}2E` }}>
            <p className="text-sm italic leading-relaxed" style={{ color: textMain, fontFamily: headingFont }}>
              "Tudo com rastreabilidade, amor e responsabilidade pastoral."
            </p>
          </div>
        </Section>

        {/* ── RECOMEÇO & CENTRAL ── */}
        <Section id="recomeco-central">
          <SectionTitle icon={MessageCircle}>Recomeço & Central de Células</SectionTitle>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: textBody }}>
            <p>
              O <strong style={{ color: textMain }}>Recomeço</strong> é o braço de acolhimento do Atalaia. Quando uma vida toma uma decisão no altar, o Recomeço garante que essa pessoa não fique sozinha. Os agentes do Recomeço entram em contato, registram informações e acompanham cada passo até o encaminhamento.
            </p>
            <p>
              A <strong style={{ color: textMain }}>Central de Células</strong> é o ponto de conexão entre a nova vida e a célula ideal. Ela analisa perfil, localização e disponibilidade para sugerir a melhor célula — garantindo que o encaminhamento seja feito com critério e cuidado, não por acaso.
            </p>
            <p>
              Juntos, Recomeço e Central formam o elo que <strong style={{ color: textMain }}>evita que vidas se percam no processo</strong>. Todo o acompanhamento é visível, rastreável e responsável.
            </p>
          </div>
          <div className="mt-6 rounded-xl p-5 text-center" style={{ background: `${gold}14`, border: `1px solid ${gold}2E` }}>
            <p className="text-base italic leading-relaxed" style={{ color: textMain, fontFamily: headingFont }}>
              "No Atalaia, nenhuma vida é apenas um cadastro. Cada vida é uma responsabilidade."
            </p>
          </div>
        </Section>

        {/* ── PARA QUEM É ── */}
        <Section id="para-quem">
          <SectionTitle icon={Users}>Para quem é o Atalaia?</SectionTitle>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: textMuted }}>
            Cada nível de liderança tem uma visão diferente dentro do Atalaia, com acesso adequado à sua responsabilidade:
          </p>
          <div className="grid gap-4">
            <RoleCard icon={Crown} title="Pastores Sêniores"
              description="Visão geral de toda a rede: saúde das células, crescimento, tendências, encaminhamentos do Recomeço e pontos de atenção pastoral. Tudo em um painel claro e direto." />
            <RoleCard icon={Waypoints} title="Líder de Rede"
              description="Acompanhamento de todas as coordenações, supervisores e células. Identifica padrões, celebra avanços e direciona esforços onde mais precisa." />
            <RoleCard icon={Shield} title="Coordenadores"
              description="Visão detalhada das células da sua coordenação. Acompanha relatórios, supervisões e a saúde de cada grupo sob sua responsabilidade." />
            <RoleCard icon={Eye} title="Supervisores"
              description="Registra supervisões das células do seu escopo. Acompanha de perto a qualidade dos encontros e apoia os líderes de célula." />
            <RoleCard icon={UserCheck} title="Líderes de Célula"
              description="Preenche o relatório semanal, gerencia membros, recebe novas vidas encaminhadas pela Central e envia informações pelo WhatsApp." />
          </div>
        </Section>

        {/* ── O QUE FAZ ── */}
        <Section id="o-que-faz">
          <SectionTitle icon={BarChart3}>O que o Atalaia faz?</SectionTitle>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: textMuted }}>
            De forma prática e objetiva, o Atalaia oferece:
          </p>
          <ul className="space-y-3">
            <BulletItem><strong style={{ color: textMain }}>Acolhimento de novas vidas (Recomeço)</strong> — registro, acompanhamento e primeiro contato com quem tomou uma decisão.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Central de Células</strong> — encaminhamento inteligente de vidas para a célula mais adequada.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Relatórios de célula</strong> — padronizados, simples de preencher, com histórico completo.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Acompanhamento pastoral</strong> — visão clara de quem precisa de atenção, quem está crescendo, quem está ausente.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Histórico e memória</strong> — tudo fica registrado. Nenhuma informação se perde.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Organização por rede, coordenação e célula</strong> — estrutura visual clara e hierárquica.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Comunicação via WhatsApp</strong> — envio de relatórios e supervisões formatados diretamente pelo app.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Dados para decisão, não para cobrança</strong> — informações que ajudam a cuidar melhor, não a fiscalizar.</BulletItem>
          </ul>
        </Section>

        {/* ── O QUE NÃO É ── */}
        <Section id="o-que-nao-e">
          <SectionTitle icon={Shield}>O que o Atalaia NÃO é</SectionTitle>
          <div className="rounded-xl p-6" style={{ background: 'rgba(211,47,47,0.06)', border: '1px solid rgba(211,47,47,0.15)' }}>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm" style={{ color: textBody }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: textMain }}>Não é fiscalização.</strong> O objetivo é cuidar, não vigiar.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: textBody }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: textMain }}>Não é controle frio.</strong> Cada número representa uma vida, uma família, uma história.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: textBody }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: textMain }}>Não é burocracia.</strong> Foi pensado para ser simples — preencher um relatório leva menos de 2 minutos.</span>
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: textBody }}>
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <span><strong style={{ color: textMain }}>Não substitui relacionamento.</strong> O Atalaia organiza; o cuidado é feito por pessoas.</span>
              </li>
            </ul>
          </div>
        </Section>

        {/* ── BENEFÍCIOS ── */}
        <Section id="beneficios">
          <SectionTitle icon={Sparkles}>Benefícios práticos</SectionTitle>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: gold }}>Para o Líder de Célula</h3>
              <ul className="space-y-2">
                <BulletItem>Relatório semanal rápido e padronizado (sem esquecer o que reportar)</BulletItem>
                <BulletItem>Controle dos membros e aniversários da célula na palma da mão</BulletItem>
                <BulletItem>Recebimento de novas vidas já acompanhadas pela Central</BulletItem>
                <BulletItem>Envio do relatório por WhatsApp em um toque</BulletItem>
                <BulletItem>Histórico completo de todas as semanas</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: gold }}>Para o Supervisor</h3>
              <ul className="space-y-2">
                <BulletItem>Registro de supervisão organizado e com checklist</BulletItem>
                <BulletItem>Visão de quais células estão ativas e quais precisam de atenção</BulletItem>
                <BulletItem>Envio de supervisão por WhatsApp para a coordenação</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: gold }}>Para o Coordenador</h3>
              <ul className="space-y-2">
                <BulletItem>Painel com todas as células da coordenação em um só lugar</BulletItem>
                <BulletItem>Indicadores de saúde: relatórios enviados, pendências, crescimento</BulletItem>
                <BulletItem>Dados para reuniões de alinhamento com a liderança</BulletItem>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: gold }}>Para o Líder de Rede e Pastores</h3>
              <ul className="space-y-2">
                <BulletItem>Visão macro de toda a rede: onde está crescendo, onde precisa de cuidado</BulletItem>
                <BulletItem>Acompanhamento do fluxo do Recomeço e da Central de Células</BulletItem>
                <BulletItem>Memória institucional — nada se perde entre uma reunião e outra</BulletItem>
                <BulletItem>Decisões baseadas em dados reais, com sensibilidade pastoral</BulletItem>
                <BulletItem>Organograma visual de toda a estrutura</BulletItem>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── CULTURA ── */}
        <Section id="cultura">
          <SectionTitle icon={Church}>A cultura do Atalaia</SectionTitle>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: textMuted }}>
            Mais do que uma ferramenta, o Atalaia carrega valores que refletem o coração da nossa igreja:
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
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: `${gold}0F`, border: `1px solid ${gold}26` }}>
            <BookOpen className="h-8 w-8 mx-auto mb-4" style={{ color: gold }} />
            <p className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              style={{ color: textMain, fontFamily: headingFont }}>
              O Atalaia é uma expressão de amor pela igreja. Ele existe para que cada líder tenha suporte, cada célula seja acompanhada, e cada vida seja cuidada com a excelência que o Reino de Deus merece.
            </p>
            <p className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: textBody }}>
              Do altar à célula, do cuidado ao acompanhamento — que a tecnologia esteja a serviço do amor, e que a ordem reflita o caráter de Deus em tudo o que fazemos.
            </p>
            <div className="h-px w-16 mx-auto mb-6" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <p className="text-sm italic mb-1" style={{ color: gold, fontFamily: headingFont }}>
              "Cuidem de todo o rebanho sobre o qual o Espírito Santo os colocou como bispos, para pastorearem a igreja de Deus, que ele comprou com o seu próprio sangue."
            </p>
            <p className="text-xs" style={{ color: textMuted }}>Atos 20:28</p>

            <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${gold}1A` }}>
              <p className="text-xs italic mb-1" style={{ color: `${gold}80`, fontFamily: headingFont }}>
                "Tudo seja feito com decência e ordem."
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(184,182,179,0.4)' }}>1 Coríntios 14:40</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/testemunho')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <Eye className="h-4 w-4 mr-2" /> Testemunho ATALAIA
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/manual-lider')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <BookOpen className="h-4 w-4 mr-2" /> Manual do Líder — Atalaia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/faq')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <HelpCircle className="h-4 w-4 mr-2" /> FAQ — Atalaia
            </Button>
            <div className="mt-4">
              <AtalaiaFooterSignature />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}