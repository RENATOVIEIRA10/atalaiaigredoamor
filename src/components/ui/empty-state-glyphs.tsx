/**
 * Glyphs SVG exclusivos para empty states do Atalaia OS.
 * Cada glyph representa um contexto pastoral específico.
 */

// ─── Torre (relatório semanal) ───────────────────────────────────────────────
export function GlyphTorre() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      {/* Glow base */}
      <circle cx="40" cy="60" rx="20" ry="4" fill="hsl(var(--primary) / 0.08)" />
      {/* Torre */}
      <rect x="32" y="18" width="16" height="40" rx="2" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none"
        style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'emptyGlyphDash 1.2s ease-out 0.3s forwards' }} />
      {/* Ponto vigia */}
      <circle cx="40" cy="14" r="4" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary) / 0.15)"
        style={{ animation: 'emptyGlyphIn 0.8s ease-out 0.6s both' }} />
      {/* Janelas */}
      <rect x="36" y="28" width="8" height="6" rx="1" fill="hsl(var(--primary) / 0.12)"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 0.8s both' }} />
      {/* Base */}
      <line x1="26" y1="58" x2="54" y2="58" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
    </svg>
  );
}

// ─── Semente (membros) ───────────────────────────────────────────────────────
export function GlyphSemente() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="40" cy="60" rx="18" ry="3" fill="hsl(var(--vida) / 0.06)" />
      {/* Caule */}
      <line x1="40" y1="56" x2="40" y2="32" stroke="hsl(var(--vida))" strokeWidth="1.5"
        style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'emptyGlyphDash 0.8s ease-out 0.2s forwards' }} />
      {/* Folha esq */}
      <path d="M40 38 C34 34 30 28 34 24 C38 28 40 34 40 38Z" fill="hsl(var(--vida) / 0.18)" stroke="hsl(var(--vida))" strokeWidth="1"
        style={{ animation: 'emptyGlyphIn 0.6s ease-out 0.5s both' }} />
      {/* Folha dir */}
      <path d="M40 32 C46 28 50 22 46 18 C42 22 40 28 40 32Z" fill="hsl(var(--vida) / 0.18)" stroke="hsl(var(--vida))" strokeWidth="1"
        style={{ animation: 'emptyGlyphIn 0.6s ease-out 0.7s both' }} />
      {/* Semente */}
      <ellipse cx="40" cy="58" rx="5" ry="3" fill="hsl(var(--vida) / 0.25)" stroke="hsl(var(--vida))" strokeWidth="1"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 0.9s both' }} />
      {/* Brilho */}
      <circle cx="42" cy="57" r="1" fill="hsl(var(--vida) / 0.5)" />
    </svg>
  );
}

// ─── Portal (recomeço / novas vidas) ─────────────────────────────────────────
export function GlyphPortal() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      {/* Anéis de ripple */}
      <circle cx="40" cy="40" r="30" stroke="hsl(var(--primary) / 0.06)" strokeWidth="0.5"
        style={{ animation: 'emptyRipple 3s ease-out infinite' }} />
      <circle cx="40" cy="40" r="22" stroke="hsl(var(--primary) / 0.08)" strokeWidth="0.5"
        style={{ animation: 'emptyRipple 3s ease-out 0.5s infinite' }} />
      <circle cx="40" cy="40" r="14" stroke="hsl(var(--primary) / 0.1)" strokeWidth="0.5"
        style={{ animation: 'emptyRipple 3s ease-out 1s infinite' }} />
      {/* Arco portal */}
      <path d="M28 58 Q28 26 40 20 Q52 26 52 58" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none"
        style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: 'emptyGlyphDash 1s ease-out 0.3s forwards' }} />
      {/* Base do portal */}
      <line x1="26" y1="58" x2="54" y2="58" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
      {/* Cruz/estrela no centro */}
      <line x1="40" y1="34" x2="40" y2="46" stroke="hsl(var(--primary))" strokeWidth="1"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 0.8s both' }} />
      <line x1="34" y1="40" x2="46" y2="40" stroke="hsl(var(--primary))" strokeWidth="1"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 0.9s both' }} />
      {/* Linhas de luz */}
      {[34, 40, 46].map((x, i) => (
        <line key={i} x1={x} y1="50" x2={x} y2="56" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.5"
          style={{ animation: `emptyGlyphIn 0.4s ease-out ${1 + i * 0.1}s both` }} />
      ))}
    </svg>
  );
}

// ─── Calendário (supervisões) ────────────────────────────────────────────────
export function GlyphCalendario() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="18" y="22" width="44" height="40" rx="4" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none"
        style={{ strokeDasharray: 200, strokeDashoffset: 200, animation: 'emptyGlyphDash 1s ease-out 0.2s forwards' }} />
      {/* Ganchos */}
      <line x1="30" y1="18" x2="30" y2="26" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <line x1="50" y1="18" x2="50" y2="26" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {/* Linha header */}
      <line x1="18" y1="32" x2="62" y2="32" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
      {/* Grid de dias */}
      {[
        [24,42],[32,42],[40,42],[48,42],[56,42],
        [24,52],[32,52],[40,52],[48,52],[56,52],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="hsl(var(--muted-foreground) / 0.12)"
          style={{ animation: `emptyGlyphIn 0.3s ease-out ${0.5 + i * 0.04}s both` }} />
      ))}
      {/* Símbolo vazio no centro */}
      <text x="40" y="50" textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground) / 0.2)"
        fontFamily="DM Mono, monospace" style={{ animation: 'emptyGlyphIn 0.5s ease-out 1s both' }}>∅</text>
    </svg>
  );
}

// ─── Moeda (financeiro) ──────────────────────────────────────────────────────
export function GlyphMoeda() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <ellipse cx="40" cy="44" rx="20" ry="20" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none"
        style={{ strokeDasharray: 130, strokeDashoffset: 130, animation: 'emptyGlyphDash 1s ease-out 0.2s forwards' }} />
      <ellipse cx="40" cy="40" rx="20" ry="20" stroke="hsl(var(--primary) / 0.3)" strokeWidth="0.5" fill="hsl(var(--primary) / 0.04)"
        style={{ animation: 'emptyGlyphIn 0.6s ease-out 0.4s both' }} />
      {/* Símbolo */}
      <text x="40" y="46" textAnchor="middle" fontSize="14" fill="hsl(var(--primary))"
        fontFamily="DM Mono, monospace" fontWeight="500"
        style={{ animation: 'emptyGlyphIn 0.6s ease-out 0.7s both' }}>R$</text>
      {/* Brilho topo */}
      <ellipse cx="34" cy="30" rx="6" ry="2" fill="hsl(var(--primary) / 0.08)" transform="rotate(-20 34 30)" />
    </svg>
  );
}

// ─── Ampulheta (estado genérico / aguardando) ────────────────────────────────
export function GlyphEspera() {
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="40" cy="40" r="24" stroke="hsl(var(--muted-foreground) / 0.1)" strokeWidth="0.5"
        style={{ animation: 'emptyRipple 4s ease-in-out infinite' }} />
      {/* Ampulheta */}
      <path d="M30 22 L50 22 L40 40 L50 58 L30 58 L40 40 Z" stroke="hsl(var(--muted-foreground) / 0.4)" strokeWidth="1.5" fill="none"
        style={{ strokeDasharray: 160, strokeDashoffset: 160, animation: 'emptyGlyphDash 1.2s ease-out 0.3s forwards' }} />
      {/* Areia caindo */}
      <circle cx="40" cy="38" r="1.5" fill="hsl(var(--primary) / 0.3)"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 0.8s both' }} />
      <circle cx="40" cy="50" r="2" fill="hsl(var(--primary) / 0.15)"
        style={{ animation: 'emptyGlyphIn 0.5s ease-out 1s both' }} />
      {/* Linhas topo/base */}
      <line x1="28" y1="22" x2="52" y2="22" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" />
      <line x1="28" y1="58" x2="52" y2="58" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" />
    </svg>
  );
}
