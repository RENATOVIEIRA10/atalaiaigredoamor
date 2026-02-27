/**
 * Match Engine – Compatibility scoring between a Nova Vida and Células.
 *
 * Weights:
 *   Location   35%
 *   Cell Type  25%
 *   Age Range  20%
 *   Day/Time   10%
 *   Profile    10%
 */

export interface VidaPerfil {
  bairro?: string | null;
  cidade?: string | null;
  rua?: string | null;
  estado_civil?: string | null;
  faixa_etaria?: string | null;
  idade?: number | null;
  tem_filhos?: boolean | null;
  dias_disponiveis?: string[] | null;
  horario_preferido?: string | null;
  primeira_vez_igreja?: boolean | null;
  ja_participou_celula?: boolean | null;
}

export interface CelulaMatch {
  id: string;
  name: string;
  bairro: string | null;
  cidade: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  rede_id: string | null;
  rede_name: string | null;
  lideres: string;
  tipo_celula: string | null;
  faixa_etaria_predominante: string | null;
  bairros_atendidos: string[] | null;
  perfil_ambiente: string | null;
}

export interface MatchResult {
  celula: CelulaMatch;
  score: number; // 0-100
  factors: MatchFactor[];
}

export interface MatchFactor {
  label: string;
  weight: number;
  score: number; // 0-100 for this factor
  reason: string;
}

function norm(s: string | null | undefined): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function scoreLocation(vida: VidaPerfil, celula: CelulaMatch): MatchFactor {
  let score = 0;
  let reason = '';

  const vidaBairro = norm(vida.bairro);
  const celBairro = norm(celula.bairro);
  const bairrosAtendidos = (celula.bairros_atendidos || []).map(norm);

  if (vidaBairro) {
    if (celBairro && celBairro === vidaBairro) {
      score = 100;
      reason = 'Mesmo bairro';
    } else if (bairrosAtendidos.some(b => b === vidaBairro || vidaBairro.includes(b) || b.includes(vidaBairro))) {
      score = 80;
      reason = 'Bairro atendido';
    } else if (celBairro && (celBairro.includes(vidaBairro) || vidaBairro.includes(celBairro))) {
      score = 60;
      reason = 'Bairro próximo';
    } else if (norm(vida.cidade) && norm(celula.cidade) && norm(vida.cidade) === norm(celula.cidade)) {
      score = 30;
      reason = 'Mesma cidade';
    } else {
      reason = 'Localização diferente';
    }
  } else {
    score = 20;
    reason = 'Sem bairro informado';
  }

  return { label: 'Localização', weight: 35, score, reason };
}

function scoreCellType(vida: VidaPerfil, celula: CelulaMatch): MatchFactor {
  let score = 50; // neutral default
  let reason = 'Tipo não definido';
  const tipo = norm(celula.tipo_celula);
  const ec = norm(vida.estado_civil);

  if (!tipo) {
    return { label: 'Tipo de Célula', weight: 25, score: 40, reason: 'Tipo não definido' };
  }

  if (ec.includes('casado')) {
    if (tipo === 'casais') { score = 100; reason = 'Célula de casais para pessoa casada'; }
    else if (tipo === 'familia') { score = 70; reason = 'Célula familiar'; }
    else if (tipo === 'mista') { score = 50; reason = 'Célula mista'; }
    else { score = 20; reason = 'Tipo não ideal para casados'; }
  } else if (ec.includes('solteiro')) {
    if (tipo === 'jovens') { score = 90; reason = 'Célula de jovens para solteiro(a)'; }
    else if (tipo === 'mista') { score = 70; reason = 'Célula mista'; }
    else if (tipo === 'casais') { score = 10; reason = 'Célula de casais – pessoa solteira'; }
    else { score = 50; reason = 'Tipo parcialmente compatível'; }
  } else {
    if (tipo === 'mista') { score = 70; reason = 'Célula mista – universal'; }
    else if (tipo === 'familia') { score = 60; reason = 'Célula familiar'; }
    else { score = 40; reason = 'Compatibilidade parcial'; }
  }

  // Bonus for kids
  if (vida.tem_filhos && tipo === 'familia') {
    score = Math.min(100, score + 15);
    reason += ' (+ tem filhos)';
  }

  return { label: 'Tipo de Célula', weight: 25, score, reason };
}

function scoreAgeRange(vida: VidaPerfil, celula: CelulaMatch): MatchFactor {
  const faixaVida = norm(vida.faixa_etaria);
  const faixaCel = norm(celula.faixa_etaria_predominante);

  if (!faixaVida || !faixaCel) {
    return { label: 'Faixa Etária', weight: 20, score: 40, reason: 'Sem dados de faixa etária' };
  }

  if (faixaVida === faixaCel) {
    return { label: 'Faixa Etária', weight: 20, score: 100, reason: 'Faixa etária compatível' };
  }

  // Parse ranges to check proximity
  const parseRange = (r: string): number => {
    const match = r.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30;
  };
  const vAge = parseRange(faixaVida);
  const cAge = parseRange(faixaCel);
  const diff = Math.abs(vAge - cAge);

  if (diff <= 5) return { label: 'Faixa Etária', weight: 20, score: 80, reason: 'Faixa etária próxima' };
  if (diff <= 15) return { label: 'Faixa Etária', weight: 20, score: 50, reason: 'Faixa etária moderada' };
  return { label: 'Faixa Etária', weight: 20, score: 20, reason: 'Faixa etária distante' };
}

function scoreDayTime(vida: VidaPerfil, celula: CelulaMatch): MatchFactor {
  const dias = (vida.dias_disponiveis || []).map(norm);
  const celDia = norm(celula.meeting_day);

  if (!dias.length || !celDia) {
    return { label: 'Dia/Horário', weight: 10, score: 40, reason: 'Sem dados de disponibilidade' };
  }

  const dayMatch = dias.some(d => celDia.includes(d) || d.includes(celDia));
  if (dayMatch) {
    return { label: 'Dia/Horário', weight: 10, score: 100, reason: 'Dia disponível coincide' };
  }

  return { label: 'Dia/Horário', weight: 10, score: 10, reason: 'Dia não disponível' };
}

function scoreProfile(vida: VidaPerfil, celula: CelulaMatch): MatchFactor {
  let score = 50;
  let reason = 'Perfil neutro';

  const perfil = norm(celula.perfil_ambiente);
  if (!perfil) {
    return { label: 'Perfil Espiritual', weight: 10, score: 40, reason: 'Sem perfil definido' };
  }

  if (vida.primeira_vez_igreja) {
    if (perfil === 'acolhedor') { score = 100; reason = 'Ambiente acolhedor para primeira vez'; }
    else if (perfil === 'comunhao') { score = 70; reason = 'Comunhão acessível'; }
    else { score = 40; reason = 'Perfil pode não ser ideal para primeira vez'; }
  } else if (vida.ja_participou_celula) {
    if (perfil === 'ensino') { score = 90; reason = 'Ambiente de ensino para quem já participou'; }
    else if (perfil === 'comunhao') { score = 80; reason = 'Comunhão para quem já tem experiência'; }
    else { score = 60; reason = 'Compatibilidade parcial'; }
  } else {
    if (perfil === 'acolhedor') { score = 70; reason = 'Ambiente acolhedor'; }
    else { score = 50; reason = 'Perfil genérico'; }
  }

  return { label: 'Perfil Espiritual', weight: 10, score, reason };
}

export function calculateMatch(vida: VidaPerfil, celula: CelulaMatch): MatchResult {
  const factors = [
    scoreLocation(vida, celula),
    scoreCellType(vida, celula),
    scoreAgeRange(vida, celula),
    scoreDayTime(vida, celula),
    scoreProfile(vida, celula),
  ];

  const totalScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

  return {
    celula,
    score: Math.round(totalScore),
    factors,
  };
}

export function rankCelulas(vida: VidaPerfil, celulas: CelulaMatch[]): MatchResult[] {
  return celulas
    .map(c => calculateMatch(vida, c))
    .sort((a, b) => b.score - a.score);
}
