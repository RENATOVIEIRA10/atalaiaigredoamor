import { useState } from "react";
// ── TOKENS ──────────────────────────────────────────────────
const C = {
  deep:    "#0D1B2A",
  navy:    "#1A2F4B",
  mid:     "#1E3A5F",
  gold:    "#C5A059",
  goldLow: "rgba(197,160,89,0.10)",
  goldMid: "rgba(197,160,89,0.22)",
  vida:    "#4BAE8A",
  vidaLow: "rgba(75,174,138,0.10)",
  ruby:    "#C0544A",
  rubyLow: "rgba(192,84,74,0.10)",
  blue:    "#7B9FD4",
  blueLow: "rgba(123,159,212,0.10)",
  text:    "#E8E0D4",
  muted:   "rgba(232,224,212,0.45)",
  white:   "#FFFFFF",
};
// ── DADOS ───────────────────────────────────────────────────
const CHECKLIST = [
  { id: 1,  area: "Banco de Dados",  item: "RLS ativo em todas as tabelas (Supabase)",                           status: "ok",      resp: "Dev Backend"    },
  { id: 2,  area: "Banco de Dados",  item: "Filtro obrigatório por campo_id — Zero Fallback Rule",               status: "ok",      resp: "Dev Backend"    },
  { id: 3,  area: "Infraestrutura",  item: "HTTPS obrigatório em todo o tráfego (TLS 1.3)",                      status: "ok",      resp: "Lovable / Infra" },
  { id: 4,  area: "Autenticação",    item: "Tokens JWT com expiração automática",                                 status: "ok",      resp: "Supabase Auth"  },
  { id: 5,  area: "Infraestrutura",  item: "Backup automático diário com retenção de 7 dias",                    status: "ok",      resp: "Supabase Pro"   },
  { id: 6,  area: "Autenticação",    item: "Acesso por código de escopo por papel ministerial (RBAC)",            status: "ok",      resp: "Dev Backend"    },
  { id: 7,  area: "Banco de Dados",  item: "Criptografia AES-256 em repouso (gerenciada pelo Supabase)",         status: "ok",      resp: "Supabase"       },
  { id: 8,  area: "Auditoria",       item: "Logs de auditoria para ações sensíveis",                             status: "andamento", resp: "Dev Backend"  },
  { id: 9,  area: "Frontend",        item: "Termo de consentimento no cadastro de nova vida",                    status: "pendente", resp: "Dev Frontend"  },
  { id: 10, area: "Frontend",        item: "Tela de solicitação de exclusão de dados (Art. 18 LGPD)",            status: "pendente", resp: "Dev Frontend"  },
  { id: 11, area: "Organizacional",  item: "Designação formal de Encarregado de Dados (DPO)",                   status: "pendente", resp: "Liderança"     },
  { id: 12, area: "Organizacional",  item: "Treinamento de usuários sobre LGPD e boas práticas",                status: "pendente", resp: "DPO / Igreja"  },
];
const BASES_LEGAIS = [
  { art: "Art. 7º, I",  base: "Consentimento",         uso: "Cadastro de novas vidas e visitantes no culto.",                color: C.gold  },
  { art: "Art. 7º, V",  base: "Execução de contrato",  uso: "Dados necessários para as atividades ministeriais (células, supervisões).", color: C.blue  },
  { art: "Art. 7º, IX", base: "Legítimo interesse",    uso: "Acompanhamento pastoral de membros ativos e discipulados.",    color: C.vida  },
  { art: "Art. 11",     base: "Dados religiosos",       uso: "Tratados com consentimento explícito ou para exercício regular de direitos da entidade.", color: C.gold  },
];
const DIREITOS = [
  { n: "I",    d: "Confirmação da existência de tratamento"              },
  { n: "II",   d: "Acesso aos dados pessoais"                           },
  { n: "III",  d: "Correção de dados incompletos ou inexatos"           },
  { n: "IV",   d: "Anonimização, bloqueio ou eliminação"                },
  { n: "V",    d: "Portabilidade dos dados"                             },
  { n: "VI",   d: "Eliminação dos dados tratados com consentimento"     },
  { n: "VIII", d: "Revogação do consentimento a qualquer momento"       },
  { n: "IX",   d: "Petição à ANPD em caso de descumprimento"           },
];
const PAPEIS_LGPD = [
  { papel: "Controlador",    quem: "Igreja do Amor",          desc: "Define as finalidades e meios do tratamento de dados pessoais no Atalaia OS.", color: C.gold },
  { papel: "Operador",       quem: "Equipe Técnica Atalaia",  desc: "Realiza o tratamento conforme instruções do Controlador.",                    color: C.blue },
  { papel: "Encarregado",    quem: "A designar (DPO)",        desc: "Canal de contato com titulares e com a ANPD. Garante conformidade.",          color: C.vida },
];
// ── SCORE ────────────────────────────────────────────────────
const total      = CHECKLIST.length;
const ok         = CHECKLIST.filter(i => i.status === "ok").length;
const andamento  = CHECKLIST.filter(i => i.status === "andamento").length;
const pendente   = CHECKLIST.filter(i => i.status === "pendente").length;
const score      = Math.round((ok / total) * 100);
// ── COMPONENTES AUXILIARES ───────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    ok:        { label: "Implementado", bg: C.vidaLow, color: C.vida,   dot: C.vida  },
    andamento: { label: "Em andamento", bg: C.goldLow, color: C.gold,   dot: C.gold  },
    pendente:  { label: "Pendente",     bg: C.rubyLow, color: C.ruby,   dot: C.ruby  },
  };
  const s = map[status] ?? map.pendente;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: s.bg }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: s.color, fontFamily: "sans-serif", fontWeight: 600 }}>{s.label}</span>
    </span>
  );
}
function SectionTab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: 10,
        border: active ? "1px solid " + C.gold : "1px solid rgba(255,255,255,0.07)",
        background: active ? C.goldLow : "transparent",
        color: active ? C.gold : C.muted,
        fontSize: 13,
        fontFamily: "sans-serif",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ padding: "1px 7px", borderRadius: 10, background: active ? C.goldMid : "rgba(255,255,255,0.08)", fontSize: 10, color: active ? C.gold : C.muted }}>
          {count}
        </span>
      )}
    </button>
  );
}
function ScoreRing({ value }: { value: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle
        cx={50} cy={50} r={r}
        fill="none"
        stroke={value >= 70 ? C.vida : value >= 40 ? C.gold : C.ruby}
        strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={circ - dash}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x={50} y={50} textAnchor="middle" dominantBaseline="central" fill={C.white} fontSize={20} fontFamily="Georgia, serif" fontWeight="bold">
        {value}%
      </text>
    </svg>
  );
}
// ── ABA: VISÃO GERAL ─────────────────────────────────────────
function TabOverview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Score + KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: 16, alignItems: "center" }}>
        {/* Ring */}
        <div style={{ padding: "20px 24px", borderRadius: 16, background: C.mid, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ScoreRing value={score} />
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 1.5 }}>Conformidade</span>
        </div>
        {[
          { n: ok,        label: "Implementados", color: C.vida, bg: C.vidaLow },
          { n: andamento, label: "Em andamento",  color: C.gold, bg: C.goldLow },
          { n: pendente,  label: "Pendentes",     color: C.ruby, bg: C.rubyLow },
        ].map(k => (
          <div key={k.label} style={{ padding: "20px", borderRadius: 16, background: C.mid, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 42, fontFamily: "Georgia, serif", color: k.color, lineHeight: 1 }}>{k.n}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginTop: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>{k.label}</div>
          </div>
        ))}
      </div>
      {/* Princípio */}
      <div style={{ padding: "18px 22px", borderRadius: 14, background: C.goldLow, border: "1px solid " + C.goldMid }}>
        <div style={{ fontSize: 10, color: C.gold, fontFamily: "sans-serif", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6 }}>Princípio Fundamental</div>
        <p style={{ margin: 0, fontSize: 14, color: C.text, fontFamily: "Georgia, serif", fontStyle: "italic", lineHeight: 1.6 }}>
          "O Atalaia OS trata dados pessoais como instrumento de cuidado pastoral — não como recurso comercial.
          Cada informação coletada existe para servir melhor a uma vida."
        </p>
      </div>
      {/* Zero Fallback */}
      <div style={{ padding: "18px 22px", borderRadius: 14, background: C.mid, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <span style={{ fontSize: 13, color: C.white, fontFamily: "sans-serif", fontWeight: 700 }}>Zero Fallback Rule</span>
          <StatusBadge status="ok" />
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Toda query operacional é obrigatoriamente filtrada por <code style={{ background: "rgba(197,160,89,0.15)", color: C.gold, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>campo_id</code>.
          Qualquer consulta sem esse filtro é bloqueada pelo RLS do Supabase antes de chegar ao banco de dados.
          Não existe fallback — se o filtro não está presente, a operação falha.
        </p>
      </div>
      {/* Papéis LGPD */}
      <div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Papéis LGPD</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PAPEIS_LGPD.map(p => (
            <div key={p.papel} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ minWidth: 110 }}>
                <div style={{ fontSize: 11, color: p.color, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{p.papel}</div>
                <div style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif", marginTop: 2 }}>{p.quem}</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ fontSize: 13, color: C.muted, fontFamily: "sans-serif", lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ── ABA: CHECKLIST ───────────────────────────────────────────
function TabChecklist() {
  const [filter, setFilter] = useState("todos");
  const areas = ["todos", ...Array.from(new Set(CHECKLIST.map(i => i.area)))];
  const filtered = filter === "todos" ? CHECKLIST : CHECKLIST.filter(i => i.area === filter);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filtro por área */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {areas.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: filter === a ? "1px solid " + C.gold : "1px solid rgba(255,255,255,0.08)",
              background: filter === a ? C.goldLow : "transparent",
              color: filter === a ? C.gold : C.muted,
              fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
            }}
          >
            {a}
          </button>
        ))}
      </div>
      {/* Itens */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(item => (
          <div
            key={item.id}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 8, background: item.status === "ok" ? C.vidaLow : item.status === "andamento" ? C.goldLow : C.rubyLow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
              {item.status === "ok" ? "✓" : item.status === "andamento" ? "⟳" : "○"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.4 }}>{item.item}</div>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", marginTop: 3 }}>
                {item.area} · {item.resp}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
// ── ABA: BASE LEGAL ──────────────────────────────────────────
function TabBaseLegal() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.vidaLow, border: "1px solid rgba(75,174,138,0.25)" }}>
        <div style={{ fontSize: 11, color: C.vida, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Dados Sensíveis — Art. 11 LGPD</div>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          O Atalaia OS trata dados de natureza religiosa. O tratamento é realizado exclusivamente
          com consentimento explícito do titular ou para exercício regular de direitos da entidade
          religiosa, conforme Art. 11, I e II, "a".
        </p>
      </div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>Bases Legais Utilizadas</div>
      {BASES_LEGAIS.map(b => (
        <div key={b.art} style={{ padding: "18px 20px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 16 }}>
          <div style={{ padding: "4px 12px", borderRadius: 8, background: "rgba(197,160,89,0.10)", border: "1px solid rgba(197,160,89,0.22)", height: "fit-content", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: b.color, fontFamily: "monospace", fontWeight: 700 }}>{b.art}</span>
          </div>
          <div>
            <div style={{ fontSize: 14, color: C.white, fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 }}>{b.base}</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "sans-serif", lineHeight: 1.55 }}>{b.uso}</div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Dados NÃO coletados</div>
      <div style={{ padding: "16px 20px", borderRadius: 12, background: C.rubyLow, border: "1px solid rgba(192,84,74,0.22)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["CPF / RG", "Dados bancários individuais", "Dados de saúde", "Origem racial ou étnica", "Orientação sexual", "Dados de menores sem consentimento parental"].map(d => (
            <span key={d} style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(192,84,74,0.12)", border: "1px solid rgba(192,84,74,0.22)", fontSize: 12, color: C.ruby, fontFamily: "sans-serif" }}>
              ✗ {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
// ── ABA: DIREITOS ────────────────────────────────────────────
function TabDireitos() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.goldLow, border: "1px solid " + C.goldMid }}>
        <div style={{ fontSize: 11, color: C.gold, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Como exercer seus direitos</div>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Solicite ao seu líder de célula, supervisor ou ao Encarregado de Dados (DPO) da Igreja do Amor.
          Prazo de resposta: até 15 dias úteis conforme regulamentação da ANPD.
        </p>
      </div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>Direitos garantidos — Art. 18 LGPD</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {DIREITOS.map(d => (
          <div key={d.n} style={{ padding: "14px 18px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ padding: "2px 8px", borderRadius: 6, background: C.goldLow, border: "1px solid " + C.goldMid, fontSize: 11, color: C.gold, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{d.n}</span>
            <span style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.5 }}>{d.d}</span>
          </div>
        ))}
      </div>
      {/* Incidente */}
      <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Resposta a incidentes</div>
      <div style={{ padding: "16px 20px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { t: "24h", d: "Identificação e contenção do incidente" },
          { t: "48h", d: "Avaliação de impacto e comunicação à liderança" },
          { t: "72h", d: "Notificação à ANPD e titulares afetados (quando exigido por lei)" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <span style={{ minWidth: 38, padding: "3px 8px", borderRadius: 8, background: C.rubyLow, fontSize: 11, color: C.ruby, fontFamily: "monospace", fontWeight: 700, textAlign: "center" }}>{s.t}</span>
            <span style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>{s.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ── APP PRINCIPAL ────────────────────────────────────────────
export default function AtalaiaLGPD() {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview",  label: "Visão Geral"   },
    { id: "checklist", label: "Checklist",    count: total       },
    { id: "legal",     label: "Base Legal"    },
    { id: "direitos",  label: "Direitos"      },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.deep, padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(197,160,89,0.18)", padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span style={{ fontSize: 18, color: C.white, fontFamily: "Georgia, serif", fontWeight: 700 }}>Segurança e Privacidade</span>
              <span style={{ padding: "2px 10px", borderRadius: 20, background: C.goldLow, border: "1px solid " + C.goldMid, fontSize: 10, color: C.gold, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>LGPD</span>
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "sans-serif" }}>
              Atalaia OS · Lei nº 13.709/2018 · Igreja do Amor — Paulista/PE
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontFamily: "Georgia, serif", color: score >= 70 ? C.vida : C.gold, fontWeight: 700 }}>{score}%</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 1.5 }}>Conformidade</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px 0" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(t => (
            <SectionTab key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} count={t.count} />
          ))}
        </div>
        {/* Conteúdo */}
        {tab === "overview"  && <TabOverview  />}
        {tab === "checklist" && <TabChecklist />}
        {tab === "legal"     && <TabBaseLegal />}
        {tab === "direitos"  && <TabDireitos  />}
      </div>
    </div>
  );
}
