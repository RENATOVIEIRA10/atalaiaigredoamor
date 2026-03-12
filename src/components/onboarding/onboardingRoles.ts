/**
 * Role-specific onboarding configuration.
 * Maps scopeType → greeting, verse, slides, accent color tokens.
 */

export interface OnboardingSlide {
  title: string;
  body: string;
  visual: string;
}

export interface OnboardingRoleConfig {
  code: string;
  label: string;
  greeting: string;
  verse: string;
  verseRef: string;
  /** Tailwind CSS variable name (e.g. "gold", "vida") */
  accentToken: string;
  icon: string;
  slides: OnboardingSlide[];
}

export const onboardingRoles: Record<string, OnboardingRoleConfig> = {
  celula: {
    code: "LÍDER",
    label: "Líder de Célula",
    greeting: "Bem-vindo, líder.",
    verse: "Cuide de todo o rebanho sobre o qual o Espírito Santo os colocou.",
    verseRef: "Atos 20:28",
    accentToken: "gold",
    icon: "heart",
    slides: [
      {
        title: "Sua célula, na palma da mão",
        body: "Aqui você registra cada encontro, acompanha seus membros e nunca perde o histórico de uma semana sequer.",
        visual: "celula",
      },
      {
        title: "Relatório em menos de 2 minutos",
        body: "Presenças, visitantes, crianças, discipulados — tudo num formulário pensado para quem tem pouco tempo e muito amor.",
        visual: "relatorio",
      },
      {
        title: "Novas vidas chegam até você",
        body: "Quando alguém toma uma decisão no culto, a Central de Células encaminha essa vida para você com todo o contexto necessário.",
        visual: "nova_vida",
      },
    ],
  },
  supervisor: {
    code: "SUPERVISOR",
    label: "Supervisor",
    greeting: "Você cuida de quem cuida.",
    verse: "Aquele que é fiel no mínimo, também é fiel no muito.",
    verseRef: "Lucas 16:10",
    accentToken: "blue-soft",
    icon: "eye",
    slides: [
      {
        title: "Visão de todas as suas células",
        body: "Acompanhe em tempo real quais células enviaram relatório, quais precisam de atenção e onde o cuidado precisa chegar.",
        visual: "supervisao",
      },
      {
        title: "Registro de supervisão presencial",
        body: "Documente suas visitas com checklist, pontos positivos e alinhamentos. O histórico fica para a liderança acima.",
        visual: "checklist",
      },
      {
        title: "Envie pelo WhatsApp em um toque",
        body: "Após a supervisão, compartilhe o resumo formatado diretamente com seu coordenador — sem retrabalho.",
        visual: "whatsapp",
      },
    ],
  },
  coordenacao: {
    code: "COORD",
    label: "Coordenador",
    greeting: "Organize para que o Reino avance.",
    verse: "Tudo seja feito com decência e ordem.",
    verseRef: "1 Coríntios 14:40",
    accentToken: "blue-soft",
    icon: "grid",
    slides: [
      {
        title: "Painel de todas as suas células",
        body: "Um único lugar com o status de cada célula da sua coordenação — relatórios enviados, pendências, supervisões realizadas.",
        visual: "painel",
      },
      {
        title: "Indicadores para decisões reais",
        body: "Saúde da rede, crescimento, células em risco — dados que transformam reuniões de alinhamento em ações pastorais.",
        visual: "indicadores",
      },
      {
        title: "Acompanhe encaminhamentos",
        body: "Veja novas vidas encaminhadas para células da sua coordenação e garanta que nenhuma fique sem acolhimento.",
        visual: "encaminhamento",
      },
    ],
  },
  rede: {
    code: "REDE",
    label: "Líder de Rede",
    greeting: "Desenvolva líderes que multiplicam.",
    verse: "As coisas que ouviste de mim... confia-as a homens fiéis, que sejam idôneos para ensinar a outros.",
    verseRef: "2 Timóteo 2:2",
    accentToken: "gold",
    icon: "network",
    slides: [
      {
        title: "Visão estratégica da sua rede",
        body: "Todas as coordenações, supervisores e células em um organograma vivo. Identifique padrões, celebre avanços.",
        visual: "organograma",
      },
      {
        title: "Multiplicações e crescimento",
        body: "Acompanhe o pipeline de multiplicação de células e o desenvolvimento de novos líderes em formação.",
        visual: "multiplicacao",
      },
      {
        title: "Funil Recomeço da rede",
        body: "Do culto à célula — veja quantas novas vidas chegaram, quantas foram integradas e onde o fluxo precisa de atenção.",
        visual: "funil",
      },
    ],
  },
  pastor: {
    code: "PASTOR",
    label: "Pastor de Campo",
    greeting: "Governe com sabedoria, cuide com amor.",
    verse: "O bom pastor dá a sua vida pelas ovelhas.",
    verseRef: "João 10:11",
    accentToken: "gold",
    icon: "crown",
    slides: [
      {
        title: "Panorama completo do seu campus",
        body: "Vitalidade das redes, crescimento, conversões, guardiões de culto — tudo consolidado no seu painel pastoral.",
        visual: "campus",
      },
      {
        title: "Memória viva do que Deus está fazendo",
        body: "Cada relatório, cada supervisão, cada nova vida registrada constrói o histórico do campus que nenhuma reunião consegue capturar.",
        visual: "historia",
      },
      {
        title: "Decisões baseadas em evidência",
        body: "A IA do Atalaia gera insights contextuais com base nos dados reais da sua rede — não intuição, evidência pastoral.",
        visual: "ia",
      },
    ],
  },
  admin: {
    code: "ADMIN",
    label: "Administrador",
    greeting: "Torre de Controle.",
    verse: "Tudo o que fizerem, façam de todo o coração, como para o Senhor.",
    verseRef: "Colossenses 3:23",
    accentToken: "ruby",
    icon: "shield",
    slides: [
      {
        title: "Visão de todos os campi",
        body: "Acesso global à estrutura completa — campos, redes, coordenações, células. Com drill-down por campus ou visão agregada.",
        visual: "global",
      },
      {
        title: "Simule qualquer papel",
        body: "Na Torre de Controle, você pode navegar o sistema como qualquer um dos 20+ papéis ministeriais — sem trocar de login.",
        visual: "simulacao",
      },
      {
        title: "Auditoria e governança",
        body: "Trilha de auditoria completa, gestão de acessos, configurações de campos e redes. Controle total com responsabilidade.",
        visual: "auditoria",
      },
    ],
  },
  recomeco_operador: {
    code: "RECOMEÇO",
    label: "Operador Recomeço",
    greeting: "Você é o primeiro abraço.",
    verse: "Havia alegria no céu por causa de um pecador que se arrependeu.",
    verseRef: "Lucas 15:7",
    accentToken: "vida",
    icon: "sunrise",
    slides: [
      {
        title: "Cadastre no momento da decisão",
        body: "Formulário rápido e otimizado para uso durante o culto — nome, contato e bairro. Em menos de 60 segundos a vida está registrada.",
        visual: "cadastro",
      },
      {
        title: "WhatsApp de boas-vindas automático",
        body: "Assim que o cadastro é feito, o Atalaia prepara uma mensagem de acolhimento personalizada para você enviar em um toque.",
        visual: "whatsapp",
      },
      {
        title: "Acompanhe até a integração",
        body: "Veja o status de cada vida cadastrada — da triagem ao encaminhamento, até entrar em uma célula e se tornar membro.",
        visual: "acompanhamento",
      },
    ],
  },
  guardioes_culto: {
    code: "GUARDIÃO",
    label: "Guardião de Culto",
    greeting: "Registre o que Deus está fazendo.",
    verse: "Louvai ao Senhor, porque ele é bom; o seu amor dura para sempre.",
    verseRef: "Salmos 107:1",
    accentToken: "blue-soft",
    icon: "eye",
    slides: [
      {
        title: "Contagem em tempo real",
        body: "Interface otimizada para mobile com botões +1 e +10. Conta o público durante o culto sem perder o foco no que está acontecendo.",
        visual: "contagem",
      },
      {
        title: "Registre as novas vidas",
        body: "Ao encerrar o culto, informe quantas decisões de fé foram feitas. Esses dados alimentam o Recomeço automaticamente.",
        visual: "decisoes",
      },
      {
        title: "Histórico de todos os cultos",
        body: "Cada culto registrado fica no histórico do campus — crescimento, tendências e o movimento de Deus em números.",
        visual: "historico",
      },
    ],
  },
  pastor_senior_global: {
    code: "GLOBAL",
    label: "Pastor Sênior Global",
    greeting: "O Reino todo, num só olhar.",
    verse: "O bom pastor dá a sua vida pelas ovelhas.",
    verseRef: "João 10:11",
    accentToken: "gold",
    icon: "crown",
    slides: [
      {
        title: "Visão de todos os campi",
        body: "Acesso global à estrutura completa — campos, redes, coordenações, células. Com drill-down por campus ou visão agregada.",
        visual: "global",
      },
      {
        title: "Panorama completo do seu campus",
        body: "Vitalidade das redes, crescimento, conversões, guardiões de culto — tudo consolidado no seu painel pastoral.",
        visual: "campus",
      },
      {
        title: "Decisões baseadas em evidência",
        body: "A IA do Atalaia gera insights contextuais com base nos dados reais da sua rede — não intuição, evidência pastoral.",
        visual: "ia",
      },
    ],
  },
};

/** Resolve a scopeType to its onboarding config. Falls back to a generic config. */
export function getOnboardingRole(scopeType: string): OnboardingRoleConfig {
  // Direct match
  if (onboardingRoles[scopeType]) return onboardingRoles[scopeType];

  // Alias mapping
  const aliases: Record<string, string> = {
    pastor_de_campo: "pastor",
    recomeco_leitura: "recomeco_operador",
    recomeco_cadastro: "recomeco_operador",
    central_celulas: "admin",
    lider_recomeco_central: "admin",
    lider_batismo_aclamacao: "admin",
    central_batismo_aclamacao: "admin",
    financeiro_global: "admin",
    financeiro_campo: "admin",
    secretaria_admin: "admin",
    demo_institucional: "admin",
  };

  if (aliases[scopeType]) return onboardingRoles[aliases[scopeType]];

  // Fallback
  return {
    code: "ATALAIA",
    label: "Usuário",
    greeting: "Bem-vindo ao Atalaia.",
    verse: "Tudo seja feito com amor.",
    verseRef: "1 Coríntios 16:14",
    accentToken: "gold",
    icon: "heart",
    slides: [
      {
        title: "Cuidado pastoral na palma da mão",
        body: "O Atalaia organiza o cuidado, fortalece líderes e serve o Reino com dados e amor.",
        visual: "celula",
      },
    ],
  };
}
