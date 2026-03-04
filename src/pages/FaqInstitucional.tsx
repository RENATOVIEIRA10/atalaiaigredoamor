import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import { ArrowLeft, Printer, HelpCircle, Users, Shield, Eye, Waypoints, BookOpen, GraduationCap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const gold = '#C5A059';
const textMain = '#F4EDE4';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const headingFont = "'Outfit', sans-serif";

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12 print:mb-8 print:break-inside-avoid">{children}</section>
);

const SectionTitle = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    {Icon && (
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `linear-gradient(135deg, ${gold} 0%, #D4B366 100%)` }}>
        <Icon className="h-5 w-5 text-[#1A2F4B]" />
      </div>
    )}
    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: headingFont, color: gold }}>{children}</h2>
  </div>
);

interface FaqItem { q: string; a: string; }

const faqGeral: FaqItem[] = [
  { q: 'O que é o Atalaia?', a: 'O Atalaia é o ecossistema digital de saúde e cuidado da Rede Amor a Dois, a serviço da Igreja do Amor. Ele organiza todo o fluxo pastoral — do altar à célula — incluindo relatórios, cuidado e supervisão, acolhimento de novas vidas (Porta de Entrada), Encaminhamento de Vidas e acompanhamento contínuo.' },
  { q: 'Para quem o Atalaia foi criado?', a: 'Para toda a liderança da Rede Amor a Dois: líderes de célula, supervisores, coordenadores, líderes de rede e pastores. Cada nível de liderança tem uma visão adequada à sua responsabilidade.' },
  { q: 'Qual a relação entre Atalaia, Igreja do Amor e Rede Amor a Dois?', a: 'O Atalaia é a plataforma que cuida da saúde da Rede Amor a Dois, a serviço da Igreja do Amor. Ele não substitui a identidade da Igreja nem da Rede — ele sustenta e apoia ambas com organização e cuidado.' },
  { q: 'O que é a Porta de Entrada?', a: 'A Porta de Entrada é o braço de acolhimento do Atalaia. Quando uma vida toma uma decisão no altar, a equipe da Porta de Entrada garante o primeiro contato, registra os dados e acompanha essa pessoa até o encaminhamento para uma célula.' },
  { q: 'O que é o Encaminhamento de Vidas?', a: 'O Encaminhamento de Vidas conecta a nova vida à célula mais adequada, levando em conta localização, perfil e disponibilidade. Ele garante que o encaminhamento seja feito com critério e cuidado pastoral.' },
  { q: 'Como o Atalaia cuida da saúde da rede?', a: 'Organizando todo o fluxo pastoral: desde o acolhimento de novas vidas pela Porta de Entrada, passando pelo Encaminhamento de Vidas, até o acompanhamento contínuo nas células. Ele mantém o histórico e garante que nenhuma vida fique sem cuidado.' },
  { q: 'O Atalaia substitui reuniões ou liderança?', a: 'De forma alguma. O Atalaia é um apoio — ele organiza informações, mas quem cuida das pessoas continua sendo você. Reuniões, conversas, discipulados e o toque pastoral continuam sendo insubstituíveis.' },
];

const faqLideresCelula: FaqItem[] = [
  { q: 'É difícil usar o Atalaia?', a: 'Não! O Atalaia foi feito para ser simples. Se você sabe usar o WhatsApp, consegue usar o Atalaia. Tudo é intuitivo, com botões claros e poucos passos.' },
  { q: 'Preciso usar no computador ou no celular?', a: 'Você pode usar nos dois! O Atalaia funciona no celular como um aplicativo e também no computador pelo navegador. A maioria dos líderes usa diretamente pelo celular.' },
  { q: 'Como recebo novas vidas na minha célula?', a: 'Quando uma nova vida é encaminhada pelo Encaminhamento de Vidas para a sua célula, você recebe a notificação com os dados da pessoa — nome, contato e contexto. A vida já chega acompanhada para você acolher.' },
  { q: 'O que acontece se eu errar um relatório?', a: 'Sem problema. Você pode editar o relatório depois de enviar. Errar faz parte, e o Atalaia permite correções com facilidade.' },
  { q: 'Quanto tempo leva para enviar um relatório?', a: 'Menos de 2 minutos. É rápido: você preenche os números da célula da semana, adiciona alguma observação se quiser, e pronto.' },
  { q: 'Preciso enviar relatório toda semana?', a: 'Sim, idealmente. O relatório semanal é a forma de manter a saúde da célula visível para a liderança. Mas se uma semana passar, não se preocupe — o Atalaia guarda tudo e você pode preencher depois.' },
  { q: 'Isso vai virar cobrança?', a: 'Não. O objetivo do Atalaia é cuidado, não cobrança. Os dados existem para ajudar, não para pressionar. A cultura da casa é de amor e apoio mútuo.' },
];

const faqSupervisoresCoordenadores: FaqItem[] = [
  { q: 'O que eu consigo ver no Atalaia?', a: 'Você vê os dados das células que estão sob sua responsabilidade: relatórios enviados, pendências, supervisões realizadas, membros e indicadores de saúde das células.' },
  { q: 'Como o Atalaia me ajuda no cuidado das células?', a: 'O Atalaia mostra onde está indo bem e onde precisa de atenção. Você consegue identificar rapidamente qual célula precisa de um telefonema, uma visita ou um encorajamento.' },
  { q: 'Isso gera mais trabalho?', a: 'Na verdade, gera menos. Em vez de ligar para cada líder perguntando como foi a célula, você já tem a informação organizada. Sobra mais tempo para cuidar de pessoas.' },
  { q: 'Como usar os dados de forma pastoral?', a: 'Use os dados como um termômetro, não como uma régua. Se uma célula está com poucos membros, não é hora de cobrar — é hora de cuidar, conversar e entender o que está acontecendo.' },
];

const faqLideresRede: FaqItem[] = [
  { q: 'Como o Atalaia ajuda na visão da rede?', a: 'Ele dá uma visão panorâmica: quantas células estão ativas, como está o crescimento, quais coordenações estão avançando e quais precisam de suporte. Tudo em tempo real.' },
  { q: 'Posso exportar dados do Atalaia?', a: 'Sim! Você pode exportar relatórios em formato de planilha ou gerar PDFs para reuniões de liderança. Tudo pronto para apresentar de forma profissional.' },
  { q: 'Posso acompanhar tudo pelo celular?', a: 'Sim, 100%. O Atalaia foi projetado para funcionar perfeitamente no celular. Você pode acompanhar sua rede de qualquer lugar, a qualquer hora.' },
];

const faqPrivacidade: FaqItem[] = [
  { q: 'Quem vê meus dados no Atalaia?', a: 'Cada pessoa só vê o que é da sua responsabilidade. Um líder de célula vê sua célula. Um supervisor vê suas células. Um coordenador vê sua coordenação. Ninguém tem acesso ao que não é do seu escopo.' },
  { q: 'Os pastores veem tudo?', a: 'Os pastores têm uma visão geral da rede, com indicadores macro. O objetivo não é vigiar, mas ter clareza para tomar decisões pastorais com sabedoria.' },
  { q: 'Os dados são usados para exposição?', a: 'Nunca. Os dados são internos e protegidos. Eles existem exclusivamente para apoiar o cuidado pastoral. Nenhuma informação é compartilhada publicamente.' },
  { q: 'O Atalaia é seguro?', a: 'Sim. O acesso é feito por código exclusivo, e cada usuário só enxerga o que é pertinente à sua função. Os dados ficam armazenados de forma segura na nuvem.' },
];

const faqSuporte: FaqItem[] = [
  { q: 'Se eu tiver dúvida, quem me ajuda?', a: 'Seu supervisor ou coordenador pode ajudar. Além disso, a liderança da rede está disponível para tirar qualquer dúvida sobre o Atalaia.' },
  { q: 'Vai ter treinamento?', a: 'Sim! Serão feitos encontros e tutoriais para que todos se sintam seguros ao usar o Atalaia. Ninguém será deixado para trás.' },
  { q: 'Onde aprender a usar o Atalaia?', a: 'Além dos treinamentos presenciais, o Atalaia possui esta FAQ e o Material Institucional disponíveis para consulta a qualquer momento. É só acessar quando precisar.' },
];

function FaqBlock({ icon, title, items, id }: { icon: any; title: string; items: FaqItem[]; id: string }) {
  return (
    <Section id={id}>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <Accordion type="multiple" className="space-y-2">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`${id}-${i}`}
            className="rounded-xl border-0 overflow-hidden"
            style={{ background: `${gold}0A`, border: `1px solid ${gold}1F` }}>
            <AccordionTrigger className="px-5 py-4 text-left text-sm font-semibold hover:no-underline gap-3"
              style={{ color: textMain }}>
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 text-sm leading-relaxed" style={{ color: textBody }}>
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export default function FaqInstitucional() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1A2F4B 40%, #121212 100%)' }}>
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
        {/* Header */}
        <Section id="header">
          <div className="text-center py-10 sm:py-16 print:py-12">
            <div className="mb-8">
              <AtalaiaLogoHeader />
            </div>
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
              style={{ background: `${gold}1A`, border: `1px solid ${gold}33` }}>
              <HelpCircle className="h-4 w-4" style={{ color: gold }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: gold }}>Perguntas Frequentes</span>
            </div>
            <h1 className="text-2xl sm:text-4xl mb-3 leading-tight"
              style={{ fontFamily: headingFont, color: textMain, letterSpacing: '-0.02em' }}>
              FAQ — ATALAIA
            </h1>
            <p className="text-sm sm:text-base max-w-md mx-auto leading-relaxed" style={{ color: textMuted }}>
              Tudo o que você precisa saber sobre o Atalaia, de forma simples e direta.
            </p>
            <div className="mt-8 h-px w-24 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          </div>
        </Section>

        {/* FAQ Blocks */}
        <FaqBlock id="geral" icon={HelpCircle} title="Perguntas Gerais" items={faqGeral} />
        <FaqBlock id="lideres-celula" icon={Users} title="Para Líderes de Célula" items={faqLideresCelula} />
        <FaqBlock id="supervisores-coordenadores" icon={Eye} title="Para Supervisores e Coordenadores" items={faqSupervisoresCoordenadores} />
        <FaqBlock id="lideres-rede" icon={Waypoints} title="Para Líderes de Rede" items={faqLideresRede} />
        <FaqBlock id="privacidade" icon={Shield} title="Privacidade e Confiança" items={faqPrivacidade} />
        <FaqBlock id="suporte" icon={GraduationCap} title="Suporte e Aprendizado" items={faqSuporte} />

        {/* Encerramento Pastoral */}
        <Section id="encerramento">
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ background: `${gold}0F`, border: `1px solid ${gold}26` }}>
            <Heart className="h-8 w-8 mx-auto mb-4" style={{ color: gold }} />
            <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-xl mx-auto"
              style={{ color: textMain, fontFamily: headingFont }}>
              O Atalaia é uma ferramenta de cuidado, não de pressão.
            </p>
            <p className="text-sm leading-relaxed mb-6 max-w-lg mx-auto" style={{ color: textBody }}>
              Ele foi pensado com amor, para que cada líder se sinta apoiado, cada célula seja acompanhada e cada vida seja cuidada com a excelência que o Reino de Deus merece. Não tenha medo de usar. Estamos juntos nessa jornada.
            </p>
            <div className="h-px w-16 mx-auto mb-6" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <p className="text-sm italic mb-1" style={{ color: gold, fontFamily: headingFont }}>
              "Apascenta as minhas ovelhas."
            </p>
            <p className="text-xs" style={{ color: textMuted }}>João 21:17</p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/material')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <BookOpen className="h-4 w-4 mr-2" /> Material Institucional — Atalaia
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
