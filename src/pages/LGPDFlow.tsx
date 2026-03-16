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
  vidaMid: "rgba(75,174,138,0.25)",
  ruby:    "#C0544A",
  rubyLow: "rgba(192,84,74,0.10)",
  text:    "#E8E0D4",
  muted:   "rgba(232,224,212,0.45)",
  white:   "#FFFFFF",
};
const TERMS_VERSION = "v1.0-2026-03";
// ── O QUE É REGISTRADO NO BANCO (referência para o dev) ─────
// INSERT INTO lgpd_consents (user_id, accepted_at, ip_address, terms_version, accepted)
// VALUES ($user_id, NOW(), $ip, '${TERMS_VERSION}', true)
//
// UPDATE profiles SET accepted_lgpd = true WHERE id = $user_id
// ── BASES LEGAIS (por tipo de dado) ─────────────────────────
const BASES_DADOS = [
  { dado: "Nome e contato",           base: "Consentimento",                   art: "Art. 7º, I"  },
  { dado: "Presença em células",      base: "Execução de atividade religiosa",  art: "Art. 7º, IX" },
  { dado: "Histórico espiritual",     base: "Execução de atividade religiosa",  art: "Art. 7º, IX" },
  { dado: "Dados de novas vidas",     base: "Consentimento",                   art: "Art. 7º, I"  },
  { dado: "Registros de discipulado", base: "Legítimo interesse pastoral",      art: "Art. 7º, IX" },
  { dado: "Endereço",                 base: "Consentimento",                   art: "Art. 7º, I"  },
];
// ── POLÍTICA DE PRIVACIDADE (página interna) ─────────────────
function PolicyPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.deep, padding: "0 0 60px" }}>
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(197,160,89,0.15)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", color: C.gold, fontSize: 13, fontFamily: "sans-serif", cursor: "pointer", padding: "6px 12px", borderRadius: 8, border: "1px solid " + C.goldMid }}>
          ← Voltar
        </button>
        <span style={{ fontSize: 14, color: C.white, fontFamily: "Georgia, serif", fontWeight: 600 }}>Política de Privacidade</span>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginLeft: "auto" }}>{TERMS_VERSION}</span>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
        {[
          { t: "1. Quem somos", c: "O Atalaia OS é o Sistema Operacional Pastoral da Igreja do Amor, desenvolvido para conectar a jornada de vida das pessoas dentro da comunidade eclesiástica." },
          { t: "2. Dados coletados", c: "Coletamos: nome, telefone, endereço, data de conversão, histórico de presença em células, registros de discipulado, batismo e aclamação. Não coletamos CPF, dados bancários individuais, dados de saúde, origem racial, orientação sexual ou dados de menores sem consentimento parental." },
          { t: "3. Finalidade do tratamento", c: "Os dados são utilizados exclusivamente para: gestão pastoral de membros e células; acompanhamento de novas vidas; registro de marcos espirituais (batismo, aclamação); organização de discipulados; distribuição geográfica de células." },
          { t: "4. Base legal", c: "O tratamento é fundamentado no consentimento do titular (Art. 7º, I), no legítimo interesse pastoral (Art. 7º, IX) e no exercício regular de atividade religiosa (Art. 11, II, 'a'), nos termos da Lei nº 13.709/2018." },
          { t: "5. Compartilhamento", c: "Os dados não são vendidos, compartilhados comercialmente nem utilizados para fins além dos ministeriais. O acesso é restrito por papel ministerial — cada líder vê apenas o que é necessário para o seu escopo." },
          { t: "6. Segurança", c: "Utilizamos criptografia TLS 1.3 em trânsito, AES-256 em repouso, Row Level Security (RLS) no banco de dados e isolamento absoluto por campus (Zero Fallback Rule). Tokens de sessão expiram automaticamente." },
          { t: "7. Retenção", c: "Dados de membros ativos são mantidos enquanto o vínculo estiver ativo. Dados de novas vidas são retidos por até 6 meses se não houver integração. Marcos espirituais (batismo, aclamação) são mantidos permanentemente como registro histórico." },
          { t: "8. Seus direitos", c: "Você tem direito a: confirmar o tratamento dos seus dados; acessá-los; corrigi-los; solicitar exclusão; revogar o consentimento a qualquer momento. Solicitações devem ser feitas ao seu líder de célula ou ao Encarregado de Dados (DPO) da Igreja." },
        ].map(s => (
          <div key={s.t} style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: "sans-serif" }}>{s.t}</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: C.text, fontFamily: "sans-serif", lineHeight: 1.75 }}>{s.c}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
// ── TERMOS DE USO (página interna) ───────────────────────────
function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.deep, padding: "0 0 60px" }}>
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(197,160,89,0.15)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.gold, fontSize: 13, fontFamily: "sans-serif", cursor: "pointer", padding: "6px 12px", borderRadius: 8, border: "1px solid " + C.goldMid }}>
          ← Voltar
        </button>
        <span style={{ fontSize: 14, color: C.white, fontFamily: "Georgia, serif", fontWeight: 600 }}>Termos de Uso</span>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginLeft: "auto" }}>{TERMS_VERSION}</span>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px" }}>
        {[
          { t: "1. Aceitação", c: "Ao acessar o Atalaia OS, você concorda com estes Termos de Uso e com a Política de Privacidade. O uso do sistema está condicionado ao aceite destes termos." },
          { t: "2. Acesso e responsabilidade", c: "O acesso ao sistema é pessoal e intransferível. Cada usuário é responsável por manter a confidencialidade do seu código de acesso e por todas as ações realizadas em sua conta." },
          { t: "3. Uso adequado", c: "O sistema deve ser utilizado exclusivamente para finalidades ministeriais e administrativas da Igreja do Amor. É vedado o uso para fins comerciais, pessoais não autorizados ou contrários aos valores da comunidade." },
          { t: "4. Dados inseridos", c: "O usuário é responsável pela veracidade, atualidade e precisão dos dados inseridos. Dados incorretos ou maliciosos podem ser removidos pela equipe administradora." },
          { t: "5. Disponibilidade", c: "O Atalaia OS é fornecido como serviço. A equipe técnica se compromete a manter a disponibilidade do sistema, sem garantia de funcionamento ininterrupto." },
          { t: "6. Modificações", c: "Estes termos podem ser atualizados. Em caso de alteração relevante, os usuários serão notificados e deverão aceitar os novos termos para continuar usando o sistema." },
        ].map(s => (
          <div key={s.t} style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: C.gold, fontFamily: "sans-serif" }}>{s.t}</h3>
            <p style={{ margin: 0, fontSize: 13.5, color: C.text, fontFamily: "sans-serif", lineHeight: 1.75 }}>{s.c}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
// ── COMPONENTE 1: TELA DE CONSENTIMENTO BLOQUEANTE ──────────
function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const [view, setView]       = useState("consent"); // consent | politica | termos
  const [loading, setLoading] = useState(false);
  function handleAccept() {
    if (!checked) return;
    setLoading(true);
    // Simulação do registro — em produção: chamar Supabase aqui
    // await supabase.from('lgpd_consents').insert({ user_id, terms_version: TERMS_VERSION, accepted: true })
    setTimeout(() => { setLoading(false); onAccept(); }, 900);
  }
  if (view === "politica") return <PolicyPage onBack={() => setView("consent")} />;
  if (view === "termos")   return <TermsPage  onBack={() => setView("consent")} />;
  return (
    <div style={{
      minHeight: "100vh", background: C.deep,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", position: "relative", overflow: "hidden",
    }}>
      {/* Glows */}
      <div style={{ position: "absolute", top: -120, left: -120, width: 400, height: 400, borderRadius: "50%", background: C.gold, opacity: 0.06, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: C.vida, opacity: 0.05, filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{
        width: "100%", maxWidth: 520,
        background: C.navy,
        borderRadius: 20,
        border: "1px solid rgba(197,160,89,0.18)",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        {/* Barra dourada topo */}
        <div style={{ height: 4, background: C.gold }} />
        <div style={{ padding: "36px 36px 32px" }}>
          {/* Logo + ícone */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: C.goldLow, border: "1px solid " + C.goldMid,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>🔒</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.gold, fontFamily: "sans-serif", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
                ATALAIA OS
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.white, fontFamily: "Georgia, serif" }}>
                Proteção de Dados e Privacidade
              </h1>
            </div>
          </div>
          {/* Texto principal */}
          <div style={{
            padding: "18px 20px", borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 20,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, color: C.text, fontFamily: "sans-serif", lineHeight: 1.7 }}>
              O <strong style={{ color: C.white }}>Atalaia OS</strong> realiza o tratamento de dados pessoais
              para apoiar a gestão pastoral da igreja, incluindo acompanhamento de membros, células,
              discipulado e participação em atividades.
            </p>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, color: C.text, fontFamily: "sans-serif", lineHeight: 1.7 }}>
              Esses dados são utilizados <strong style={{ color: C.vida }}>exclusivamente para fins
              ministeriais e administrativos da igreja</strong>, respeitando os princípios da
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: "sans-serif", lineHeight: 1.65 }}>
              Ao continuar, você declara que leu e concorda com nossa Política de Privacidade e
              Termos de Uso, autorizando o tratamento dos seus dados para as finalidades descritas.
            </p>
          </div>
          {/* Links */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { label: "📄 Política de Privacidade", target: "politica" },
              { label: "📋 Termos de Uso",           target: "termos"   },
            ].map(l => (
              <button
                key={l.target}
                onClick={() => setView(l.target)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10,
                  background: C.goldLow, border: "1px solid " + C.goldMid,
                  color: C.gold, fontSize: 12, fontFamily: "sans-serif",
                  fontWeight: 600, cursor: "pointer", textAlign: "center",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          {/* Aviso de confiança */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: C.vidaLow, border: "1px solid " + C.vidaMid,
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 14 }}>🛡</span>
            <span style={{ fontSize: 12, color: C.vida, fontFamily: "sans-serif", lineHeight: 1.5 }}>
              Seus dados <strong>nunca serão vendidos</strong> ou utilizados para fins comerciais.
            </span>
          </div>
          {/* Checkbox */}
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            padding: "14px 16px", borderRadius: 12,
            background: checked ? C.goldLow : "rgba(255,255,255,0.03)",
            border: checked ? "1px solid " + C.goldMid : "1px solid rgba(255,255,255,0.10)",
            cursor: "pointer", marginBottom: 20, transition: "all 0.2s",
          }}>
            <div
              onClick={() => setChecked(!checked)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                border: checked ? "2px solid " + C.gold : "2px solid rgba(255,255,255,0.25)",
                background: checked ? C.gold : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s", cursor: "pointer",
              }}
            >
              {checked && <span style={{ color: C.deep, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13, color: checked ? C.text : C.muted, fontFamily: "sans-serif", lineHeight: 1.6, userSelect: "none" }}>
              Li e concordo com a{" "}
              <span
                onClick={e => { e.preventDefault(); setView("politica"); }}
                style={{ color: C.gold, textDecoration: "underline", cursor: "pointer" }}
              >
                Política de Privacidade
              </span>
              {" "}e com o tratamento dos meus dados conforme a LGPD.
            </span>
          </label>
          {/* Botão */}
          <button
            onClick={handleAccept}
            disabled={!checked || loading}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 12, border: "none",
              background: checked ? C.gold : "rgba(255,255,255,0.08)",
              color: checked ? C.deep : "rgba(255,255,255,0.25)",
              fontSize: 15, fontWeight: 700, fontFamily: "sans-serif",
              cursor: checked ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              letterSpacing: 0.5,
            }}
          >
            {loading ? "Registrando consentimento..." : "Aceitar e continuar →"}
          </button>
          {/* Versão do termo */}
          <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "monospace" }}>
            Versão do termo: {TERMS_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
// ── COMPONENTE 2: GESTÃO DE PRIVACIDADE (no perfil) ──────────
function PrivacyManager({ userName = "Éden Costa", acceptedAt = "12/03/2026 às 20:47" }: { userName?: string; acceptedAt?: string }) {
  const [view, setView]       = useState("main");
  const [delStep, setDelStep] = useState(0);
  const [dlDone, setDlDone]   = useState(false);
  if (view === "politica") return <PolicyPage onBack={() => setView("main")} />;
  if (view === "termos")   return <TermsPage  onBack={() => setView("main")} />;
  return (
    <div style={{ minHeight: "100vh", background: C.deep, padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: C.navy, borderBottom: "1px solid rgba(197,160,89,0.15)", padding: "18px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: "Georgia, serif" }}>Privacidade e Dados</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>Gerencie o uso dos seus dados pessoais</div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Status do consentimento */}
        <div style={{ padding: "18px 20px", borderRadius: 14, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Status do consentimento</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.vida }} />
              <span style={{ fontSize: 14, color: C.vida, fontFamily: "sans-serif", fontWeight: 600 }}>Aceito</span>
              <span style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif" }}>em {acceptedAt}</span>
            </div>
            <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(123,159,212,0.10)", fontSize: 11, color: "#7B9FD4", fontFamily: "monospace" }}>
              {TERMS_VERSION}
            </span>
          </div>
        </div>
        {/* Bases legais por dado */}
        <div style={{ padding: "18px 20px", borderRadius: 14, background: C.mid, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Base legal por tipo de dado</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {BASES_DADOS.map(b => (
              <div key={b.dado} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif", flex: 1 }}>{b.dado}</span>
                <span style={{ fontSize: 11, color: C.gold, fontFamily: "sans-serif", flex: 1, textAlign: "center" }}>{b.base}</span>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", minWidth: 70, textAlign: "right" }}>{b.art}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Ações */}
        <div style={{ fontSize: 11, color: C.muted, fontFamily: "sans-serif", letterSpacing: 2, textTransform: "uppercase" }}>Suas opções</div>
        {/* Download */}
        <button
          onClick={() => setDlDone(true)}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "18px 20px", borderRadius: 14,
            background: dlDone ? C.vidaLow : C.mid,
            border: dlDone ? "1px solid " + C.vidaMid : "1px solid rgba(255,255,255,0.07)",
            cursor: "pointer", textAlign: "left", width: "100%",
          }}
        >
          <span style={{ fontSize: 22 }}>{dlDone ? "✅" : "📥"}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: dlDone ? C.vida : C.white, fontFamily: "sans-serif" }}>
              {dlDone ? "Solicitação enviada" : "Baixar meus dados pessoais"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", marginTop: 3 }}>
              {dlDone ? "Você receberá um arquivo em até 15 dias úteis." : "Receba um arquivo com todos os seus dados registrados no sistema."}
            </div>
          </div>
        </button>
        {/* Política e Termos */}
        {[
          { icon: "📄", label: "Ver Política de Privacidade", sub: "Entenda como seus dados são usados.", target: "politica" },
          { icon: "📋", label: "Ver Termos de Uso",           sub: "Regras de uso do Atalaia OS.",        target: "termos"   },
        ].map(a => (
          <button
            key={a.target}
            onClick={() => setView(a.target)}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", borderRadius: 14, background: C.mid, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", textAlign: "left", width: "100%" }}
          >
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.white, fontFamily: "sans-serif" }}>{a.label}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: "sans-serif", marginTop: 3 }}>{a.sub}</div>
            </div>
            <span style={{ marginLeft: "auto", color: C.muted, fontSize: 16 }}>›</span>
          </button>
        ))}
        {/* Exclusão */}
        <div style={{ padding: "18px 20px", borderRadius: 14, background: C.rubyLow, border: "1px solid rgba(192,84,74,0.22)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ruby, fontFamily: "sans-serif", marginBottom: 6 }}>
            🗑 Solicitar exclusão dos meus dados
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: C.muted, fontFamily: "sans-serif", lineHeight: 1.65 }}>
            Conforme Art. 18, VI da LGPD, você pode solicitar a exclusão dos dados tratados com base no seu consentimento.
            Dados históricos essenciais (batismo, aclamação) podem ser mantidos por obrigação legal.
          </p>
          {delStep === 0 && (
            <button
              onClick={() => setDelStep(1)}
              style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(192,84,74,0.18)", border: "1px solid rgba(192,84,74,0.35)", color: C.ruby, fontSize: 13, fontWeight: 600, fontFamily: "sans-serif", cursor: "pointer" }}
            >
              Iniciar solicitação de exclusão
            </button>
          )}
          {delStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(192,84,74,0.12)", border: "1px solid rgba(192,84,74,0.28)", fontSize: 13, color: C.ruby, fontFamily: "sans-serif", lineHeight: 1.6 }}>
                ⚠ Você tem certeza? Esta ação não pode ser desfeita. Sua solicitação será encaminhada ao Encarregado de Dados da Igreja.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setDelStep(0)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: C.muted, fontSize: 13, fontFamily: "sans-serif", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setDelStep(2)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(192,84,74,0.22)", border: "1px solid rgba(192,84,74,0.4)", color: C.ruby, fontSize: 13, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer" }}
                >
                  Confirmar exclusão
                </button>
              </div>
            </div>
          )}
          {delStep === 2 && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: C.vidaLow, border: "1px solid " + C.vidaMid, fontSize: 13, color: C.vida, fontFamily: "sans-serif", lineHeight: 1.6 }}>
              ✓ Solicitação registrada. O Encarregado de Dados entrará em contato em até 15 dias úteis.
            </div>
          )}
        </div>
        {/* Nota final */}
        <div style={{ padding: "14px 18px", borderRadius: 12, background: C.vidaLow, border: "1px solid " + C.vidaMid, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>🛡</span>
          <p style={{ margin: 0, fontSize: 12.5, color: C.vida, fontFamily: "sans-serif", lineHeight: 1.6 }}>
            Seus dados <strong>nunca serão vendidos</strong> ou utilizados para fins comerciais.
            O Atalaia OS existe exclusivamente para servir a comunidade da Igreja do Amor.
          </p>
        </div>
      </div>
    </div>
  );
}
// ── DEMONSTRAÇÃO ─────────────────────────────────────────────
export default function LGPDFlow() {
  const [stage, setStage] = useState<"consent" | "app" | "privacy">("consent");
  if (stage === "consent") {
    return <ConsentScreen onAccept={() => setStage("app")} />;
  }
  if (stage === "privacy") {
    return (
      <div>
        <PrivacyManager />
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
          <button
            onClick={() => setStage("consent")}
            style={{ padding: "10px 22px", borderRadius: 20, background: C.goldLow, border: "1px solid " + C.goldMid, color: C.gold, fontSize: 12, fontFamily: "sans-serif", cursor: "pointer" }}
          >
            ← Simular primeiro acesso novamente
          </button>
        </div>
      </div>
    );
  }
  // Simulação do sistema após aceite
  return (
    <div style={{ minHeight: "100vh", background: C.deep, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <h2 style={{ margin: 0, fontSize: 22, color: C.white, fontFamily: "Georgia, serif", textAlign: "center" }}>
        Consentimento registrado com sucesso
      </h2>
      <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: "sans-serif", textAlign: "center", maxWidth: 360, lineHeight: 1.65 }}>
        O sistema salvou: user_id, timestamp, IP, versão do termo.
        O usuário agora acessa o Atalaia normalmente.
      </p>
      <div style={{ padding: "12px 20px", borderRadius: 12, background: C.mid, border: "1px solid rgba(255,255,255,0.08)", fontFamily: "monospace", fontSize: 12, color: C.vida, lineHeight: 1.8 }}>
        accepted_lgpd: true<br/>
        accepted_at: {new Date().toLocaleString("pt-BR")}<br/>
        terms_version: {TERMS_VERSION}<br/>
        ip_address: [registrado]
      </div>
      <button
        onClick={() => setStage("privacy")}
        style={{ padding: "12px 28px", borderRadius: 12, background: C.gold, border: "none", color: C.deep, fontSize: 14, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer" }}
      >
        Ver tela de Privacidade e Dados →
      </button>
    </div>
  );
}
