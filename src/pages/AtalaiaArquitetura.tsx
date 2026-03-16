import { useState } from "react";
const C = {
  deep:    "#0D1B2A",
  navy:    "#1A2F4B",
  mid:     "#1E3A5F",
  mid2:    "#243E60",
  gold:    "#C5A059",
  goldLow: "rgba(197,160,89,0.10)",
  goldMid: "rgba(197,160,89,0.22)",
  vida:    "#4BAE8A",
  vidaLow: "rgba(75,174,138,0.10)",
  vidaMid: "rgba(75,174,138,0.22)",
  ruby:    "#C0544A",
  rubyLow: "rgba(192,84,74,0.10)",
  blue:    "#7B9FD4",
  blueLow: "rgba(123,159,212,0.10)",
  blueMid: "rgba(123,159,212,0.22)",
  purple:  "#9B7FD4",
  purpLow: "rgba(155,127,212,0.10)",
  text:    "#E8E0D4",
  muted:   "rgba(232,224,212,0.45)",
  white:   "#FFFFFF",
};
// ─── MODELO COMPLETO ────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
  lider_celula:  1,
  supervisor:    2,
  coordenador:   3,
  lider_rede:    4,
  pastor_campo:  5,
  pastor_global: 6,
  admin:         6,
};
const FEATURES = [
  { id: "relatorio_celula",    label: "Relatório de Célula",       min: 1, icon: "📋" },
  { id: "membros_celula",      label: "Membros da Célula",          min: 1, icon: "👥" },
  { id: "nova_vida",           label: "Nova Vida",                  min: 1, icon: "🌱" },
  { id: "discipulado_celula",  label: "Discipulado da Célula",      min: 1, icon: "📖" },
  { id: "presenca",            label: "Registrar Presença",         min: 1, icon: "✋" },
  { id: "supervisao",          label: "Supervisão de Células",      min: 2, icon: "👁"  },
  { id: "radar_saude",         label: "Radar de Saúde",             min: 2, icon: "📡" },
  { id: "relatorio_supervisao",label: "Relatório de Supervisão",   min: 2, icon: "📊" },
  { id: "coordenacao",         label: "Gestão de Coordenação",      min: 3, icon: "🗂"  },
  { id: "pulso_vivo",          label: "Pulso Vivo",                 min: 3, icon: "💓" },
  { id: "gestao_rede",         label: "Gestão de Rede",             min: 4, icon: "🕸"  },
  { id: "organograma_rede",    label: "Organograma da Rede",        min: 4, icon: "🌐" },
  { id: "dashboard_campus",    label: "Dashboard do Campus",        min: 5, icon: "🏛"  },
  { id: "gestao_campo",        label: "Gestão de Campo",            min: 5, icon: "⛪" },
  { id: "alertas_pastorais",   label: "Alertas Pastorais",          min: 5, icon: "🔔" },
  { id: "visao_global",        label: "Visão Global",               min: 6, icon: "🌍" },
  { id: "gestao_admin",        label: "Administração do Sistema",   min: 6, icon: "⚙️" },
];
const SCOPE_RULES = [
  {
    role: "lider_celula",
    level: 1,
    color: C.gold,
    scope_fields: ["campo_id", "rede_id", "coordenacao_id", "supervisao_id", "celula_id"],
    scope_desc: "Apenas sua própria célula",
    rls_example: 'WHERE campo_id = auth.campo_id\n  AND celula_id = auth.celula_id',
    query_example: 'SELECT * FROM membros\nWHERE campo_id  = $campo_id    -- obrigatório\n  AND celula_id = $celula_id   -- obrigatório\n-- Sem esses filtros → RLS bloqueia',
  },
  {
    role: "supervisor",
    level: 2,
    color: C.blue,
    scope_fields: ["campo_id", "rede_id", "coordenacao_id", "supervisao_id"],
    scope_desc: "Células sob sua supervisão",
    rls_example: 'WHERE campo_id      = auth.campo_id\n  AND supervisao_id = auth.supervisao_id',
    query_example: 'SELECT * FROM celulas\nWHERE campo_id       = $campo_id\n  AND supervisao_id  = $supervisao_id\n-- Retorna APENAS suas células',
  },
  {
    role: "coordenador",
    level: 3,
    color: C.purple,
    scope_fields: ["campo_id", "rede_id", "coordenacao_id"],
    scope_desc: "Supervisões de sua coordenação",
    rls_example: 'WHERE campo_id        = auth.campo_id\n  AND coordenacao_id  = auth.coordenacao_id',
    query_example: 'SELECT * FROM supervisoes\nWHERE campo_id        = $campo_id\n  AND coordenacao_id  = $coordenacao_id',
  },
  {
    role: "lider_rede",
    level: 4,
    color: C.gold,
    scope_fields: ["campo_id", "rede_id"],
    scope_desc: "Toda a sua rede (coordenações, supervisões, células)",
    rls_example: 'WHERE campo_id  = auth.campo_id\n  AND rede_id   = auth.rede_id',
    query_example: 'SELECT * FROM coordenacoes\nWHERE campo_id = $campo_id\n  AND rede_id  = $rede_id',
  },
  {
    role: "pastor_campo",
    level: 5,
    color: C.gold,
    scope_fields: ["campo_id"],
    scope_desc: "Todo o campus (todas as redes)",
    rls_example: 'WHERE campo_id = auth.campo_id',
    query_example: 'SELECT * FROM redes\nWHERE campo_id = $campo_id\n-- Vê TUDO do campus, nada além',
  },
  {
    role: "pastor_global",
    level: 6,
    color: C.vida,
    scope_fields: [] as string[],
    scope_desc: "Todos os campi (sem restrição de escopo)",
    rls_example: '-- Sem filtro de scope\n-- RLS não restringe por campo',
    query_example: 'SELECT * FROM campos\n-- Visão completa de toda a Rede Amor a 2',
  },
];
const DB_TABLES = [
  {
    name: "campos",
    desc: "Campi / unidades da igreja",
    cols: ["id (PK)", "nome", "cidade", "pastor_campo_id"],
    color: C.gold,
  },
  {
    name: "redes",
    desc: "Redes dentro de cada campo",
    cols: ["id (PK)", "campo_id (FK → campos)", "nome", "lider_rede_id"],
    color: C.blue,
  },
  {
    name: "coordenacoes",
    desc: "Coordenações dentro de cada rede",
    cols: ["id (PK)", "campo_id (FK)", "rede_id (FK → redes)", "nome", "coordenador_id"],
    color: C.purple,
  },
  {
    name: "supervisoes",
    desc: "Supervisões dentro de cada coordenação",
    cols: ["id (PK)", "campo_id (FK)", "rede_id (FK)", "coordenacao_id (FK)", "nome", "supervisor_id"],
    color: C.blue,
  },
  {
    name: "celulas",
    desc: "Células — âncora de tudo",
    cols: ["id (PK)", "campo_id (FK)", "rede_id (FK)", "coordenacao_id (FK)", "supervisao_id (FK)", "nome", "lider_id", "dia_semana", "horario", "endereco"],
    color: C.gold,
  },
  {
    name: "membros",
    desc: "Membros da igreja",
    cols: ["id (PK)", "campo_id (FK)", "celula_id (FK → celulas)", "nome", "telefone", "endereco", "data_conversao", "status"],
    color: C.vida,
  },
  {
    name: "profiles",
    desc: "Usuários do sistema",
    cols: ["id (PK = auth.uid)", "campo_id (FK)", "rede_id (FK, nullable)", "coordenacao_id (FK, nullable)", "supervisao_id (FK, nullable)", "celula_id (FK, nullable)", "role", "accepted_lgpd", "accepted_at"],
    color: C.ruby,
  },
  {
    name: "relatorios_celula",
    desc: "Relatórios semanais",
    cols: ["id (PK)", "campo_id (FK)", "celula_id (FK)", "semana", "membros_presentes", "visitantes", "criancas", "lits", "discipulados", "foto_url", "created_by"],
    color: C.vida,
  },
];
const RLS_POLICIES = [
  {
    table: "celulas",
    policy: "Líder vê só sua célula",
    sql: `CREATE POLICY "celula_scope" ON celulas
FOR SELECT USING (
  campo_id = (SELECT campo_id FROM profiles WHERE id = auth.uid())
  AND (
    -- Pastor global: tudo
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'pastor_global'
    OR
    -- Pastor campo: todo o campo
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'pastor_campo'
    OR
    -- Líder rede: sua rede
    (rede_id = (SELECT rede_id FROM profiles WHERE id = auth.uid())
     AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'lider_rede')
    OR
    -- Coordenador: sua coordenação
    (coordenacao_id = (SELECT coordenacao_id FROM profiles WHERE id = auth.uid())
     AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'coordenador')
    OR
    -- Supervisor: sua supervisão
    (supervisao_id = (SELECT supervisao_id FROM profiles WHERE id = auth.uid())
     AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor'))
    OR
    -- Líder de célula: só sua célula
    (id = (SELECT celula_id FROM profiles WHERE id = auth.uid())
     AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'lider_celula')
  )
);`,
  },
  {
    table: "membros",
    policy: "Membro visível apenas dentro do escopo",
    sql: `CREATE POLICY "membros_scope" ON membros
FOR SELECT USING (
  campo_id = (SELECT campo_id FROM profiles WHERE id = auth.uid())
  AND celula_id IN (
    SELECT id FROM celulas  -- aplica a policy de celulas
  )
);
-- membros herda o escopo de celulas automaticamente`,
  },
  {
    table: "relatorios_celula",
    policy: "Relatório visível conforme hierarquia",
    sql: `CREATE POLICY "relatorios_scope" ON relatorios_celula
FOR SELECT USING (
  campo_id = (SELECT campo_id FROM profiles WHERE id = auth.uid())
  AND celula_id IN (SELECT id FROM celulas)
);
-- celulas já está com RLS ativo — herda o scope`,
  },
];
const SEARCH_LOGIC = `// useDemoScope() — hook que retorna o contexto do usuário logado
// Disponível em todo o sistema via Supabase Auth

const user = useDemoScope();
// Retorna: { role, campo_id, rede_id, coordenacao_id, supervisao_id, celula_id }

// ── FILTRO DA BUSCA ──────────────────────────────────────────
function filterSearchResults(allActions, user) {
  const userLevel = ROLE_LEVEL[user.role];

  return allActions.filter(action => {

    // 1️⃣ PERMISSÃO DE PAPEL (Role)
    if (action.minLevel > userLevel) return false;

    // 2️⃣ ESCOPO HIERÁRQUICO
    if (action.scope_type === "celula") {
      if (action.celula_id !== user.celula_id) return false;
    }
    if (action.scope_type === "supervisao") {
      if (action.supervisao_id !== user.supervisao_id) return false;
    }
    if (action.scope_type === "coordenacao") {
      if (action.coordenacao_id !== user.coordenacao_id) return false;
    }
    if (action.scope_type === "rede") {
      if (action.rede_id !== user.rede_id) return false;
    }
    // campo_id é sempre obrigatório para todos
    if (action.campo_id !== user.campo_id) return false;

    // 3️⃣ PERMISSÃO DE FUNCIONALIDADE
    if (!hasFeatureAccess(user.role, action.feature_id)) return false;

    return true; // passou todos os filtros
  });
}

// ── ZERO FALLBACK RULE na busca ──────────────────────────────
// NUNCA mostrar resultado sem campo_id validado
// Se campo_id não está no auth → resultado = []`;
// ─── TABS ────────────────────────────────────────────────────
const TABS = [
  { id: "hierarquia",  label: "Hierarquia",      icon: "🏛"  },
  { id: "rbac",        label: "RBAC + Escopo",   icon: "🔑"  },
  { id: "banco",       label: "Modelo de Dados", icon: "🗄"  },
  { id: "rls",         label: "RLS Policies",    icon: "🔒"  },
  { id: "busca",       label: "Busca Filtrada",   icon: "🔍"  },
];
// ─── COMPONENTES ────────────────────────────────────────────
function Badge({ label, color, size = 11 }: { label: string; color: string; size?: number }) {
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 20,
      background: color + "18", border: "1px solid " + color + "40",
      fontSize: size, color, fontFamily: "sans-serif", fontWeight: 600,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}
function CodeBlock({ code }: { code: string }) {
  return (
    <pre style={{
      margin: 0, padding: "16px 18px", borderRadius: 12,
      background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)",
      fontSize: 11.5, color: "#A8D8A8", fontFamily: "monospace",
      lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre",
    }}>{code}</pre>
  );
}
function SectionTitle({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12, marginTop: 4 }}>
      {text}
    </div>
  );
}
// ─── ABA: HIERARQUIA ─────────────────────────────────────────
function TabHierarquia() {
  const levels = [
    { role: "Pastor Global",   level: 6, color: C.gold,   desc: "Todos os campi — sem restrição",                  w: "100%" },
    { role: "Pastor de Campo", level: 5, color: C.gold,   desc: "Um campus inteiro (todas as redes)",              w: "88%"  },
    { role: "Líder de Rede",   level: 4, color: C.blue,   desc: "Sua rede (todas as coordenações dela)",           w: "76%"  },
    { role: "Coordenador",     level: 3, color: C.purple, desc: "Sua coordenação (supervisões + células)",         w: "63%"  },
    { role: "Supervisor",      level: 2, color: C.blue,   desc: "Suas células supervisionadas",                    w: "50%"  },
    { role: "Líder de Célula", level: 1, color: C.vida,   desc: "Apenas sua própria célula",                      w: "37%"  },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.goldLow, border: "1px solid " + C.goldMid }}>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Cada papel enxerga <strong style={{ color: C.gold }}>exatamente o triângulo abaixo dele</strong> na hierarquia — e nada além.
          O dado é filtrado em <strong style={{ color: C.gold }}>3 camadas independentes</strong>: Role, Scope e Feature.
          Se qualquer camada falhar, o dado não aparece.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {levels.map(l => (
          <div key={l.role} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              height: 52, borderRadius: 10,
              width: l.w,
              background: "rgba(30,58,95,0.7)",
              border: "1px solid " + l.color + "35",
              display: "flex", alignItems: "center",
              paddingLeft: 16, gap: 12, flexShrink: 0,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: l.color }} />
              <div style={{ paddingLeft: 4 }}>
                <div style={{ fontSize: 13, color: C.white, fontFamily: "sans-serif", fontWeight: 700 }}>{l.role}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>{l.desc}</div>
              </div>
              <Badge label={"Nível " + l.level} color={l.color} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 12, color: C.ruby, fontFamily: "sans-serif", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
          🔴 REGRA ABSOLUTA — campo_id em toda query
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Todo dado no sistema carrega <code style={{ background: C.goldLow, color: C.gold, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>campo_id</code>.
          Toda query, toda RLS policy, toda busca começa filtrando por <code style={{ background: C.goldLow, color: C.gold, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>campo_id = auth.campo_id</code>.
          Isso é a <strong style={{ color: C.white }}>Zero Fallback Rule</strong> — não existe caminho que retorne dados de outro campus.
        </p>
      </div>
      <SectionTitle text="Ministérios paralelos (escopo próprio)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { name: "Guardiões do Culto",  scope: "campo_id + culto_id",                 color: C.blue  },
          { name: "Recomeço",            scope: "campo_id + nova_vida pertence a campo", color: C.vida  },
          { name: "Central de Células",  scope: "campo_id + coordenacao_id",            color: C.gold  },
          { name: "Financeiro",          scope: "campo_id (isolamento total)",           color: C.ruby  },
        ].map(m => (
          <div key={m.name} style={{ padding: "12px 16px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, color: C.white, fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 }}>{m.name}</div>
            <code style={{ fontSize: 11, color: m.color, fontFamily: "monospace" }}>{m.scope}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── ABA: RBAC + ESCOPO ──────────────────────────────────────
function TabRBAC() {
  const [selected, setSelected] = useState("lider_celula");
  const current = SCOPE_RULES.find(r => r.role === selected);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionTitle text="Selecione o papel para ver o escopo exato" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SCOPE_RULES.map(r => (
          <button
            key={r.role}
            onClick={() => setSelected(r.role)}
            style={{
              padding: "8px 14px", borderRadius: 20,
              border: selected === r.role ? "1px solid " + r.color : "1px solid rgba(255,255,255,0.08)",
              background: selected === r.role ? r.color + "18" : "transparent",
              color: selected === r.role ? r.color : C.muted,
              fontSize: 12, fontFamily: "sans-serif", fontWeight: selected === r.role ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {r.role.replace("_", " ")}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "18px 20px", borderRadius: 14, background: C.mid, border: "1px solid " + current.color + "30" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Badge label={"Nível " + current.level} color={current.color} size={12} />
              <span style={{ fontSize: 15, color: C.white, fontFamily: "sans-serif", fontWeight: 700 }}>
                {current.role.replace("_", " ")}
              </span>
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "sans-serif", marginBottom: 10 }}>
              {current.scope_desc}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>Campos obrigatórios nas queries:</span>
              {current.scope_fields.map(f => (
                <code key={f} style={{ padding: "2px 8px", borderRadius: 6, background: current.color + "18", color: current.color, fontSize: 11, fontFamily: "monospace" }}>
                  {f}
                </code>
              ))}
              {current.scope_fields.length === 0 && (
                <span style={{ fontSize: 11, color: C.vida, fontFamily: "sans-serif" }}>Sem restrição de escopo</span>
              )}
            </div>
          </div>
          <SectionTitle text="Features disponíveis para este papel" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FEATURES.map(f => {
              const allowed = f.min <= current.level;
              return (
                <div
                  key={f.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 10,
                    background: allowed ? C.vidaLow : "rgba(192,84,74,0.06)",
                    border: allowed ? "1px solid " + C.vidaMid : "1px solid rgba(192,84,74,0.15)",
                    opacity: allowed ? 1 : 0.6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{f.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: allowed ? C.text : C.muted, fontFamily: "sans-serif" }}>{f.label}</span>
                  <span style={{ fontSize: 11, fontFamily: "sans-serif", color: allowed ? C.vida : C.ruby }}>
                    {allowed ? "✓ Permitido" : "✗ Bloqueado"}
                  </span>
                  <code style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>min:{f.min}</code>
                </div>
              );
            })}
          </div>
          <SectionTitle text="Exemplo de query com escopo aplicado" />
          <CodeBlock code={current.query_example} />
          <SectionTitle text="RLS policy correspondente" />
          <CodeBlock code={current.rls_example} />
        </div>
      )}
    </div>
  );
}
// ─── ABA: MODELO DE DADOS ────────────────────────────────────
function TabBanco() {
  const [sel, setSel] = useState("celulas");
  const current = DB_TABLES.find(t => t.name === sel);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.goldLow, border: "1px solid " + C.goldMid }}>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Toda tabela carrega <code style={{ background: C.goldLow, color: C.gold, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>campo_id</code> como primeira coluna após o id.
          Este campo é a âncora de isolamento entre campi. Não existe tabela operacional sem campo_id.
        </p>
      </div>
      <SectionTitle text="Cadeia de herança das FKs" />
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "14px 18px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
        {["campos", "→", "redes", "→", "coordenacoes", "→", "supervisoes", "→", "celulas", "→", "membros"].map((item, i) => (
          <span
            key={i}
            style={{
              padding: item === "→" ? "0 2px" : "4px 12px",
              borderRadius: 8,
              background: item === "→" ? "transparent" : C.gold + "18",
              border: item === "→" ? "none" : "1px solid " + C.gold + "35",
              fontSize: 12,
              color: item === "→" ? C.muted : C.gold,
              fontFamily: "monospace",
            }}
          >
            {item}
          </span>
        ))}
      </div>
      <SectionTitle text="Tabelas — clique para ver colunas" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DB_TABLES.map(t => (
          <button
            key={t.name}
            onClick={() => setSel(t.name)}
            style={{
              padding: "7px 14px", borderRadius: 10,
              border: sel === t.name ? "1px solid " + t.color : "1px solid rgba(255,255,255,0.08)",
              background: sel === t.name ? t.color + "18" : "transparent",
              color: sel === t.name ? t.color : C.muted,
              fontSize: 12, fontFamily: "monospace", cursor: "pointer",
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ padding: "18px 20px", borderRadius: 14, background: C.mid, border: "1px solid " + current.color + "30" }}>
          <div style={{ fontSize: 15, color: C.white, fontFamily: "sans-serif", fontWeight: 700, marginBottom: 4 }}>{current.name}</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", marginBottom: 14 }}>{current.desc}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {current.cols.map((col, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", borderRadius: 8,
                  background: col.includes("campo_id") ? C.goldLow : col.includes("PK") ? "rgba(155,127,212,0.10)" : "rgba(255,255,255,0.03)",
                  border: col.includes("campo_id") ? "1px solid " + C.goldMid : "1px solid transparent",
                }}
              >
                <code style={{ fontSize: 12, color: col.includes("campo_id") ? C.gold : col.includes("PK") ? C.purple : col.includes("FK") ? C.blue : C.text, fontFamily: "monospace" }}>
                  {col}
                </code>
                {col.includes("campo_id") && <Badge label="ÂNCORA DE ISOLAMENTO" color={C.gold} size={9} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ─── ABA: RLS ────────────────────────────────────────────────
function TabRLS() {
  const [sel, setSel] = useState(0);
  const current = RLS_POLICIES[sel];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.rubyLow, border: "1px solid rgba(192,84,74,0.25)" }}>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          As RLS policies são a <strong style={{ color: C.white }}>última linha de defesa</strong> — ficam no banco de dados.
          Mesmo que um bug no frontend tente buscar dados fora do escopo, o Supabase bloqueia antes de retornar qualquer registro.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {RLS_POLICIES.map((p, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 10, textAlign: "center",
              border: sel === i ? "1px solid " + C.gold : "1px solid rgba(255,255,255,0.08)",
              background: sel === i ? C.goldLow : "transparent",
              color: sel === i ? C.gold : C.muted,
              fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
            }}
          >
            {p.table}
          </button>
        ))}
      </div>
      {current && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: "12px 16px", borderRadius: 10, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, color: C.white, fontFamily: "sans-serif", fontWeight: 600 }}>{current.policy}</div>
          </div>
          <CodeBlock code={current.sql} />
        </div>
      )}
      <SectionTitle text="Princípio de herança de scope" />
      <div style={{ padding: "16px 18px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
        {[
          { from: "membros",           to: "celulas",      why: "membro herda o scope da célula"         },
          { from: "relatorios_celula", to: "celulas",      why: "relatório herda o scope da célula"      },
          { from: "celulas",           to: "supervisoes",  why: "célula herda o scope da supervisão"     },
          { from: "supervisoes",       to: "coordenacoes", why: "supervisão herda o scope da coordenação"},
          { from: "coordenacoes",      to: "redes",        why: "coordenação herda o scope da rede"      },
          { from: "redes",             to: "campos",       why: "rede herda o scope do campo"            },
        ].map((h, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <code style={{ fontSize: 11, color: C.ruby,  fontFamily: "monospace", minWidth: 160 }}>{h.from}</code>
            <span style={{ color: C.muted, fontSize: 11 }}>→ filtra via</span>
            <code style={{ fontSize: 11, color: C.gold,  fontFamily: "monospace", minWidth: 120 }}>{h.to}</code>
            <span style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif" }}>{h.why}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── ABA: BUSCA FILTRADA ─────────────────────────────────────
function TabBusca() {
  const [selectedRole, setSelectedRole] = useState("lider_celula");
  const [query, setQuery] = useState("");
  const roleLevel = ROLE_LEVEL[selectedRole] ?? 1;
  const allActions = FEATURES.map(f => ({ ...f, campo_id: "campo_paulista" }));
  const filtered = allActions.filter(a => {
    if (a.min > roleLevel) return false;
    if (query && !a.label.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  const blocked = allActions.filter(a => a.min > roleLevel);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "14px 18px", borderRadius: 12, background: C.blueLow, border: "1px solid " + C.blueMid }}>
        <p style={{ margin: 0, fontSize: 13, color: C.text, fontFamily: "sans-serif", lineHeight: 1.65 }}>
          Simulação ao vivo. Troque o papel e veja a busca filtrar automaticamente.
          Na implementação real, <code style={{ background: C.goldLow, color: C.gold, padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>useDemoScope()</code> injeta o contexto do usuário logado.
        </p>
      </div>
      <SectionTitle text="Papel simulado" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.keys(ROLE_LEVEL).map(r => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: selectedRole === r ? "1px solid " + C.gold : "1px solid rgba(255,255,255,0.08)",
              background: selectedRole === r ? C.goldLow : "transparent",
              color: selectedRole === r ? C.gold : C.muted,
              fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
            }}
          >
            {r.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <input
        placeholder="Navegar por intenção..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          padding: "12px 16px", borderRadius: 12,
          background: C.mid, border: "1px solid rgba(255,255,255,0.10)",
          color: C.text, fontSize: 14, fontFamily: "sans-serif",
          outline: "none", width: "100%", boxSizing: "border-box",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: C.vida, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            ✓ Visível ({filtered.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: C.vidaLow, border: "1px solid " + C.vidaMid }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 12, color: C.text, fontFamily: "sans-serif" }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.ruby, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            ✗ Bloqueado ({blocked.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {blocked.map(a => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: C.rubyLow, border: "1px solid rgba(192,84,74,0.20)", opacity: 0.6 }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SectionTitle text="Lógica de implementação" />
      <CodeBlock code={SEARCH_LOGIC} />
    </div>
  );
}
// ─── APP ─────────────────────────────────────────────────────
export default function AtalaiaArquitetura() {
  const [tab, setTab] = useState("hierarquia");
  return (
    <div style={{ minHeight: "100vh", background: C.deep, paddingBottom: 60 }}>
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(197,160,89,0.15)", padding: "18px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🏗</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.white, fontFamily: "Georgia, serif" }}>
                Arquitetura RBAC + Hierarchical Scope
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>
              Atalaia OS · Modelo de dados multicampus sem vazamento
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Badge label="RBAC"         color={C.gold} size={11} />
            <Badge label="RLS"          color={C.vida} size={11} />
            <Badge label="Zero Fallback" color={C.ruby} size={11} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 16px", borderRadius: 10, whiteSpace: "nowrap",
                border: tab === t.id ? "1px solid " + C.gold : "1px solid rgba(255,255,255,0.07)",
                background: tab === t.id ? C.goldLow : "transparent",
                color: tab === t.id ? C.gold : C.muted,
                fontSize: 13, fontFamily: "sans-serif",
                fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        {tab === "hierarquia"  && <TabHierarquia />}
        {tab === "rbac"        && <TabRBAC />}
        {tab === "banco"       && <TabBanco />}
        {tab === "rls"         && <TabRLS />}
        {tab === "busca"       && <TabBusca />}
      </div>
    </div>
  );
}
