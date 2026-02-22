import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';
import logoIgreja from '@/assets/logo-igreja-do-amor.png';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { BookOpen, Heart, Eye, Shield, Sparkles, ArrowLeft, Printer, Church, Waypoints, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/* ── Primitivos visuais (mesma identidade do Material Institucional) ── */

const Section = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <section id={id} className="mb-14 print:mb-8 print:break-inside-avoid">
    {children}
  </section>
);

const SectionTitle = ({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-5">
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

const Paragraph = ({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) => (
  <p
    className="text-sm leading-relaxed mb-4"
    style={{ color: highlight ? '#F6F4F1' : '#D4D2CF', fontWeight: highlight ? 600 : 400 }}
  >
    {children}
  </p>
);

const Anchor = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl p-6 sm:p-8 my-8 text-center" style={{ background: 'rgba(201,162,77,0.08)', border: '1px solid rgba(201,162,77,0.18)' }}>
    <p
      className="text-base sm:text-lg leading-relaxed italic max-w-xl mx-auto"
      style={{ color: '#F6F4F1', fontFamily: "'DM Serif Display', serif" }}
    >
      {children}
    </p>
  </div>
);

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: '#D4D2CF' }}>
    <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: '#C9A24D' }} />
    <span>{children}</span>
  </li>
);

/* ── Página ── */

export default function TestemunhoAtalaia() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)' }}>
      {/* Controles (ocultos na impressão) */}
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

        {/* ══════════════════ CAPA ══════════════════ */}
        <Section id="capa">
          <div className="text-center py-12 sm:py-20 print:py-16">
            <div className="flex justify-center gap-6 mb-8">
              <img src={logoIgreja} alt="Igreja do Amor" className="h-16 sm:h-20 w-auto object-contain opacity-80" />
              <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-16 sm:h-20 w-auto object-contain rounded-full shadow-xl ring-2 ring-[#C9A24D]/20" />
            </div>
            <p
              className="text-xs uppercase tracking-[0.25em] mb-4"
              style={{ color: '#C9A24D', fontFamily: "'Inter', sans-serif" }}
            >
              Testemunho Institucional
            </p>
            <h1
              className="text-3xl sm:text-5xl mb-4 leading-tight"
              style={{ fontFamily: "'DM Serif Display', serif", color: '#F6F4F1', letterSpacing: '-0.02em' }}
            >
              ATALAIA
            </h1>
            <p
              className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
              style={{ color: '#C9A24D', fontFamily: "'DM Serif Display', serif" }}
            >
              Saúde e Cuidado da Rede Amor a 2
            </p>
            <div className="mt-10 h-px w-24 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #C9A24D, transparent)' }} />
            <div className="mt-6 flex justify-center">
              <img src={logoAnoSantidade} alt="Ano da Santidade 2026" className="h-12 w-auto object-contain opacity-50" />
            </div>
          </div>
        </Section>

        {/* ══════════════════ 1. O PROBLEMA REAL ══════════════════ */}
        <Section id="problema">
          <SectionTitle icon={Heart}>Antes do Atalaia</SectionTitle>
          <Paragraph>
            A Rede Amor a 2 sempre cuidou de vidas. Sempre houve líderes de célula dedicados, supervisores atentos, coordenadores comprometidos e uma liderança pastoral presente. O cuidado nunca faltou.
          </Paragraph>
          <Paragraph>
            Mas à medida que a rede crescia, algo ficava cada vez mais difícil: <strong style={{ color: '#F6F4F1' }}>manter a memória viva de tudo o que acontecia</strong>. As informações estavam espalhadas — em cadernos, mensagens de WhatsApp, planilhas, lembranças. O que um supervisor sabia nem sempre chegava ao coordenador. O que o líder de célula registrava nem sempre era visível para quem precisava acompanhar.
          </Paragraph>
          <Paragraph>
            Não era falta de vontade. Era falta de organização. E quando a informação não flui, o cuidado se torna mais difícil, mais lento, mais frágil.
          </Paragraph>
          <Paragraph highlight>
            O desafio não era tecnológico. Era pastoral: como cuidar melhor de mais pessoas sem perder ninguém de vista?
          </Paragraph>
        </Section>

        {/* ══════════════════ 2. O NASCIMENTO ══════════════════ */}
        <Section id="nascimento">
          <SectionTitle icon={Church}>Um sistema que nasceu da vida da igreja</SectionTitle>
          <Paragraph>
            O Atalaia não surgiu de um laboratório de tecnologia. Ele não foi comprado, importado ou adaptado de outro lugar. Ele nasceu dentro da Igreja do Amor, a partir daquilo que já existia na vida real da rede.
          </Paragraph>
          <Paragraph>
            A estrutura já estava lá: líderes de célula que se reúnem toda semana com suas famílias, supervisores que acompanham as células, coordenadores que organizam supervisões e alinhamentos, líderes de rede que enxergam o todo, e pastores que direcionam a visão.
          </Paragraph>
          <Paragraph>
            O que o Atalaia fez foi <strong style={{ color: '#F6F4F1' }}>organizar o que já existia</strong>. Dar forma digital ao fluxo natural de cuidado que a igreja já praticava. Transformar o que era verbal em registro, o que era disperso em visão clara, o que era esforço individual em inteligência coletiva.
          </Paragraph>
          <Paragraph highlight>
            Ele não criou algo artificial. Ele revelou o que já estava ali — e deu a cada pessoa o acesso certo à informação certa, na hora certa.
          </Paragraph>
        </Section>

        {/* ══════════════════ 3. POR QUE FUNCIONA ══════════════════ */}
        <Section id="funciona">
          <SectionTitle icon={Waypoints}>Por que ele funciona</SectionTitle>
          <Paragraph>
            Muitos sistemas falham porque tentam impor uma lógica que não existe na realidade. O Atalaia funciona porque fez o contrário: <strong style={{ color: '#F6F4F1' }}>ele espelha a estrutura real da igreja</strong>.
          </Paragraph>
          <ul className="space-y-3 mb-6">
            <BulletItem>
              Os dados certos estão nos lugares certos, porque <strong style={{ color: '#F6F4F1' }}>cada nível de liderança vê exatamente o que precisa ver</strong> — nem mais, nem menos.
            </BulletItem>
            <BulletItem>
              Os relatórios funcionam porque são preenchidos por <strong style={{ color: '#F6F4F1' }}>pessoas reais que vivem aquela célula</strong> — não por terceiros.
            </BulletItem>
            <BulletItem>
              A hierarquia do sistema é a <strong style={{ color: '#F6F4F1' }}>mesma hierarquia do pastoreio</strong>: líder → supervisor → coordenador → rede → pastor.
            </BulletItem>
            <BulletItem>
              A tecnologia funcionou bem porque a <strong style={{ color: '#F6F4F1' }}>lógica dos dados estava correta desde o início</strong> — ela veio da vida, não de uma teoria.
            </BulletItem>
          </ul>
          <Paragraph>
            O resultado é um sistema que a liderança reconhece como seu, porque ele fala a linguagem da igreja, respeita seu ritmo e serve sua missão.
          </Paragraph>
        </Section>

        {/* ══════════════════ FRASE-ÂNCORA ══════════════════ */}
        <Anchor>
          "O Atalaia não é um sistema criado para medir a igreja.<br />
          Ele existe para servir o pastoreio."
        </Anchor>

        {/* ══════════════════ 4. O SIGNIFICADO DE ATALAIA ══════════════════ */}
        <Section id="atalaia">
          <SectionTitle icon={Eye}>O que significa ser Atalaia</SectionTitle>
          <Paragraph>
            Na Bíblia, o atalaia era aquele que ficava sobre os muros da cidade, vigiando. Não para controlar, mas para proteger. Não para acusar, mas para alertar. O atalaia via primeiro o que os outros ainda não podiam ver — e sua função era servir a todos com essa visão.
          </Paragraph>
          <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(201,162,77,0.06)', border: '1px solid rgba(201,162,77,0.12)' }}>
            <p
              className="text-sm italic leading-relaxed mb-2"
              style={{ color: '#C9A24D', fontFamily: "'DM Serif Display', serif" }}
            >
              "Filho do homem, eu te coloquei como atalaia para a casa de Israel. Sempre que ouvires uma palavra da minha boca, adverte-os da minha parte."
            </p>
            <p className="text-xs" style={{ color: '#B8B6B3' }}>Ezequiel 3:17</p>
          </div>
          <Paragraph>
            Esse é o papel do sistema:
          </Paragraph>
          <ul className="space-y-3 mb-4">
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Vigiar com amor</strong> — acompanhar a saúde de cada célula, sem invasão.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Observar a saúde da rede</strong> — enxergar padrões, tendências e pontos de atenção.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Alertar sem acusar</strong> — mostrar onde o cuidado precisa chegar, sem julgamento.</BulletItem>
            <BulletItem><strong style={{ color: '#F6F4F1' }}>Servir a liderança</strong> — dar clareza para quem decide, apoio para quem executa.</BulletItem>
          </ul>
          <Paragraph highlight>
            O Atalaia não mede pessoas. Ele serve o pastoreio.
          </Paragraph>
        </Section>

        {/* ══════════════════ 5. CONCLUSÃO ══════════════════ */}
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

          {/* ── Encerramento visual ── */}
          <div className="rounded-2xl p-8 sm:p-10 text-center mt-10" style={{ background: 'rgba(201,162,77,0.06)', border: '1px solid rgba(201,162,77,0.15)' }}>
            <BookOpen className="h-8 w-8 mx-auto mb-4" style={{ color: '#C9A24D' }} />
            <p
              className="text-base sm:text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              style={{ color: '#F6F4F1', fontFamily: "'DM Serif Display', serif" }}
            >
              O Atalaia é uma expressão de amor pela igreja. Ele existe para que cada líder tenha suporte, cada célula seja acompanhada, e cada vida seja cuidada com a excelência que o Reino de Deus merece.
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

          {/* Links de navegação */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/material')}
              className="rounded-full px-5"
              style={{ background: 'rgba(201,162,77,0.1)', color: '#C9A24D', border: '1px solid rgba(201,162,77,0.2)' }}
            >
              <Shield className="h-4 w-4 mr-2" /> Material Institucional
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/manual-lider')}
              className="rounded-full px-5"
              style={{ background: 'rgba(201,162,77,0.1)', color: '#C9A24D', border: '1px solid rgba(201,162,77,0.2)' }}
            >
              <BookOpen className="h-4 w-4 mr-2" /> Manual do Líder de Célula
            </Button>
            <p className="text-xs mt-2" style={{ color: '#B8B6B3' }}>
              Igreja do Amor • Rede Amor a 2 • ATALAIA • 2026
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
