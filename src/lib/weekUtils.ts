/**
 * weekUtils.ts – Fonte de verdade para cálculo de semana no sistema Rede Amor a 2
 *
 * DEFINIÇÕES:
 * - week_start: Segunda-feira da semana (ISO)
 * - week_end_operacional: Sábado da mesma semana (janela operacional de célula)
 * - week_end_calendario: Domingo da mesma semana (calendário geral)
 *
 * REGRA PRINCIPAL:
 * A fonte de verdade de um relatório é SEMPRE a meeting_date (data de realização).
 * week_start é derivado da meeting_date, nunca o contrário.
 */

import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Cálculo de segunda-feira da semana ───

/** Retorna a data da segunda-feira da semana que contém `date` */
export function getWeekMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** Retorna a data do domingo da semana que contém `date` (fim calendário) */
export function getWeekSundayCalendar(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

/** Retorna a data do sábado da semana que contém `date` (fim operacional de célula) */
export function getWeekSaturdayOperacional(date: Date): Date {
  return addDays(getWeekMonday(date), 5);
}

// ─── Strings ISO (YYYY-MM-DD) ───

export function getWeekStartStr(date: Date): string {
  return format(getWeekMonday(date), 'yyyy-MM-dd');
}

export function getWeekEndOperacionalStr(date: Date): string {
  return format(getWeekSaturdayOperacional(date), 'yyyy-MM-dd');
}

export function getWeekEndCalendarioStr(date: Date): string {
  return format(getWeekSundayCalendar(date), 'yyyy-MM-dd');
}

// ─── Labels de display ───

/**
 * Retorna o label primário para uma data de realização:
 * "15/02/2026"
 */
export function formatDataRealizacao(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

/**
 * Retorna o label da semana operacional (Seg→Sáb):
 * "Semana (Seg→Sáb): 10/02 → 15/02"
 */
export function formatWeekLabelOperacional(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const mon = getWeekMonday(d);
    const sat = getWeekSaturdayOperacional(d);
    return `Semana (Seg→Sáb): ${format(mon, 'dd/MM', { locale: ptBR })} → ${format(sat, 'dd/MM', { locale: ptBR })}`;
  } catch {
    return '';
  }
}

/**
 * Retorna semana_label para CSV:
 * "2026-W07 (Seg→Sáb)"
 */
export function getSemanaLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    const weekNum = format(d, 'I', { locale: ptBR }); // ISO week number
    const year = format(getWeekMonday(d), 'yyyy');
    return `${year}-W${String(weekNum).padStart(2, '0')} (Seg→Sáb)`;
  } catch {
    return '';
  }
}

// ─── Filtro por semana operacional (Seg→Sáb) ───

/**
 * Dado um date qualquer (ex: Monday selecionado no WeekSelector),
 * retorna { from, to } para filtrar por semana operacional (Seg→Sáb).
 */
export function getOperacionalWeekRange(date: Date): { from: string; to: string } {
  return {
    from: getWeekStartStr(date),
    to: getWeekEndOperacionalStr(date),
  };
}

// ─── Derivar week_start de uma meeting_date ───

/**
 * Dado o string ISO de uma data de realização, retorna o week_start (segunda-feira).
 * Esta é a função canônica para derivar week_start.
 */
export function derivarWeekStart(meetingDateStr: string): string {
  const d = new Date(meetingDateStr + 'T12:00:00');
  return getWeekStartStr(d);
}

// ─── Pendências: células em atraso (Seg→Sáb) ───

/**
 * Calcula semanas de atraso usando a semana operacional (Seg→Sáb).
 * `lastReportDate` é a meeting_date ou week_start do último relatório.
 */
export function calcWeeksLate(lastReportDate: string | null): number {
  if (!lastReportDate) return 99;
  const last = new Date(lastReportDate + 'T12:00:00');
  const now = new Date();
  // Início da semana operacional atual (segunda-feira)
  const currentWeekMon = getWeekMonday(now);
  // Início da semana operacional do último relatório
  const lastWeekMon = getWeekMonday(last);
  const diffMs = currentWeekMon.getTime() - lastWeekMon.getTime();
  return Math.max(0, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)));
}
