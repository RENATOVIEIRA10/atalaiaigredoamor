/**
 * SVG visual illustrations for onboarding slides.
 * Each visual is contextual to the slide's feature.
 */

interface VisualProps {
  type: string;
  accentColor: string; // CSS color string like "hsl(39 48% 56%)"
}

export function OnboardingVisual({ type, accentColor }: VisualProps) {
  const a = accentColor;
  const al = `${a} / 0.15`;
  const am = `${a} / 0.35`;

  // Helper to create hsl strings
  const hsl = (opacity: string) => `hsl(${opacity})`;
  const ha = hsl(a);
  const hal = hsl(al);
  const ham = hsl(am);

  const visuals: Record<string, JSX.Element> = {
    celula: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <circle cx="80" cy="55" r="28" fill={hal} stroke={ham} strokeWidth="1.5"
          className="animate-[breathe-vis_3s_ease-in-out_infinite]" />
        <circle cx="80" cy="55" r="18" fill={hal} stroke={ha} strokeWidth="1.5" />
        {[[80,20],[110,40],[110,70],[80,90],[50,70],[50,40]].map(([cx,cy],i) => (
          <g key={i} style={{ animation: `orbit-in 0.4s ease ${i*0.08}s both` }}>
            <circle cx={cx} cy={cy} r="8" fill={hal} stroke={ham} strokeWidth="1.2" />
            <circle cx={cx} cy={cy-3} r="3" fill={ha} opacity="0.7" />
          </g>
        ))}
        {[[80,20],[110,40],[110,70],[80,90],[50,70],[50,40]].map(([cx,cy],i) => (
          <line key={i} x1="80" y1="55" x2={cx} y2={cy}
            stroke={ham} strokeWidth="1" strokeDasharray="3 3"
            style={{ animation: `dash-in 0.5s ease ${i*0.1}s both` }} />
        ))}
      </svg>
    ),
    relatorio: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="30" y="15" width="100" height="90" rx="10" fill={hal} stroke={ham} strokeWidth="1.5" />
        {[[45,38,70],[45,52,90],[45,66,60],[45,80,80]].map(([x,y,w],i) => (
          <g key={i} style={{ animation: `slide-right-vis 0.4s ease ${i*0.1}s both` }}>
            <circle cx={x} cy={y} r="3.5" fill={ha} opacity="0.6" />
            <rect x={x+10} y={y-4} width={w} height="8" rx="4" fill={ham} />
          </g>
        ))}
        <circle cx="120" cy="105" r="12" fill={ha} style={{ animation: "pop-vis 0.5s ease 0.5s both" }} />
        <path d="M114 105 L118 109 L126 101" stroke="hsl(var(--background))" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    nova_vida: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <ellipse cx="80" cy="90" rx="50" ry="8" fill={hal} />
        <path d="M40 90 L40 50 A40 40 0 0 1 120 50 L120 90" fill={hal} stroke={ham} strokeWidth="1.5" />
        <path d="M80 20 L80 60" stroke={ha} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="40" style={{ animation: "dash-down 0.8s ease 0.3s both" }} />
        <path d="M68 50 L80 62 L92 50" stroke={ha} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="18" r="8" fill={hal} stroke={ha} strokeWidth="1.5"
          className="animate-[breathe-vis_2s_ease-in-out_infinite]" />
        <circle cx="80" cy="18" r="4" fill={ha} opacity="0.8" />
      </svg>
    ),
    supervisao: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <path d="M20 60 Q80 10 140 60 Q80 110 20 60Z" fill={hal} stroke={ham} strokeWidth="1.5" />
        <circle cx="80" cy="60" r="20" fill={hal} stroke={ha} strokeWidth="2" />
        <circle cx="80" cy="60" r="10" fill={ha} opacity="0.4" />
        <circle cx="80" cy="60" r="5" fill={ha} />
      </svg>
    ),
    checklist: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="25" y="10" width="110" height="100" rx="12" fill={hal} stroke={ham} strokeWidth="1.5" />
        {[
          [true, 35], [true, 55], [true, 75], [false, 95],
        ].map(([done, y], i) => (
          <g key={i} style={{ animation: `slide-right-vis 0.4s ease ${i*0.1}s both` }}>
            <circle cx="45" cy={y as number} r="8" fill={done ? ha : "transparent"}
              stroke={done ? ha : ham} strokeWidth="1.5" />
            {done && <path d={`M${41} ${y} L${44} ${(y as number)+3} L${49} ${(y as number)-4}`}
              stroke="hsl(var(--background))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="60" y={(y as number)-5} width={done ? 65 : 50} height="10" rx="5" fill={ham} />
          </g>
        ))}
      </svg>
    ),
    whatsapp: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <circle cx="80" cy="60" r="40" fill="hsl(var(--wa) / 0.12)" stroke="hsl(var(--wa) / 0.3)" strokeWidth="1.5" />
        <circle cx="80" cy="60" r="28" fill="hsl(var(--wa) / 0.15)" />
        <path d="M80 38 C67 38 56 48 56 60 C56 65 58 69 61 73 L58 82 L68 79 C72 81 76 82 80 82 C93 82 104 72 104 60 C104 48 93 38 80 38Z"
          fill="hsl(var(--wa) / 0.3)" stroke="hsl(var(--wa) / 0.6)" strokeWidth="1.5" />
      </svg>
    ),
    organograma: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <circle cx="80" cy="15" r="10" fill={ha} opacity="0.8" />
        <line x1="80" y1="25" x2="50" y2="45" stroke={ham} strokeWidth="1.5" />
        <line x1="80" y1="25" x2="110" y2="45" stroke={ham} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="8" fill={hal} stroke={ha} strokeWidth="1.5" />
        <circle cx="110" cy="50" r="8" fill={hal} stroke={ha} strokeWidth="1.5" />
        {[[30,78],[50,78],[70,78],[90,78],[110,78],[130,78]].map(([cx,cy],i) => (
          <g key={i}>
            <line x1={i < 3 ? 50 : 110} y1="58" x2={cx} y2={cy-8}
              stroke={ham} strokeWidth="1" strokeDasharray="3 2" />
            <circle cx={cx} cy={cy} r="6" fill={hal} stroke={ham} strokeWidth="1"
              style={{ animation: `pop-vis 0.3s ease ${i*0.07}s both` }} />
          </g>
        ))}
      </svg>
    ),
    campus: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="20" y="20" width="120" height="80" rx="10" fill={hal} stroke={ham} strokeWidth="1.5" />
        {[[50,45],[80,35],[110,55],[65,70],[95,75]].map(([cx,cy],i) => (
          <g key={i} style={{ animation: `pop-vis 0.4s ease ${i*0.1}s both` }}>
            <circle cx={cx} cy={cy} r={i===1 ? 10 : 7} fill={i===1 ? ha : hal}
              stroke={ha} strokeWidth={i===1 ? 2 : 1.5} opacity={i===1 ? 1 : 0.7} />
            {i===1 && <circle cx={cx} cy={cy} r="4" fill="hsl(var(--background))" />}
          </g>
        ))}
        <line x1="50" y1="45" x2="80" y2="35" stroke={ham} strokeWidth="1" strokeDasharray="4 3" />
        <line x1="80" y1="35" x2="110" y2="55" stroke={ham} strokeWidth="1" strokeDasharray="4 3" />
      </svg>
    ),
    global: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <circle cx="80" cy="60" r="45" fill={hal} stroke={ham} strokeWidth="1.5" />
        <ellipse cx="80" cy="60" rx="25" ry="45" fill="none" stroke={ham} strokeWidth="1" />
        <ellipse cx="80" cy="60" rx="45" ry="18" fill="none" stroke={ham} strokeWidth="1" />
        <line x1="35" y1="60" x2="125" y2="60" stroke={ham} strokeWidth="1" />
        {[[60,42],[100,48],[72,72],[88,65]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill={ha} opacity={0.6+i*0.1}
            style={{ animation: `pop-vis 0.4s ease ${i*0.12}s both` }} />
        ))}
        <circle cx="80" cy="60" r="7" fill={ha}
          className="animate-[breathe-vis_2s_ease-in-out_infinite]" />
      </svg>
    ),
    ia: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <circle cx="80" cy="55" r="35" fill={hal} stroke={ham} strokeWidth="1.5" />
        {[[60,40],[100,40],[55,65],[80,35],[105,65],[80,75]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill={ha} opacity={0.4+i*0.1}
            className="animate-[breathe-vis_2s_ease-in-out_infinite]" />
        ))}
        {[[60,40,100,40],[60,40,55,65],[100,40,105,65],[55,65,80,75],[105,65,80,75],[80,35,60,40],[80,35,100,40]].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={ham} strokeWidth="1" strokeDasharray="3 3" />
        ))}
        <circle cx="80" cy="55" r="8" fill={ha} opacity="0.3"
          className="animate-[breathe-vis_2s_ease-in-out_infinite]" />
      </svg>
    ),
    historia: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <line x1="30" y1="60" x2="130" y2="60" stroke={ham} strokeWidth="1.5" />
        {[[30,60],[55,45],[80,55],[105,35],[130,50]].map(([cx,cy],i) => (
          <g key={i} style={{ animation: `pop-vis 0.4s ease ${i*0.12}s both` }}>
            <circle cx={cx} cy={cy} r="7" fill={hal} stroke={ha} strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="3" fill={ha} opacity="0.7" />
            <line x1={cx} y1={cy+7} x2={cx} y2="60" stroke={ham} strokeWidth="1" strokeDasharray="3 2" />
          </g>
        ))}
      </svg>
    ),
    cadastro: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="30" y="20" width="100" height="80" rx="12" fill={hal} stroke={ham} strokeWidth="1.5" />
        <circle cx="80" cy="52" r="16" fill={hal} stroke={ha} strokeWidth="1.5" />
        <circle cx="80" cy="47" r="6" fill={ha} opacity="0.6" />
        <path d="M64 65 Q80 72 96 65" stroke={ha} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <rect x="45" y="76" width="70" height="8" rx="4" fill={ham} />
        <rect x="55" y="90" width="50" height="6" rx="3" fill={ham} opacity="0.7" />
      </svg>
    ),
    contagem: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        <rect x="50" y="10" width="60" height="100" rx="12" fill={hal} stroke={ham} strokeWidth="1.5" />
        <text x="80" y="65" textAnchor="middle" fill={ha}
          style={{ font: "300 36px 'Cormorant Garamond', serif" }}>247</text>
        <rect x="58" y="76" width="20" height="20" rx="6" fill={ham} />
        <text x="68" y="90" textAnchor="middle" fill="hsl(var(--foreground))"
          style={{ font: "500 11px 'DM Sans', sans-serif" }}>+1</text>
        <rect x="82" y="76" width="20" height="20" rx="6" fill={ha} />
        <text x="92" y="90" textAnchor="middle" fill="hsl(var(--background))"
          style={{ font: "500 10px 'DM Sans', sans-serif" }}>+10</text>
      </svg>
    ),
    simulacao: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        {["hsl(var(--gold))", "hsl(var(--vida))", "hsl(var(--blue-soft))", "hsl(var(--ruby))"].map((color, i) => (
          <rect key={i} x={20+i*8} y={20+i*6} width="100" height="60" rx="10"
            fill={`${color.slice(0,-1)} / 0.15)`} stroke={`${color.slice(0,-1)} / 0.4)`} strokeWidth="1.5"
            style={{ animation: `slide-up 0.4s ease ${i*0.1}s both` }} />
        ))}
        <rect x="36" y="44" width="68" height="12" rx="4" fill="hsl(var(--ruby) / 0.4)" stroke="hsl(var(--ruby) / 0.6)" strokeWidth="1" />
        <text x="70" y="54" textAnchor="middle" fill="hsl(var(--ruby))"
          style={{ font: "500 8px 'DM Mono', monospace", letterSpacing: "0.1em" }}>ADMINISTRADOR</text>
      </svg>
    ),
    funil: (
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
        {[
          [20,100,"hsl(var(--gold))","100%"],
          [32,80,"hsl(var(--vida))","76%"],
          [44,60,"hsl(var(--blue-soft))","47%"],
          [56,40,"hsl(var(--ruby))","29%"],
          [68,20,"hsl(var(--vida))","16%"],
        ].map(([x,w,color,pct],i) => (
          <g key={i}>
            <rect x={x as number} y={10+i*20} width={(w as number)*1.2} height="16" rx="4"
              fill={`${(color as string).slice(0,-1)} / 0.2)`}
              stroke={`${(color as string).slice(0,-1)} / 0.5)`}
              strokeWidth="1"
              style={{ animation: `grow-bar 0.5s ease ${i*0.1}s both` }} />
            <text x={(x as number) + (w as number)*1.2 + 6} y={10+i*20+11}
              fill={`${(color as string).slice(0,-1)} / 0.8)`}
              style={{ font: "300 9px 'DM Mono', monospace" }}>{pct as string}</text>
          </g>
        ))}
      </svg>
    ),
  };

  // Default visual
  const defaultVisual = (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none">
      <circle cx="80" cy="60" r="40" fill={hal} stroke={ham} strokeWidth="1.5" />
      <circle cx="80" cy="60" r="25" fill={hal} stroke={ha} strokeWidth="2" />
      <circle cx="80" cy="60" r="10" fill={ha} opacity="0.6"
        className="animate-[breathe-vis_2s_ease-in-out_infinite]" />
    </svg>
  );

  return (
    <div className="flex justify-center items-center h-[140px] animate-[vis-in_0.6s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
      {visuals[type] || defaultVisual}
    </div>
  );
}
