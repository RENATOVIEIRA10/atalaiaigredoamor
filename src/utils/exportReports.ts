import ExcelJS from 'exceljs';
import { WeeklyReport } from '@/hooks/useWeeklyReports';
import { Celula } from '@/hooks/useCelulas';
import { Coordenacao } from '@/hooks/useCoordenacoes';
import { Rede } from '@/hooks/useRedes';
import { Member } from '@/hooks/useMembers';
import { RedeAggregation, CoordenacaoAggregation, CelulaAggregation, LiderAggregation } from '@/hooks/useDadosReports';
import { RankedMember } from '@/hooks/useMemberRanking';
import { getCoupleDisplayName } from '@/hooks/useLeadershipCouples';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  reports: WeeklyReport[];
  celulas: Celula[];
  coordenacoes: Coordenacao[];
  redes?: Rede[];
  members?: Member[];
  periodLabel: string;
  byRede?: RedeAggregation[];
  byCoordenacao?: CoordenacaoAggregation[];
  byCelula?: CelulaAggregation[];
  byLider?: LiderAggregation[];
  ranking?: RankedMember[];
  kpis?: { totalCelulas: number; totalMembers: number; totalVisitors: number; totalReports: number } | null;
}

function setColWidths(ws: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => {
    const col = ws.getColumn(i + 1);
    col.width = w;
  });
}

function addAutoFilter(ws: ExcelJS.Worksheet, headerRow: number, cols: number, dataRows: number) {
  const endCol = String.fromCharCode(64 + cols);
  ws.autoFilter = `A${headerRow}:${endCol}${headerRow + dataRows}`;
}

function addRows(ws: ExcelJS.Worksheet, rows: (string | number)[][]) {
  rows.forEach(r => ws.addRow(r));
}

async function saveWorkbook(wb: ExcelJS.Workbook, fileName: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToExcel(data: ExportData) {
  const wb = new ExcelJS.Workbook();

  // If aggregations exist, use professional multi-tab export
  if (data.byRede && data.byCoordenacao && data.byCelula) {
    createResumoSheet(wb, data);
    createByRedeSheet(wb, data.byRede);
    createByCoordenacaoSheet(wb, data.byCoordenacao);
    createByCelulaSheet(wb, data.byCelula, data.byCoordenacao);
    if (data.byLider && data.byLider.length > 0) {
      createByLiderSheet(wb, data.byLider, data.byCoordenacao);
    }
    createRelatoriosSheet(wb, data);
    createDadosBrutosSheet(wb, data);
  } else {
    // Fallback: legacy single-tab export
    createDadosBrutosSheet(wb, data);
  }

  const fileName = `Relatorio_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`;
  await saveWorkbook(wb, fileName);
}

// ─── RESUMO ───
function createResumoSheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('RESUMO');
  const rows: (string | number)[][] = [];

  rows.push(['RELATÓRIO CONSOLIDADO']);
  rows.push(['Período:', data.periodLabel]);
  rows.push(['Gerado em:', format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })]);
  rows.push([]);

  // KPIs
  rows.push(['INDICADORES CHAVE']);
  if (data.kpis) {
    rows.push(['Total de Células', data.kpis.totalCelulas]);
    rows.push(['Total de Membros Ativos', data.kpis.totalMembers]);
    rows.push(['Total de Visitantes', data.kpis.totalVisitors]);
    rows.push(['Total de Relatórios', data.kpis.totalReports]);
    const submissionRate = data.kpis.totalCelulas > 0
      ? Math.round((data.byCelula!.filter(c => c.reportsCount > 0).length / data.kpis.totalCelulas) * 100)
      : 0;
    rows.push(['Taxa de Envio (%)', submissionRate]);
  }
  rows.push([]);

  // Summary by rede
  rows.push(['RESUMO POR REDE']);
  rows.push(['Rede', 'Líder', 'Coordenações', 'Células', 'Membros', 'Visitantes', 'Relatórios', '% Envio']);
  data.byRede?.forEach(r => {
    rows.push([r.name, r.leaderCouple || '—', r.coordenacoesCount, r.celulasCount, r.membersCount, r.visitors, r.reportsCount, r.submissionRate]);
  });
  rows.push([]);

  // Ranking coordenações
  rows.push(['RANKING DE COORDENAÇÕES (por membros)']);
  rows.push(['Posição', 'Coordenação', 'Membros', 'Relatórios', '% Envio']);
  const sortedCoords = [...(data.byCoordenacao || [])].sort((a, b) => b.membersCount - a.membersCount);
  sortedCoords.forEach((c, i) => {
    rows.push([i + 1, c.name, c.membersCount, c.reportsCount, c.submissionRate]);
  });

  addRows(ws, rows);
  setColWidths(ws, [30, 25, 15, 12, 12, 12, 12, 10]);
}

// ─── POR REDE ───
function createByRedeSheet(wb: ExcelJS.Workbook, byRede: RedeAggregation[]) {
  const ws = wb.addWorksheet('POR REDE');
  const headers = ['Rede', 'Líder de Rede', 'Coordenações', 'Células', 'Membros', 'Visitantes', 'Relatórios', '% Envio'];
  const rows: (string | number)[][] = [headers];

  byRede.forEach(r => {
    rows.push([r.name, r.leaderCouple || '—', r.coordenacoesCount, r.celulasCount, r.membersCount, r.visitors, r.reportsCount, r.submissionRate]);
  });

  addRows(ws, rows);
  setColWidths(ws, [25, 30, 14, 12, 12, 12, 12, 10]);
  addAutoFilter(ws, 1, headers.length, byRede.length);
}

// ─── POR COORDENAÇÃO ───
function createByCoordenacaoSheet(wb: ExcelJS.Workbook, byCoordenacao: CoordenacaoAggregation[]) {
  const ws = wb.addWorksheet('POR COORDENACAO');
  const headers = ['Coordenação', 'Rede', 'Coordenador(es)', 'Células', 'Membros', 'Visitantes', 'Relatórios', '% Envio'];
  const rows: (string | number)[][] = [headers];

  byCoordenacao.forEach(c => {
    rows.push([c.name, c.redeName, c.leaderCouple || '—', c.celulasCount, c.membersCount, c.visitors, c.reportsCount, c.submissionRate]);
  });

  addRows(ws, rows);
  setColWidths(ws, [25, 20, 30, 12, 12, 12, 12, 10]);
  addAutoFilter(ws, 1, headers.length, byCoordenacao.length);
}

// ─── POR CÉLULA ───
function createByCelulaSheet(wb: ExcelJS.Workbook, byCelula: CelulaAggregation[], byCoordenacao: CoordenacaoAggregation[]) {
  const ws = wb.addWorksheet('POR CELULA');
  const headers = ['Célula', 'Coordenação', 'Rede', 'Líderes', 'Membros', 'Visitantes', 'Relatórios'];
  const rows: (string | number)[][] = [headers];

  byCelula.forEach(c => {
    const coord = byCoordenacao.find(co => co.name === c.coordenacaoName);
    rows.push([c.name, c.coordenacaoName, coord?.redeName || '—', c.leaderCouple || '—', c.membersCount, c.visitors, c.reportsCount]);
  });

  addRows(ws, rows);
  setColWidths(ws, [25, 20, 20, 30, 12, 12, 12]);
  addAutoFilter(ws, 1, headers.length, byCelula.length);
}

// ─── POR LÍDER ───
function createByLiderSheet(wb: ExcelJS.Workbook, byLider: LiderAggregation[], byCoordenacao: CoordenacaoAggregation[]) {
  const ws = wb.addWorksheet('POR LIDER');
  const headers = ['Casal Líder', 'Célula', 'Relatórios', 'Méd. Visitantes', 'Membros'];
  const rows: (string | number)[][] = [headers];

  byLider.forEach(l => {
    rows.push([l.coupleName, l.celulaName, l.reportsCount, l.avgVisitors, l.totalMembers]);
  });

  addRows(ws, rows);
  setColWidths(ws, [30, 25, 12, 16, 12]);
  addAutoFilter(ws, 1, headers.length, byLider.length);
}

// ─── RELATÓRIOS DETALHADOS ───
function createRelatoriosSheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('RELATORIOS');
  const headers = ['Data Realização', 'Semana (Seg→Sáb)', 'Célula', 'Coordenação', 'Rede', 'Líderes', 'Membros Presentes', 'Líderes Treino', 'Discipulados', 'Visitantes', 'Crianças', 'Total', 'Observações'];
  const rows: (string | number)[][] = [headers];

  // Sort by meeting_date (source of truth), fallback to week_start
  const sorted = [...data.reports].sort((a, b) => {
    const da = a.meeting_date || a.week_start;
    const db = b.meeting_date || b.week_start;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  sorted.forEach(r => {
    const celula = data.celulas.find(c => c.id === r.celula_id);
    const coord = data.coordenacoes.find(c => c.id === celula?.coordenacao_id);
    const rede = data.redes?.find(re => re.id === coord?.rede_id);
    const total = r.members_present + r.leaders_in_training + r.discipleships + r.visitors + r.children;
    // Source of truth: meeting_date; fallback to week_start
    const realizacaoDate = r.meeting_date || r.week_start;
    const dateStr = format(parseISO(realizacaoDate), 'dd/MM/yyyy', { locale: ptBR });
    // Week label: derive monday from realizacao, then +5 days = saturday
    const mondayDate = (() => {
      const d = new Date(realizacaoDate + 'T12:00:00');
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d;
    })();
    const saturdayDate = new Date(mondayDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const weekLabel = `${format(mondayDate, 'dd/MM', { locale: ptBR })} → ${format(saturdayDate, 'dd/MM', { locale: ptBR })}`;

    rows.push([
      dateStr,
      weekLabel,
      celula?.name || '—',
      coord?.name || '—',
      rede?.name || '—',
      getCoupleDisplayName(celula?.leadership_couple) || '—',
      r.members_present,
      r.leaders_in_training,
      r.discipleships,
      r.visitors,
      r.children,
      total,
      r.notes || '',
    ]);
  });

  addRows(ws, rows);
  setColWidths(ws, [14, 18, 22, 22, 20, 28, 16, 14, 14, 12, 12, 10, 30]);
  addAutoFilter(ws, 1, headers.length, sorted.length);
}

// ─── DADOS BRUTOS ───
function createDadosBrutosSheet(wb: ExcelJS.Workbook, data: ExportData) {
  const ws = wb.addWorksheet('DADOS BRUTOS');
  const headers = ['Coordenação', 'Célula', 'Data Realização', 'Semana (Seg→Sáb)', 'week_start', 'week_end_operacional', 'Membros Presentes', 'Líderes Treino', 'Discipulados', 'Visitantes', 'Crianças', 'Total'];
  const rows: (string | number)[][] = [headers];

  const sorted = [...data.reports].sort((a, b) => {
    const cA = data.celulas.find(c => c.id === a.celula_id);
    const cB = data.celulas.find(c => c.id === b.celula_id);
    const coordA = data.coordenacoes.find(co => co.id === cA?.coordenacao_id);
    const coordB = data.coordenacoes.find(co => co.id === cB?.coordenacao_id);
    const cc = (coordA?.name || '').localeCompare(coordB?.name || '');
    if (cc !== 0) return cc;
    const cn = (cA?.name || '').localeCompare(cB?.name || '');
    if (cn !== 0) return cn;
    const da = a.meeting_date || a.week_start;
    const db = b.meeting_date || b.week_start;
    return new Date(db).getTime() - new Date(da).getTime();
  });

  sorted.forEach(r => {
    const celula = data.celulas.find(c => c.id === r.celula_id);
    const coord = data.coordenacoes.find(co => co.id === celula?.coordenacao_id);
    const total = r.members_present + r.leaders_in_training + r.discipleships + r.visitors + r.children;
    const realizacaoDate = r.meeting_date || r.week_start;
    // Derive Monday
    const d = new Date(realizacaoDate + 'T12:00:00');
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    const mondayStr = format(d, 'yyyy-MM-dd', { locale: ptBR });
    const satDate = new Date(d.getTime() + 5 * 24 * 60 * 60 * 1000);
    const satStr = format(satDate, 'yyyy-MM-dd', { locale: ptBR });
    const weekLabel = `${format(d, 'dd/MM', { locale: ptBR })} → ${format(satDate, 'dd/MM', { locale: ptBR })}`;

    rows.push([
      coord?.name || 'N/A',
      celula?.name || 'N/A',
      format(parseISO(realizacaoDate), 'dd/MM/yyyy', { locale: ptBR }),
      weekLabel,
      mondayStr,
      satStr,
      r.members_present,
      r.leaders_in_training,
      r.discipleships,
      r.visitors,
      r.children,
      total,
    ]);
  });

  addRows(ws, rows);
  setColWidths(ws, [25, 25, 14, 18, 12, 12, 18, 14, 14, 12, 12, 10]);
  addAutoFilter(ws, 1, headers.length, sorted.length);
}
