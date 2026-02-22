import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { BookOpen, Heart, Eye, Shield, Sparkles, ArrowLeft, Printer, Church, Waypoints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const gold = '#C5A059';
const textMain = '#F4EDE4';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const headingFont = "'Outfit', sans-serif";

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-14 print:mb-8 print:break-inside-avoid">{children}</section>
);

const SectionTitle = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-5">
    {Icon && (
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${gold} 0%, #D4B366 100%)` }}>
        <Icon className="h-5 w-5 text-[#1A2F4B]" />
      </div>
    )}
    <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: headingFont, color: gold }}>{children}</h2>
  </div>
);

const Paragraph = ({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) => (
  <p className="text-sm leading-relaxed mb-4"
    style={{ color: highlight ? textMain : textBody, fontWeight: highlight ? 600 : 400 }}>
    {children}
  </p>
);

const Anchor = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl p-6 sm:p-8 my-8 text-center" style={{ background: `${gold}14`, border: `1px solid ${gold}2E` }}>
    <p className="text-base sm:text-lg leading-relaxed italic max-w-xl mx-auto"
      style={{ color: textMain, fontFamily: headingFont }}>
      {children}
    </p>
  </div>
);

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: gold }} />
    <span>{children}</span>
  </li>
);

export default function TestemunhoAtalaia() {
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

        {/* ── CAPA ── */}
        <Section id="capa">
          <div className="text-center py-12 sm:py-20 print:py-16">
            <div className="mb-8">
              <AtalaiaLogoHeader />
            </div>
            <p className="text-xs uppercase tracking-[0.25em] mb-4" style={{ color: gold }}>
              Testemunho Institucional
            </p>
            <h1 className="text-3xl sm:text-5xl mb-4 leading-tight"
              style={{ fontFamily: headingFont, color: textMain, letterSpacing: '-0.02em' }}>
              ATALAIA
            </h1>
            <p className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed" style={{ color: gold, fontFamily: headingFont }}>
              Saúde e Cuidado da Rede Amor a Dois
            </p>
            <div className="mt-10 h-px w-24 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <div className="mt-6 flex justify-center">
              <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-12 w-auto object-contain opacity-50" />
            </div>
          </div>
        </Section>

        {/* ── 1. O PROBLEMA REAL ── */}
        <Section id="problema">
          <SectionTitle icon={Heart}>Antes do Atalaia</SectionTitle>
          <Paragraph>
            A Rede Amor a Dois sempre cuidou de vidas. Sempre houve líderes de célula dedicados, supervisores atentos, coordenadores comprometidos e uma liderança pastoral presente. O cuidado nunca faltou.
          </Paragraph>
          <Paragraph>
            Mas à medida que a rede crescia, algo ficava cada vez mais difícil: <strong style={{ color: textMain }}>manter a memória viva de tudo o que acontecia</strong>. As informações estavam espalhadas — em cadernos, mensagens de WhatsApp, planilhas, lembranças. O que um supervisor sabia nem sempre chegava ao coordenador. O que o líder de célula registrava nem sempre era visível para quem precisava acompanhar.
          </Paragraph>
          <Paragraph>
            Não era falta de vontade. Era falta de organização. E quando a informação não flui, o cuidado se torna mais difícil, mais lento, mais frágil.
          </Paragraph>
          <Paragraph highlight>
            O desafio não era tecnológico. Era pastoral: como cuidar melhor de mais pessoas sem perder ninguém de vista?
          </Paragraph>
        </Section>

        {/* ── 2. O NASCIMENTO ── */}
        <Section id="nascimento">
          <SectionTitle icon={Church}>Um sistema que nasceu da vida da igreja</SectionTitle>
          <Paragraph>
            O Atalaia não surgiu de um laboratório de tecnologia. Ele não foi comprado, importado ou adaptado de outro lugar. Ele nasceu dentro da Igreja do Amor, a partir daquilo que já existia na vida real da rede.
          </Paragraph>
          <Paragraph>
            A estrutura já estava lá: líderes de célula que se reúnem toda semana com suas famílias, supervisores que acompanham as células, coordenadores que organizam supervisões e alinhamentos, líderes de rede que enxergam o todo, e pastores que direcionam a visão.
          </Paragraph>
          <Paragraph>
            O que o Atalaia fez foi <strong style={{ color: textMain }}>organizar o que já existia</strong>. Dar forma digital ao fluxo natural de cuidado que a igreja já praticava. Transformar o que era verbal em registro, o que era disperso em visão clara, o que era esforço individual em inteligência coletiva.
          </Paragraph>
          <Paragraph highlight>
            Ele não criou algo artificial. Ele revelou o que já estava ali — e deu a cada pessoa o acesso certo à informação certa, na hora certa.
          </Paragraph>
        </Section>

        {/* ── 3. POR QUE FUNCIONA ── */}
        <Section id="funciona">
          <SectionTitle icon={Waypoints}>Por que ele funciona</SectionTitle>
          <Paragraph>
            Muitos sistemas falham porque tentam impor uma lógica que não existe na realidade. O Atalaia funciona porque fez o contrário: <strong style={{ color: textMain }}>ele espelha a estrutura real da igreja</strong>.
          </Paragraph>
          <ul className="space-y-3 mb-6">
            <BulletItem>Os dados certos estão nos lugares certos, porque <strong style={{ color: textMain }}>cada nível de liderança vê exatamente o que precisa ver</strong> — nem mais, nem menos.</BulletItem>
            <BulletItem>Os relatórios funcionam porque são preenchidos por <strong style={{ color: textMain }}>pessoas reais que vivem aquela célula</strong> — não por terceiros.</BulletItem>
            <BulletItem>A hierarquia do sistema é a <strong style={{ color: textMain }}>mesma hierarquia do pastoreio</strong>: líder → supervisor → coordenador → rede → pastor.</BulletItem>
            <BulletItem>A tecnologia funcionou bem porque a <strong style={{ color: textMain }}>lógica dos dados estava correta desde o início</strong> — ela veio da vida, não de uma teoria.</BulletItem>
          </ul>
          <Paragraph>
            O resultado é um sistema que a liderança reconhece como seu, porque ele fala a linguagem da igreja, respeita seu ritmo e serve sua missão.
          </Paragraph>
        </Section>

        {/* ── FRASE-ÂNCORA ── */}
        <Anchor>
          "O Atalaia não é um sistema criado para medir a igreja.<br />
          Ele existe para servir o pastoreio."
        </Anchor>

        {/* ── 4. O SIGNIFICADO DE ATALAIA ── */}
        <Section id="atalaia">
          <SectionTitle icon={Eye}>O que significa ser Atalaia</SectionTitle>
          <Paragraph>
            Na Bíblia, o atalaia era aquele que ficava sobre os muros da cidade, vigiando. Não para controlar, mas para proteger. Não para acusar, mas para alertar. O atalaia via primeiro o que os outros ainda não podiam ver — e sua função era servir a todos com essa visão.
          </Paragraph>
          <div className="rounded-xl p-6 mb-6" style={{ background: `${gold}0F`, border: `1px solid ${gold}1F` }}>
            <p className="text-sm italic leading-relaxed mb-2" style={{ color: gold, fontFamily: headingFont }}>
              "Filho do homem, eu te coloquei como atalaia para a casa de Israel. Sempre que ouvires uma palavra da minha boca, adverte-os da minha parte."
            </p>
            <p className="text-xs" style={{ color: textMuted }}>Ezequiel 3:17</p>
          </div>
          <Paragraph>Esse é o papel do Atalaia:</Paragraph>
          <ul className="space-y-3 mb-4">
            <BulletItem><strong style={{ color: textMain }}>Vigiar com amor</strong> — acompanhar a saúde de cada célula, sem invasão.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Observar a saúde da rede</strong> — enxergar padrões, tendências e pontos de atenção.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Alertar sem acusar</strong> — mostrar onde o cuidado precisa chegar, sem julgamento.</BulletItem>
            <BulletItem><strong style={{ color: textMain }}>Servir a liderança</strong> — dar clareza para quem decide, apoio para quem executa.</BulletItem>
          </ul>
          <Paragraph highlight>O Atalaia não mede pessoas. Ele serve o pastoreio.</Paragraph>
        </Section>

        {/* ── 5. CONCLUSÃO ── */}
        <Section id="conclusao">
          <SectionTitle icon={Sparkles}>Tecnologia a serviço do Reino</SectionTitle>
          <Paragraph>
            Vivemos um tempo onde a tecnologia pode servir tanto para afastar quanto para aproximar. O Atalaia é uma escolha deliberada de usar a tecnologia para aproximar — líderes de suas células, supervisores de seus líderes, pastores de sua rede.
          </Paragraph>
          <Paragraph>
            Ele não substitui o toque, a oração, a visita, o abraço. Mas ele garante que nenhuma vida passe despercebida, que nenhum alerta se perca, que nenhum cuidado fique esquecido.
          </Paragraph>
          <Paragraph highlight>
            Porque quando a informação está organizada, o amor alcança mais longe.
          </Paragraph>

          <div className="rounded-2xl p-8 sm:p-10 text-center mt-10" style={{ background: `${gold}0F`, border: `1px solid ${gold}26` }}>
            <BookOpen className="h-8 w-8 mx-auto mb-4" style={{ color: gold }} />
            <p className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              style={{ color: textMain, fontFamily: headingFont }}>
              O Atalaia é uma expressão de amor pela igreja. Ele existe para que cada líder tenha suporte, cada célula seja acompanhada, e cada vida seja cuidada com a excelência que o Reino de Deus merece.
            </p>
            <div className="h-px w-16 mx-auto mb-6" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            <p className="text-sm italic mb-1" style={{ color: gold, fontFamily: headingFont }}>
              "Cuidem de todo o rebanho sobre o qual o Espírito Santo os colocou como bispos, para pastorearem a igreja de Deus, que ele comprou com o seu próprio sangue."
            </p>
            <p className="text-xs" style={{ color: textMuted }}>Atos 20:28</p>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/material')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <Shield className="h-4 w-4 mr-2" /> Material Institucional — Atalaia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/manual-lider')}
              className="rounded-full px-5" style={{ background: `${gold}1A`, color: gold, border: `1px solid ${gold}33` }}>
              <BookOpen className="h-4 w-4 mr-2" /> Manual do Líder — Atalaia
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
