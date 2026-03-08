import logoIgrejaDoAmor from '@/assets/logo-igreja-do-amor-new.png';
import logoAmorADois from '@/assets/logo-amor-a-dois-new.png';

/**
 * Ícone SVG inline do ATALAIA — torre de vigia estilizada.
 * Usado em materiais institucionais.
 */
export function AtalaiaIcon({ className = 'h-14 w-auto' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <svg
        className="h-full w-auto"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M30 80C30 80 35 45 50 20C65 45 70 80 70 80"
          stroke="#C5A059"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M40 65C45 62 55 62 60 65"
          stroke="#C5A059"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="50" cy="15" r="5" fill="#C5A059" />
      </svg>
      <span
        className="text-[8px] font-bold tracking-[0.2em] uppercase leading-none"
        style={{ color: '#C5A059', fontFamily: "'Manrope', 'Inter', sans-serif" }}
      >
        ATALAIA
      </span>
    </div>
  );
}

/**
 * Header padrão com 3 logos na ordem hierárquica:
 * ATALAIA → Igreja do Amor → Rede Amor a Dois
 */
export function AtalaiaLogoHeader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-10 sm:h-12' : 'h-14 sm:h-16';
  const logoH = size === 'sm' ? 'h-10 sm:h-12' : 'h-12 sm:h-14';

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
      <AtalaiaIcon className={`${h} w-auto`} />
      <div className="h-8 w-px opacity-20" style={{ background: '#C5A059' }} />
      <img
        src={logoIgrejaDoAmor}
        alt="Igreja do Amor"
        className={`${logoH} w-auto object-contain opacity-80`}
      />
      <div className="h-8 w-px opacity-20" style={{ background: '#C5A059' }} />
      <img
        src={logoAmorADois}
        alt="Rede Amor a Dois"
        className={`${logoH} w-auto object-contain opacity-80`}
      />
    </div>
  );
}

/**
 * Assinatura institucional de rodapé.
 */
export function AtalaiaFooterSignature() {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs font-semibold" style={{ color: '#C5A059', fontFamily: "'Outfit', sans-serif" }}>
        ATALAIA
      </p>
      <p className="text-[11px]" style={{ color: '#B8B6B3' }}>
        Saúde e Cuidado da Rede Amor a Dois
      </p>
      <p className="text-[10px]" style={{ color: 'rgba(184,182,179,0.6)' }}>
        A serviço da Igreja do Amor • 2026
      </p>
    </div>
  );
}
