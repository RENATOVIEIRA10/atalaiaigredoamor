import { useState, useEffect, useRef } from "react";
// ─────────────────────────────────────────────────────────────
// REGRA CENTRAL:
// A busca por intenção SÓ aparece para roles com nível >= 3
// (coordenador, lider_rede, pastor_campo, pastor_global, admin)
//
// Para lider_celula e supervisor → a busca não existe.
// Eles têm tão poucas ações que a sidebar já é suficiente.
// ─────────────────────────────────────────────────────────────
const C = {
  sand:    "#F4EDE4",
  sandMid: "#EDE4D8",
  sandBdr: "#D8CEBC",
  navy:    "#1A2F4B",
  mid:     "#1E3A5F",
  gold:    "#C5A059",
  goldLow: "rgba(197,160,89,0.12)",
  goldMid: "rgba(197,160,89,0.28)",
  vida:    "#4BAE8A",
  vidaLow: "rgba(75,174,138,0.10)",
  ruby:    "#C0544A",
  text:    "#2C2C2C",
  muted:   "#888880",
  white:   "#FFFFFF",
};
// ── NÍVEIS DE ROLE ────────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
  lider_celula:  1,
  supervisor:    2,
  coordenador:   3,
  lider_rede:    4,
  pastor_campo:  5,
  pastor_global: 6,
  admin:         6,
};
// ── CATÁLOGO DE AÇÕES ─────────────────────────────────────────
const ACTIONS = [
  // ── Nível 1 — Líder de Célula
  { id: "registrar_presenca",    label: "Registrar Presença",       category: "Ações Rápidas", icon: "✅", min_role: 1, scope_type: "celula",      route: "/celula/presenca"          },
  { id: "nova_vida",             label: "Nova Vida",                 category: "Ações Rápidas", icon: "🌱", min_role: 1, scope_type: "celula",      route: "/celula/nova-vida"         },
  { id: "relatorio_celula",      label: "Relatório da Célula",       category: "Ações Rápidas", icon: "📋", min_role: 1, scope_type: "celula",      route: "/celula/relatorio"         },
  { id: "membros_celula",        label: "Membros da Célula",         category: "Páginas",       icon: "👥", min_role: 1, scope_type: "celula",      route: "/celula/membros"           },
  { id: "discipulado_celula",    label: "Discipulado",               category: "Páginas",       icon: "📖", min_role: 1, scope_type: "celula",      route: "/celula/discipulado"       },
  // ── Nível 2 — Supervisor
  { id: "minhas_celulas",        label: "Minhas Células",            category: "Páginas",       icon: "🏠", min_role: 2, scope_type: "supervisao",  route: "/supervisao/celulas"       },
  { id: "supervisao_presencial", label: "Supervisão Presencial",     category: "Ações Rápidas", icon: "👁", min_role: 2, scope_type: "supervisao",  route: "/supervisao/registro"      },
  { id: "radar_saude",           label: "Radar de Saúde",            category: "Páginas",       icon: "📡", min_role: 2, scope_type: "supervisao",  route: "/supervisao/radar"         },
  // ── Nível 3 — Coordenador (PRIMEIRO nível com busca ativa)
  { id: "gestao_coordenacao",    label: "Gestão de Coordenação",     category: "Páginas",       icon: "🗂",  min_role: 3, scope_type: "coordenacao", route: "/coordenacao"              },
  { id: "pulso_vivo",            label: "Pulso Vivo",                category: "Páginas",       icon: "💓", min_role: 3, scope_type: "coordenacao", route: "/coordenacao/pulso"        },
  { id: "supervisores",          label: "Supervisores",              category: "Páginas",       icon: "👁", min_role: 3, scope_type: "coordenacao", route: "/coordenacao/supervisores" },
  { id: "celulas_coordenacao",   label: "Células da Coordenação",    category: "Páginas",       icon: "🏠", min_role: 3, scope_type: "coordenacao", route: "/coordenacao/celulas"      },
  { id: "encaminhar_nova_vida",  label: "Encaminhar Nova Vida",      category: "Ações Rápidas", icon: "🔗", min_role: 3, scope_type: "coordenacao", route: "/coordenacao/encaminhar"   },
  // ── Nível 4 — Líder de Rede
  { id: "gestao_rede",           label: "Gestão de Rede",            category: "Páginas",       icon: "🕸",  min_role: 4, scope_type: "rede",        route: "/rede"                     },
  { id: "organograma_rede",      label: "Organograma da Rede",       category: "Páginas",       icon: "🌐", min_role: 4, scope_type: "rede",        route: "/rede/organograma"         },
  { id: "coordenacoes",          label: "Coordenações",              category: "Páginas",       icon: "🗂",  min_role: 4, scope_type: "rede",        route: "/rede/coordenacoes"        },
  { id: "saude_rede",            label: "Saúde da Rede",             category: "Páginas",       icon: "📊", min_role: 4, scope_type: "rede",        route: "/rede/saude"               },
  // ── Nível 5 — Pastor de Campo
  { id: "dashboard_campus",      label: "Dashboard do Campus",       category: "Páginas",       icon: "🏛",  min_role: 5, scope_type: "campo",       route: "/campus/dashboard"         },
  { id: "gestao_campo",          label: "Gestão de Campo",           category: "Páginas",       icon: "⛪", min_role: 5, scope_type: "campo",       route: "/campus/gestao"            },
  { id: "alertas_pastorais",     label: "Alertas Pastorais",         category: "Ações Rápidas", icon: "🔔", min_role: 5, scope_type: "campo",       route: "/campus/alertas"           },
  { id: "recomeco_campo",        label: "Recomeço do Campus",        category: "Páginas",       icon: "🔄", min_role: 5, scope_type: "campo",       route: "/campus/recomeco"          },
  { id: "central_celulas",       label: "Central de Células",        category: "Páginas",       icon: "🏗",  min_role: 5, scope_type: "campo",       route: "/campus/central"           },
  { id: "guardiaes_culto",       label: "Guardiões do Culto",        category: "Páginas",       icon: "🛡",  min_role: 5, scope_type: "campo",       route: "/campus/guardiaes"         },
  // ── Nível 6 — Pastor Global / Admin
  { id: "visao_global",          label: "Visão Global",              category: "Páginas",       icon: "🌍", min_role: 6, scope_type: "global",      route: "/global/dashboard"         },
  { id: "gestao_admin",          label: "Administração do Sistema",  category: "Páginas",       icon: "⚙️", min_role: 6, scope_type: "global",      route: "/admin"                    },
  { id: "relatorios_globais",    label: "Relatórios Globais",        category: "Páginas",       icon: "📊", min_role: 6, scope_type: "global",      route: "/global/relatorios"        },
];

interface Action {
  id: string;
  label: string;
  category: string;
  icon: string;
  min_role: number;
  scope_type: string;
  route: string;
}

// ── FILTRO PRINCIPAL ──────────────────────────────────────────
function filterActions(actions: Action[], userRole: string, query: string): Action[] {
  const userLevel = ROLE_LEVEL[userRole] ?? 1;
  return actions.filter(action => {
    if (action.min_role > userLevel) return false;
    if (query.length > 0 && !action.label.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
}

function groupByCategory(actions: Action[]) {
  const order = ["Ações Rápidas", "Páginas"];
  const map: Record<string, Action[]> = {};
  actions.forEach(a => {
    if (!map[a.category]) map[a.category] = [];
    map[a.category].push(a);
  });
  return order.filter(k => map[k]).map(k => ({ label: k, items: map[k] }));
}

// ── COMPONENTE DA BUSCA ───────────────────────────────────────
const kbdStyle: React.CSSProperties = {
  padding: "2px 7px", borderRadius: 6,
  background: C.sandMid, border: "1px solid " + C.sandBdr,
  fontSize: 10, color: C.muted, fontFamily: "monospace",
};

function IntentSearch({
  userRole,
  onClose,
  onNavigate,
}: {
  userRole: string;
  onClose: () => void;
  onNavigate: (action: Action) => void;
}) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const userLevel = ROLE_LEVEL[userRole] ?? 1;
  const searchEnabled = userLevel >= 3;
  const filtered = searchEnabled ? filterActions(ACTIONS, userRole, query) : [];
  const groups   = groupByCategory(filtered);
  const flat     = filtered;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setHighlighted(0); }, [query]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && flat[highlighted]) onNavigate(flat[highlighted]);
    if (e.key === "Escape") onClose();
  }

  if (!searchEnabled) return null;

  let itemIndex = -1;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(13,27,42,0.65)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 80, zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560,
          background: C.white,
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          border: "1px solid " + C.sandBdr,
        }}
      >
        {/* Barra de busca */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid " + C.sandMid,
        }}>
          <span style={{ fontSize: 18, color: C.gold }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Navegar por intenção..."
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: 16, color: C.text, background: "transparent",
              fontFamily: "sans-serif",
            }}
          />
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: C.sandMid, border: "none",
              color: C.muted, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Resultados */}
        <div style={{ maxHeight: 420, overflowY: "auto", padding: "8px 0 12px" }}>
          {filtered.length === 0 && query.length > 0 && (
            <div style={{ padding: "24px 20px", textAlign: "center", color: C.muted, fontSize: 14, fontFamily: "sans-serif" }}>
              Nenhum resultado para "{query}"
            </div>
          )}
          {groups.map(group => (
            <div key={group.label}>
              <div style={{
                padding: "8px 20px 4px",
                fontSize: 11, color: C.muted,
                fontFamily: "sans-serif", fontWeight: 600,
                letterSpacing: 1.5, textTransform: "uppercase",
              }}>
                {group.label}
              </div>
              {group.items.map(action => {
                itemIndex++;
                const isHigh = itemIndex === highlighted;
                return (
                  <button
                    key={action.id}
                    onClick={() => onNavigate(action)}
                    onMouseEnter={() => setHighlighted(itemIndex)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      width: "100%", padding: "13px 20px",
                      background: isHigh ? C.sandMid : "transparent",
                      border: "none", textAlign: "left",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: isHigh ? C.goldLow : C.sand,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                      border: "1px solid " + (isHigh ? C.goldMid : C.sandBdr),
                    }}>
                      {action.icon}
                    </span>
                    <span style={{ fontSize: 15, color: C.text, fontFamily: "sans-serif", fontWeight: 500 }}>
                      {action.label}
                    </span>
                    {isHigh && (
                      <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>
                        ↵ abrir
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid " + C.sandMid,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"} no seu escopo
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <kbd style={kbdStyle}>↑↓</kbd>
            <kbd style={kbdStyle}>↵ abrir</kbd>
            <kbd style={kbdStyle}>esc fechar</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DEMONSTRAÇÃO ──────────────────────────────────────────────
const DEMO_ROLES = [
  { id: "lider_celula",  label: "Líder de Célula",  note: "Busca desativada — sidebar é suficiente" },
  { id: "supervisor",    label: "Supervisor",        note: "Busca desativada — sidebar é suficiente" },
  { id: "coordenador",   label: "Coordenador",       note: "Busca ativa — vê coordenação apenas"     },
  { id: "lider_rede",    label: "Líder de Rede",     note: "Busca ativa — vê rede e abaixo"          },
  { id: "pastor_campo",  label: "Pastor de Campo",   note: "Busca ativa — vê todo o campus"          },
  { id: "pastor_global", label: "Pastor Global",     note: "Busca ativa — visão completa"            },
];

export default function IntentSearchDemo() {
  const [role, setRole] = useState("coordenador");
  const [open, setOpen] = useState(false);
  const [navigated, setNavigated] = useState<Action | null>(null);
  const current = DEMO_ROLES.find(r => r.id === role)!;
  const userLevel = ROLE_LEVEL[role] ?? 1;
  const canSearch = userLevel >= 3;
  const totalVisible = filterActions(ACTIONS, role, "").length;

  function handleNavigate(action: Action) {
    setNavigated(action);
    setOpen(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.sand, fontFamily: "sans-serif" }}>
      {open && (
        <IntentSearch
          userRole={role}
          onClose={() => setOpen(false)}
          onNavigate={handleNavigate}
        />
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
            ATALAIA OS
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, color: C.navy, fontWeight: 700 }}>
            Navegar por Intenção
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Busca filtrada por escopo de papel. Cada papel vê exatamente o que pode acessar — nada além.
          </p>
        </div>

        {/* Seletor de papel */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Simular papel
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_ROLES.map(r => {
              const active = role === r.id;
              const lvl = ROLE_LEVEL[r.id];
              const hasSearch = lvl >= 3;
              return (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setNavigated(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", borderRadius: 12, textAlign: "left",
                    border: active ? "1px solid " + C.gold : "1px solid " + C.sandBdr,
                    background: active ? C.goldLow : C.white,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: active ? C.gold : C.navy }}>
                      {r.label}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.note}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasSearch ? (
                      <span style={{ padding: "3px 10px", borderRadius: 20, background: C.vidaLow, border: "1px solid rgba(75,174,138,0.3)", fontSize: 11, color: C.vida, fontWeight: 600 }}>
                        ✓ busca ativa
                      </span>
                    ) : (
                      <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(192,84,74,0.08)", border: "1px solid rgba(192,84,74,0.25)", fontSize: 11, color: C.ruby, fontWeight: 600 }}>
                        — desativada
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: C.muted, minWidth: 24 }}>
                      Nv.{lvl}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão / estado desativado */}
        {canSearch ? (
          <button
            onClick={() => setOpen(true)}
            style={{
              width: "100%", padding: "14px 20px",
              borderRadius: 12, border: "1px solid " + C.sandBdr,
              background: C.white,
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", textAlign: "left",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: 16, color: C.gold }}>🔍</span>
            <span style={{ flex: 1, fontSize: 15, color: C.muted }}>
              Navegar por intenção...
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>
              {totalVisible} ações disponíveis
            </span>
          </button>
        ) : (
          <div style={{
            width: "100%", padding: "16px 20px",
            borderRadius: 12, border: "1px solid " + C.sandBdr,
            background: "#FAFAF8",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 16, color: C.muted }}>🔍</span>
            <div>
              <div style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>
                Busca por intenção não disponível
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                Use a navegação lateral — todas as suas ações estão acessíveis por lá.
              </div>
            </div>
          </div>
        )}

        {/* Resultado da navegação */}
        {navigated && (
          <div style={{
            marginTop: 16, padding: "14px 18px", borderRadius: 12,
            background: C.vidaLow, border: "1px solid rgba(75,174,138,0.3)",
          }}>
            <div style={{ fontSize: 12, color: C.vida, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Navegando para
            </div>
            <div style={{ fontSize: 15, color: C.navy, fontWeight: 600 }}>
              {navigated.icon} {navigated.label}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {navigated.route}
            </div>
          </div>
        )}

        {/* Nota técnica */}
        <div style={{ marginTop: 24, padding: "16px 18px", borderRadius: 12, background: "rgba(197,160,89,0.07)", border: "1px solid rgba(197,160,89,0.20)" }}>
          <div style={{ fontSize: 11, color: C.gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Como integrar no Lovable
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.75, fontFamily: "monospace" }}>
            1. Importar IntentSearch onde hoje está o modal de busca<br/>
            2. Passar userRole vindo do useDemoScope()<br/>
            3. O filtro é aplicado automaticamente — nenhuma query ao banco<br/>
            4. Nunca mostrar o componente para roles de nível 1 e 2
          </div>
        </div>
      </div>
    </div>
  );
}
