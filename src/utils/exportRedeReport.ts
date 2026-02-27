import ExcelJS from 'exceljs';
import { RedeEmailReportData } from '@/hooks/useRedeEmailReport';
import { format } from 'date-fns';

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

// ─── ABA 1: RESUMO PASTORAL ───
function createResumoSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('RESUMO PASTORAL');
  const rows: (string | number)[][] = [];
  rows.push(['RELATÓRIO PASTORAL – REDE AMOR A 2']);
  rows.push([]);
  rows.push(['Rede:', d.redeName]);
  rows.push(['Período:', `${d.periodoInicio} → ${d.periodoFim}`]);
  rows.push(['Gerado por:', d.redeLeader]);
  rows.push(['Data de geração:', d.geradoEm]);
  rows.push([]);
  rows.push(['INDICADORES PRINCIPAIS']);
  rows.push(['Total de células ativas:', d.totalCelulasAtivas]);
  rows.push(['Relatórios enviados:', `${d.relatoriosEnviados} (${d.percEnvio}%)`]);
  rows.push(['Relatórios pendentes:', d.relatoriosPendentes]);
  rows.push(['Pessoas nas células (cadastro):', d.pessoasNasCelulas]);
  rows.push(['Discipulados (somatório):', d.discipuladosTotal]);
  rows.push(['Líderes em treinamento (somatório):', d.lideresEmTreinamentoTotal]);
  rows.push(['Crianças (somatório):', d.criancasTotal]);
  rows.push(['Visitantes (somatório):', d.visitantesTotal]);
  rows.push(['Multiplicações no período:', d.multiplicacoesTotal]);
  rows.push(['Aniversariantes (7 dias):', d.aniversariantesCount]);
  rows.push([]);
  rows.push(['ALERTAS PASTORAIS']);
  rows.push([`Células sem envio há 1 semana: ${d.celulasRisco1.length}`]);
  d.celulasRisco1.forEach(c => rows.push([`  • ${c.nome} (${c.coordenacao})`]));
  rows.push([`Células sem envio há 2 semanas: ${d.celulasRisco2.length}`]);
  d.celulasRisco2.forEach(c => rows.push([`  • ${c.nome} (${c.coordenacao})`]));
  rows.push([`Células sem envio há 3+ semanas: ${d.celulasRisco3.length}`]);
  d.celulasRisco3.forEach(c => rows.push([`  • ${c.nome} (${c.coordenacao})`]));

  addRows(ws, rows);
  setColWidths(ws, [40, 40]);
}

// ─── ABA 2: PULSO DA REDE ───
function createPulsoSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('PULSO DA REDE');
  const headers = [
    'periodo_inicio', 'periodo_fim', 'total_celulas_ativas', 'relatorios_enviados',
    'relatorios_pendentes', 'perc_envio', 'pessoas_nas_celulas', 'discipulados_total',
    'lideres_em_treinamento_total', 'criancas_total', 'visitantes_total', 'multiplicacoes_total',
    'celulas_em_risco_1_semana', 'celulas_em_risco_2_semanas', 'celulas_em_risco_3_mais',
  ];
  const rows: (string | number)[][] = [headers, [
    d.periodoInicio, d.periodoFim, d.totalCelulasAtivas, d.relatoriosEnviados,
    d.relatoriosPendentes, d.percEnvio, d.pessoasNasCelulas, d.discipuladosTotal,
    d.lideresEmTreinamentoTotal, d.criancasTotal, d.visitantesTotal, d.multiplicacoesTotal,
    d.celulasRisco1.length, d.celulasRisco2.length, d.celulasRisco3.length,
  ]];
  addRows(ws, rows);
  setColWidths(ws, [14, 14, 16, 18, 18, 10, 20, 18, 22, 14, 16, 18, 22, 22, 22]);
}

// ─── ABA 3: COORDENAÇÕES ───
function createCoordenacoesSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('COORDENAÇÕES');
  const headers = [
    'coordenacao_nome', 'casal_coordenador', 'total_celulas_ativas', 'relatorios_enviados',
    'relatorios_pendentes', 'perc_envio', 'pessoas_cadastradas', 'discipulados_total',
    'lideres_em_treinamento_total', 'criancas_total', 'visitantes_total', 'multiplicacoes_total', 'celulas_em_risco',
  ];
  const rows: (string | number)[][] = [headers];
  d.coordenacoes.forEach(c => {
    rows.push([c.nome, c.casalCoordenador, c.totalCelulas, c.relatoriosEnviados, c.relatoriosPendentes, c.percEnvio,
      c.pessoasCadastradas, c.discipuladosTotal, c.lideresTotal, c.criancasTotal, c.visitantesTotal, c.multiplicacoesTotal, c.celulasRisco]);
  });
  addRows(ws, rows);
  setColWidths(ws, [28, 32, 16, 18, 18, 10, 20, 16, 22, 14, 14, 16, 14]);
  addAutoFilter(ws, 1, headers.length, d.coordenacoes.length);
}

// ─── ABA 4: CÉLULAS (CADASTRO) ───
function createCelulasSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('CÉLULAS');
  const headers = [
    'celula_nome', 'coordenacao', 'supervisor', 'casal_lider', 'dia_semana', 'horario',
    'endereco', 'bairro', 'cidade', 'instagram_lider1', 'instagram_lider2', 'instagram_celula',
    'membros_cadastrados_ativos', 'data_criacao', 'status',
  ];
  const rows: (string | number)[][] = [headers];
  d.celulas.forEach(c => {
    rows.push([c.nome, c.coordenacao, c.supervisor, c.casalLider, c.diaSemana, c.horario,
      c.endereco, c.bairro, c.cidade, c.instagram1, c.instagram2, c.instagram3,
      c.membrosCadastrados, c.dataCriacao, c.status]);
  });
  addRows(ws, rows);
  setColWidths(ws, [22, 22, 28, 32, 12, 10, 28, 16, 16, 20, 20, 20, 18, 14, 10]);
  addAutoFilter(ws, 1, headers.length, d.celulas.length);
}

// ─── ABA 5: RELATÓRIOS DO PERÍODO ───
function createRelatoriosSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('RELATÓRIOS');
  const headers = [
    'data_relatorio', 'celula_nome', 'coordenacao', 'supervisor', 'casal_lider',
    'membros_informados', 'visitantes', 'criancas', 'lideres_em_treinamento', 'discipulados',
    'comentario_lider', 'enviado_em',
  ];
  const rows: (string | number)[][] = [headers];
  d.relatorios.forEach(r => {
    rows.push([r.dataRelatorio, r.celulaName, r.coordenacaoName, r.supervisorName, r.casalLider,
      r.membrosInformados, r.visitantes, r.criancas, r.lideresEmTreinamento, r.discipulados,
      r.comentario, r.enviadoEm]);
  });
  addRows(ws, rows);
  setColWidths(ws, [14, 22, 22, 28, 32, 16, 12, 12, 18, 14, 32, 18]);
  addAutoFilter(ws, 1, headers.length, d.relatorios.length);
}

// ─── ABA 6: PENDÊNCIAS / RISCO ───
function createPendenciasSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('PENDÊNCIAS');
  const headers = ['celula_nome', 'coordenacao', 'supervisor', 'semanas_sem_enviar', 'nivel_risco', 'acao_sugerida'];
  const rows: (string | number)[][] = [headers];

  const addRisco = (list: RedeEmailReportData['celulasRisco1'], semanas: number, nivel: string) => {
    list.forEach(c => rows.push([c.nome, c.coordenacao, c.supervisor, semanas, nivel, 'Contatar líder e verificar situação']));
  };
  addRisco(d.celulasRisco1, 1, '1_semana');
  addRisco(d.celulasRisco2, 2, '2_semanas');
  addRisco(d.celulasRisco3, 3, '3_mais');

  addRows(ws, rows);
  setColWidths(ws, [22, 22, 28, 18, 14, 36]);
  const total = d.celulasRisco1.length + d.celulasRisco2.length + d.celulasRisco3.length;
  if (total > 0) addAutoFilter(ws, 1, headers.length, total);
}

// ─── ABA 7: ANIVERSARIANTES ───
function createAniversariantesSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('ANIVERSARIANTES');
  const headers = ['data_aniversario', 'nome', 'celula_nome', 'coordenacao', 'supervisor', 'telefone'];
  const rows: (string | number)[][] = [headers];
  d.aniversariantes.forEach(a => rows.push([a.dataAniversario, a.nome, a.celulaName, a.coordenacaoName, a.supervisorName, a.telefone]));
  addRows(ws, rows);
  setColWidths(ws, [16, 28, 22, 22, 28, 16]);
  if (d.aniversariantes.length > 0) addAutoFilter(ws, 1, headers.length, d.aniversariantes.length);
}

// ─── ABA 8: MULTIPLICAÇÕES ───
function createMultiplicacoesSheet(wb: ExcelJS.Workbook, d: RedeEmailReportData) {
  const ws = wb.addWorksheet('MULTIPLICAÇÕES');
  const headers = ['data_multiplicacao', 'celula_origem', 'celula_nova', 'coordenacao', 'supervisor', 'casal_lider_nova', 'notas'];
  const rows: (string | number)[][] = [headers];
  d.multiplicacoes.forEach(m => rows.push([m.data, m.celulaOrigem, m.celulaNova, m.coordenacao, m.supervisor, m.casalLiderNova, m.notas]));
  addRows(ws, rows);
  setColWidths(ws, [18, 24, 24, 22, 28, 32, 28]);
  if (d.multiplicacoes.length > 0) addAutoFilter(ws, 1, headers.length, d.multiplicacoes.length);
}

export async function exportRedeReportExcel(data: RedeEmailReportData) {
  const wb = new ExcelJS.Workbook();
  createResumoSheet(wb, data);
  createPulsoSheet(wb, data);
  createCoordenacoesSheet(wb, data);
  createCelulasSheet(wb, data);
  createRelatoriosSheet(wb, data);
  createPendenciasSheet(wb, data);
  createAniversariantesSheet(wb, data);
  createMultiplicacoesSheet(wb, data);

  // Filename: Relatorio_Rede_Amor_a2__<PERIODO>__<DATA>.xlsx
  const periodo = `${data.periodoInicio.replace(/\//g, '-')}_a_${data.periodoFim.replace(/\//g, '-')}`;
  const dataGeracao = format(new Date(), 'yyyy-MM-dd');
  const fileName = `Relatorio_Rede_Amor_a2__${periodo}__${dataGeracao}.xlsx`;
  await saveWorkbook(wb, fileName);
}
