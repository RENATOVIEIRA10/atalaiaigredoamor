import { useRef, useState } from 'react';
import { AtalaiaLogoHeader, AtalaiaFooterSignature } from '@/components/institutional/AtalaiaLogoHeader';
import videoRelatorio from '@/assets/manual/video-relatorio.mp4';
import videoMembro from '@/assets/manual/video-membro.mp4';
import {
  ArrowLeft, Printer, Play, Send, UserPlus, CheckSquare,
  Heart, Headphones, MessageCircle, ClipboardList, Smartphone,
  Lightbulb, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const gold = '#C5A059';
const goldBg = `${gold}0F`;
const goldBorder = `${gold}26`;
const textMain = '#F4EDE4';
const textBody = '#D4D2CF';
const textMuted = '#B8B6B3';
const headingFont = "'Outfit', sans-serif";

/* ── Video placeholder URLs (replace with real URLs) ── */
const VIDEO_RELATORIO = videoRelatorio;
const VIDEO_MEMBRO = videoMembro;

/* ── Reusable pieces ── */

const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`mb-12 print:mb-6 print:break-inside-avoid ${className}`}>{children}</section>
);

const SectionTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `linear-gradient(135deg, ${gold} 0%, #D4B366 100%)` }}>
      <Icon className="h-4.5 w-4.5 text-[#1A2F4B]" />
    </div>
    <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: headingFont, color: gold }}>{children}</h2>
  </div>
);

const StepItem = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
    <span className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
      style={{ background: gold, color: '#1A2F4B' }}>{n}</span>
    <span>{children}</span>
  </li>
);

const PastoralNote = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl p-4 mt-4 flex gap-3 items-start"
    style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
    <Heart className="h-4 w-4 mt-0.5 shrink-0" style={{ color: gold }} />
    <p className="text-sm leading-relaxed italic" style={{ color: textBody }}>{children}</p>
  </div>
);

/* ── Video embed component ── */
function VideoEmbed({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasSource] = useState(!!src);

  if (!hasSource) {
    return (
      <div className="rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center gap-3"
        style={{ background: '#0e0e10', border: `1px solid ${goldBorder}` }}>
        <Play className="h-10 w-10" style={{ color: gold, opacity: 0.5 }} />
        <p className="text-sm text-center px-4" style={{ color: textMuted }}>
          Vídeo em preparação — <strong style={{ color: textMain }}>{title}</strong>
        </p>
        <p className="text-xs" style={{ color: textMuted }}>O vídeo será disponibilizado em breve.</p>
      </div>
    );
  }

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const isVimeo = src.includes('vimeo.com');

  if (isYouTube || isVimeo) {
    let embedUrl = src;
    if (isYouTube) {
      const id = src.includes('youtu.be/')
        ? src.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(new URL(src).search).get('v');
      embedUrl = `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (isVimeo) {
      const id = src.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${id}`;
    }

    return (
      <div className="rounded-xl overflow-hidden aspect-video" style={{ border: `1px solid ${goldBorder}` }}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  /* Direct video file — HTML5 player with speed control */
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${goldBorder}` }}>
      <video
        ref={videoRef}
        src={src}
        controls
        muted
        controlsList="nodownload"
        className="w-full"
        playsInline
        preload="metadata"
        onLoadedMetadata={() => {
          if (videoRef.current) videoRef.current.playbackRate = 2;
        }}
      >
        Seu navegador não suporta vídeo.
      </video>
    </div>
  );
}

/* ── Page ── */
export default function ManualUsuario() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0e0e10 0%, #1A2F4B 40%, #121212 100%)' }}>
      {/* Fixed top bar */}
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

      <div className="max-w-2xl mx-auto px-5 py-16 sm:py-20">
        {/* ── CAPA ── */}
        <Section>
          <div className="text-center py-8 sm:py-12 print:py-8">
            <div className="mb-6">
              <AtalaiaLogoHeader size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl mb-2 leading-tight"
              style={{ fontFamily: headingFont, color: textMain, letterSpacing: '-0.02em' }}>
              Manual do Usuário — ATALAIA
            </h1>
            <p className="text-base sm:text-lg" style={{ color: gold, fontFamily: headingFont }}>
              Guia prático para líderes de célula
            </p>
            <p className="text-sm mt-2" style={{ color: textMuted }}>
              Atalaia — Saúde e Cuidado da Rede Amor a Dois
            </p>
            <div className="mt-6 h-px w-20 mx-auto" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          </div>
        </Section>

        {/* ── SEÇÃO 1 — RELATÓRIO ── */}
        <Section>
          <SectionTitle icon={Send}>Como enviar o relatório da célula</SectionTitle>

          <p className="text-sm leading-relaxed mb-5" style={{ color: textBody }}>
            Assista ao vídeo abaixo e siga o passo a passo para enviar corretamente o relatório
            da sua célula pelo <strong style={{ color: textMain }}>Atalaia</strong>.
          </p>

          <VideoEmbed src={VIDEO_RELATORIO} title="Envio de Relatório" />

          <div className="mt-6 rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: textMain, fontFamily: headingFont }}>
              <ClipboardList className="h-4 w-4" style={{ color: gold }} /> Passo a passo
            </h3>
            <ol className="space-y-2.5">
              <StepItem n={1}>Acesse o <strong style={{ color: textMain }}>Atalaia</strong></StepItem>
              <StepItem n={2}>Entre no <strong style={{ color: textMain }}>Dashboard do Líder de Célula</strong></StepItem>
              <StepItem n={3}>Clique em <strong style={{ color: textMain }}>Enviar Relatório</strong></StepItem>
              <StepItem n={4}>Preencha os campos de presença</StepItem>
              <StepItem n={5}>Adicione observações, se necessário</StepItem>
              <StepItem n={6}>Clique em <strong style={{ color: textMain }}>Enviar Relatório</strong></StepItem>
              <StepItem n={7}>Compartilhe pelo <strong style={{ color: textMain }}>WhatsApp</strong> quando solicitado</StepItem>
            </ol>
          </div>

          <PastoralNote>
            O relatório é uma forma de <strong style={{ color: textMain }}>cuidado</strong>, não de controle.
            Ele ajuda a liderança a pastorear melhor cada vida.
          </PastoralNote>
        </Section>

        {/* ── SEÇÃO 2 — CRIAR MEMBRO ── */}
        <Section>
          <SectionTitle icon={UserPlus}>Como criar um membro na célula</SectionTitle>

          <p className="text-sm leading-relaxed mb-5" style={{ color: textBody }}>
            Neste vídeo, você aprende como cadastrar corretamente um novo membro na sua célula.
          </p>

          <VideoEmbed src={VIDEO_MEMBRO} title="Criar Membro" />

          <div className="mt-6 rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: textMain, fontFamily: headingFont }}>
              <ClipboardList className="h-4 w-4" style={{ color: gold }} /> Passo a passo
            </h3>
            <ol className="space-y-2.5">
              <StepItem n={1}>Acesse o <strong style={{ color: textMain }}>Dashboard do Líder</strong></StepItem>
              <StepItem n={2}>Clique em <strong style={{ color: textMain }}>Pessoas</strong></StepItem>
              <StepItem n={3}>Selecione <strong style={{ color: textMain }}>Adicionar Membro</strong></StepItem>
              <StepItem n={4}>Preencha os dados do membro</StepItem>
              <StepItem n={5}>Salve as informações</StepItem>
              <StepItem n={6}>O membro passa a aparecer na sua célula</StepItem>
            </ol>
          </div>

          <PastoralNote>
            Cada cadastro representa uma <strong style={{ color: textMain }}>vida confiada</strong> ao cuidado da célula.
          </PastoralNote>
        </Section>

        {/* ── BOAS PRÁTICAS ── */}
        <Section>
          <SectionTitle icon={Lightbulb}>Boas práticas</SectionTitle>
          <div className="rounded-xl p-5" style={{ background: goldBg, border: `1px solid ${goldBorder}` }}>
            <ul className="space-y-2.5">
              {[
                'Envie o relatório sempre após a célula',
                'Cadastre visitantes o quanto antes',
                'Use o Atalaia como ferramenta de cuidado e organização',
                'Em caso de dúvida, procure seu supervisor ou coordenador',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: textBody }}>
                  <CheckSquare className="h-4 w-4 mt-0.5 shrink-0" style={{ color: gold }} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
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
            <p className="text-xs mt-2" style={{ color: textMuted }}>Eles estão preparados para te ajudar no que precisar.</p>
          </div>
        </Section>

        {/* ── RODAPÉ ── */}
        <div className="text-center pt-4 pb-8">
          <div className="h-px w-16 mx-auto mb-4" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
          <AtalaiaFooterSignature />
        </div>
      </div>
    </div>
  );
}
