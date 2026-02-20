import logoRedeAmor from '@/assets/logo-rede-amor-a2.png';
import logoIgreja from '@/assets/logo-igreja-do-amor.png';
import {
  ArrowLeft, Printer, Users, ClipboardList, Send, CheckSquare,
  AlertTriangle, Heart, Headphones, Smartphone, CalendarDays,
  MessageCircle, FileText, Camera, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const gold = '#C9A24D';
const goldBg = 'rgba(201,162,77,0.06)';
const goldBorder = 'rgba(201,162,77,0.15)';
const goldIcon = 'rgba(201,162,77,0.15)';
const textMain = '#F6F4F1';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const serif = "'DM Serif Display', serif";

const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`mb-10 print:mb-6 print:break-inside-avoid ${className}`}>{children}</section>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${gold} 0%, #D4B366 100%)` }}>
      <Icon className="h-4.5 w-4.5 text-[#1a0a0b]" />
    </div>
    <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: serif, color: gold }}>{children}</h2>
  </div>
);

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
    <CheckSquare className="h-4 w-4 mt-0.5 shrink-0" style={{ color: gold }} />
    <span>{children}</span>
  </li>
);

const StepItem = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
    <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ background: gold, color: '#1a0a0b' }}>{n}</span>
    <span>{children}</span>
  </li>
);

const FaqItem = ({ q, a }: { q: string; a: string }) => (
  <div className="rounded-xl p-4" style={{ background: 'rgba(211,47,47,0.04)', border: '1px solid rgba(211,47,47,0.12)' }}>
    <p className="text-sm font-semibold mb-1" style={{ color: textMain }}>
      <AlertTriangle className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" style={{ color: '#ef5350' }} />
      {q}
    </p>
    <p className="text-sm leading-relaxed" style={{ color: textBody }}>{a}</p>
  </div>
);

export default function ManualLiderCelula() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1a0a0b 40%, #121212 100%)' }}>
      {/* Controles */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}
          className="backdrop-blur-md rounded-full px-4" style={{ background: 'rgba(0,0,0,0.5)', color: textMain }}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}
          className="backdrop-blur-md rounded-full px-4" style={{ background: 'rgba(201,162,77,0.2)', color: gold }}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-16 sm:py-20">
        {/* ── CAPA ── */}
        <Section>
          <div className="text-center py-8 sm:py-12 print:py-8">
            <div className="flex justify-center gap-5 mb-6">
              <img src={logoIgreja} alt="Igreja do Amor" className="h-14 sm:h-16 w-auto object-contain opacity-80" />
              <img src={logoRedeAmor} alt="Rede Amor a 2" className="h-14 sm:h-16 w-auto object-contain rounded-full shadow-xl ring-2 ring-[#C9A24D]/20" />
            </div>
            <h1 className="text-2xl sm:text-3xl mb-2 leading-tight" style={{ fontFamily: serif, color: textMain, letterSpacing: '-0.02em' }}>
              Manual Rápido
            </h1>
            <p className="text-base sm:text-lg" style={{ color: gold, fontFamily: serif }}>
              Líder de Célula • Rede Amor a 2
            </p>
            <div className="mt-6 h-px w-20 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          </div>
        </Section>

        {/* ── PARA QUE SERVE ── */}
        <Section>
          <SectionTitle icon={Info}>Para que serve o sistema?</SectionTitle>
          <div className="rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <p className="text-sm leading-relaxed" style={{ color: textBody }}>
              O sistema <strong style={{ color: textMain }}>Rede Amor a 2</strong> é a ferramenta da nossa igreja para ajudar você, líder, a:
            </p>
            <ul className="mt-3 space-y-2">
              <CheckItem><strong style={{ color: textMain }}>Organizar sua célula</strong> — membros, aniversários e contatos em um só lugar.</CheckItem>
              <CheckItem><strong style={{ color: textMain }}>Guardar o histórico</strong> — tudo fica salvo, semana a semana.</CheckItem>
              <CheckItem><strong style={{ color: textMain }}>Facilitar o cuidado</strong> — você enxerga quem precisa de atenção.</CheckItem>
              <CheckItem><strong style={{ color: textMain }}>Padronizar relatórios</strong> — envio rápido e formatado pelo WhatsApp.</CheckItem>
            </ul>
          </div>
        </Section>

        {/* ── O QUE VOCÊ FAZ ── */}
        <Section>
          <SectionTitle icon={Smartphone}>O que você faz no sistema?</SectionTitle>
          <div className="grid gap-3">
            {[
              { icon: Users, title: 'Cadastrar e atualizar membros', desc: 'Nome, aniversário, WhatsApp e progresso espiritual de cada pessoa da célula.' },
              { icon: ClipboardList, title: 'Preencher o relatório semanal', desc: 'Quantos vieram, visitantes, crianças, discipulados — leva menos de 2 minutos.' },
              { icon: Send, title: 'Enviar pelo WhatsApp', desc: 'Um toque no botão e o relatório já vai formatado para o grupo ou supervisor.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border p-4 flex gap-3 items-start" style={{ borderColor: goldBorder, background: goldBg }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: goldIcon }}>
                  <Icon className="h-4 w-4" style={{ color: gold }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5" style={{ color: textMain, fontFamily: serif }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: textMuted }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── FLUXO DA SEMANA ── */}
        <Section>
          <SectionTitle icon={CalendarDays}>Fluxo da semana</SectionTitle>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: gold }}>✅ Antes da célula</h3>
              <ul className="space-y-2 pl-1">
                <CheckItem>Confirme a lista de membros no sistema (novos? saíram alguém?).</CheckItem>
                <CheckItem>Verifique aniversariantes da semana para parabenizar.</CheckItem>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: gold }}>✅ No dia da célula</h3>
              <ul className="space-y-2 pl-1">
                <CheckItem>Faça a contagem: membros presentes, visitantes e crianças.</CheckItem>
                <CheckItem>Tire a foto da célula (opcional, mas recomendado!).</CheckItem>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: gold }}>✅ Depois da célula (relatório)</h3>
              <ul className="space-y-2 pl-1">
                <CheckItem>Abra o sistema no celular e preencha o relatório da semana.</CheckItem>
                <CheckItem>Salve e envie pelo WhatsApp com o botão do app.</CheckItem>
              </ul>
            </div>
          </div>
        </Section>

        {/* ── PASSO A PASSO ── */}
        <Section>
          <SectionTitle icon={FileText}>Como enviar o relatório</SectionTitle>
          <div className="rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <ol className="space-y-3">
              <StepItem n={1}>Abra o sistema e vá até <strong style={{ color: textMain }}>"Relatório"</strong>.</StepItem>
              <StepItem n={2}>Preencha os números da semana (presentes, visitantes, crianças, discipulados).</StepItem>
              <StepItem n={3}>Toque em <strong style={{ color: textMain }}>"Salvar"</strong>.</StepItem>
              <StepItem n={4}>Toque em <strong style={{ color: textMain }}>"Enviar no WhatsApp"</strong> — o app monta tudo para você.</StepItem>
              <StepItem n={5}>Escolha o grupo ou contato no WhatsApp e envie. Depois, volte para o app.</StepItem>
            </ol>
          </div>
        </Section>

        {/* ── PADRÕES DO RELATÓRIO ── */}
        <Section>
          <SectionTitle icon={Camera}>Sobre os blocos do relatório</SectionTitle>
          <div className="rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <ul className="space-y-2">
              <CheckItem>
                O relatório enviado pelo WhatsApp contém blocos automáticos: <strong style={{ color: textMain }}>foto da célula</strong>, <strong style={{ color: textMain }}>dados da célula</strong> e <strong style={{ color: textMain }}>números da semana</strong>.
              </CheckItem>
              <CheckItem>
                Os textos de <strong style={{ color: textMain }}>"Nossa Mensagem"</strong>, <strong style={{ color: textMain }}>"Paixão"</strong> e <strong style={{ color: textMain }}>"Cultura"</strong> já vêm prontos — <strong style={{ color: gold }}>não precisa editar</strong>.
              </CheckItem>
            </ul>
          </div>
        </Section>

        {/* ── ERROS COMUNS ── */}
        <Section>
          <SectionTitle icon={AlertTriangle}>Problemas comuns</SectionTitle>
          <div className="grid gap-3">
            <FaqItem
              q='"Não consigo enviar no WhatsApp"'
              a="Verifique se o WhatsApp está instalado no celular. O botão abre o WhatsApp automaticamente — se não abrir, tente atualizar o app ou o navegador."
            />
            <FaqItem
              q='"Meu relatório sumiu"'
              a="Ele não sumiu! Verifique se está na semana correta. Use o seletor de semana no topo da tela para navegar entre as datas."
            />
            <FaqItem
              q='"Meu número/WhatsApp não aparece"'
              a="Cadastre o WhatsApp do membro na ficha dele. Sem o número salvo, o sistema não consegue mostrar."
            />
            <FaqItem
              q='"Não achei o botão voltar"'
              a="No celular, use a seta ← no topo da tela ou o menu inferior para navegar entre as seções."
            />
          </div>
        </Section>

        {/* ── REFORÇO PASTORAL ── */}
        <Section>
          <SectionTitle icon={Heart}>Lembre-se</SectionTitle>
          <div className="rounded-xl p-6 text-center" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: textBody }}>
              Esse sistema é uma <strong style={{ color: textMain }}>ferramenta de cuidado</strong>, não de cobrança.
              Ele existe para te ajudar a organizar, lembrar e cuidar melhor das vidas que Deus colocou
              sob sua responsabilidade. <strong style={{ color: gold }}>Você não está sozinho.</strong> Sua liderança está com você.
            </p>
          </div>
        </Section>

        {/* ── SUPORTE ── */}
        <Section>
          <SectionTitle icon={Headphones}>Suporte</SectionTitle>
          <div className="rounded-xl p-5 text-center" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <MessageCircle className="h-6 w-6 mx-auto mb-3" style={{ color: gold }} />
            <p className="text-sm leading-relaxed" style={{ color: textBody }}>
              Tem dúvidas? <strong style={{ color: textMain }}>Fale com seu supervisor ou coordenador.</strong>
            </p>
            <p className="text-xs mt-2" style={{ color: textMuted }}>
              Eles estão preparados para te ajudar no que precisar.
            </p>
          </div>
        </Section>

        {/* ── RODAPÉ ── */}
        <div className="text-center pt-4 pb-8">
          <div className="h-px w-16 mx-auto mb-4" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          <p className="text-xs" style={{ color: textMuted }}>
            Igreja do Amor • Rede Amor a 2 • 2026
          </p>
        </div>
      </div>
    </div>
  );
}
