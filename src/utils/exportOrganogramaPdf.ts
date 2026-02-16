import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportOrganogramaPdf(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Temporarily expand all collapsed sections for PDF
  const collapsedElements = element.querySelectorAll('[data-org-expandable="true"]');
  const originalStates: { el: Element; wasHidden: boolean }[] = [];
  
  collapsedElements.forEach(el => {
    const content = el.querySelector('[data-org-content]');
    if (content && (content as HTMLElement).style.display === 'none') {
      originalStates.push({ el: content, wasHidden: true });
      (content as HTMLElement).style.display = '';
    }
  });

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
  });

  // Restore collapsed states
  originalStates.forEach(({ el, wasHidden }) => {
    if (wasHidden) (el as HTMLElement).style.display = 'none';
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 15;
  const headerHeight = 25;
  const contentWidth = pdfWidth - margin * 2;

  const scale = contentWidth / imgWidth;
  const scaledHeight = imgHeight * scale;

  const pdf = new jsPDF('p', 'mm', 'a4');

  // Header
  pdf.setFillColor(30, 30, 35);
  pdf.rect(0, 0, pdfWidth, headerHeight, 'F');
  pdf.setTextColor(216, 154, 60);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Organograma – Rede Amor A 2', margin, 12);
  pdf.setFontSize(8);
  pdf.setTextColor(160, 160, 170);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, 19);
  pdf.text('Igreja do Amor', pdfWidth - margin, 19, { align: 'right' });

  // Content - handle multi-page
  const availableHeight = pdfHeight - headerHeight - margin * 2;
  let remainingHeight = scaledHeight;
  let sourceY = 0;
  let pageNum = 0;

  while (remainingHeight > 0) {
    const currentPageHeight = Math.min(remainingHeight, availableHeight);
    const sourceHeight = currentPageHeight / scale;

    if (pageNum > 0) {
      pdf.addPage();
    }

    // Add image slice
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = sourceHeight;
    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
      const sliceData = sliceCanvas.toDataURL('image/png');
      pdf.addImage(sliceData, 'PNG', margin, pageNum === 0 ? headerHeight + 5 : margin, contentWidth, currentPageHeight);
    }

    sourceY += sourceHeight;
    remainingHeight -= currentPageHeight;
    pageNum++;
  }

  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 130);
    pdf.text(`Página ${i} de ${totalPages}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
  }

  pdf.save('organograma-rede-amor-a2.pdf');
}
