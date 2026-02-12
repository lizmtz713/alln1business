import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writePdfToCache } from './pdf';
import type { TaxSummary } from '../types/tax';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;
const ROW_HEIGHT = 18;

function wrapText(text: string, maxWidth: number, charWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (test.length * charWidth <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function createTaxSummaryPdf(params: {
  summary: TaxSummary;
  businessName?: string;
  year: number;
  generatedAt: string;
  cpaNotes?: string;
}): Promise<{ uri: string; filename: string }> {
  const { summary, businessName, year, generatedAt, cpaNotes } = params;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText(`Alln1 Business - Tax Summary ${year}`, {
    x: MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.2),
  });
  y -= 24;

  if (businessName) {
    page.drawText(businessName, { x: MARGIN, y, size: 12, font: font });
    y -= 18;
  }

  page.drawText(`Period: ${summary.period.label} (${summary.period.start} to ${summary.period.end})`, {
    x: MARGIN,
    y,
    size: 10,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 28;

  const totals = [
    ['Total Income', summary.totalIncome],
    ['Total Expenses', summary.totalExpenses],
    ['Total Deductible', summary.totalDeductible],
    ['Net (Income - Expenses)', summary.totalIncome - summary.totalExpenses],
  ];

  page.drawText('Summary', { x: MARGIN, y, size: 12, font: fontBold });
  y -= 20;

  for (const [label, val] of totals) {
    if (y < MARGIN + 80) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(label, { x: MARGIN, y, size: 10, font: font });
    page.drawText(`$${Number(val).toFixed(2)}`, { x: PAGE_WIDTH - MARGIN - 80, y, size: 10, font: font });
    y -= LINE_HEIGHT;
  }
  y -= 16;

  page.drawText('By Category', { x: MARGIN, y, size: 12, font: fontBold });
  y -= 20;

  page.drawText('Category', { x: MARGIN, y, size: 9, font: fontBold });
  page.drawText('Deductible', { x: 380, y, size: 9, font: fontBold });
  page.drawText('# Tx', { x: 500, y, size: 9, font: fontBold });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
  });
  y -= 12;

  for (const cat of summary.byCategory) {
    if (y < MARGIN + 80) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      page.drawText('Category', { x: MARGIN, y, size: 9, font: fontBold });
      page.drawText('Deductible', { x: 380, y, size: 9, font: fontBold });
      page.drawText('# Tx', { x: 500, y, size: 9, font: fontBold });
      y -= 18;
    }
    const name = cat.name.length > 40 ? cat.name.slice(0, 37) + '...' : cat.name;
    page.drawText(name, { x: MARGIN, y, size: 9, font: font });
    page.drawText(`$${cat.deductibleAmount.toFixed(2)}`, { x: 380, y, size: 9, font: font });
    page.drawText(String(cat.txCount), { x: 500, y, size: 9, font: font });
    y -= ROW_HEIGHT;
  }
  y -= 20;

  if (summary.warnings.length > 0) {
    if (y < MARGIN + 100) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText('Warnings & Tips', { x: MARGIN, y, size: 12, font: fontBold });
    y -= 20;

    for (const w of summary.warnings) {
      if (y < MARGIN + 80) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
      page.drawText(`- ${w.title}`, { x: MARGIN, y, size: 9, font: fontBold });
      y -= 12;
      const lines = wrapText(w.body, CONTENT_WIDTH - 20, 5);
      for (const line of lines.slice(0, 3)) {
        if (y < MARGIN + 60) break;
        page.drawText(line, { x: MARGIN + 12, y, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
        y -= 11;
      }
      y -= 8;
    }
    y -= 12;
  }

  if (cpaNotes && cpaNotes.trim()) {
    if (y < MARGIN + 120) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText('CPA Notes', { x: MARGIN, y, size: 12, font: fontBold });
    y -= 18;
    const lines = wrapText(cpaNotes, Math.floor(CONTENT_WIDTH / 5), 5);
    for (const line of lines.slice(0, 12)) {
      if (y < MARGIN + 50) break;
      page.drawText(line, { x: MARGIN, y, size: 9, font: font });
      y -= LINE_HEIGHT;
    }
    y -= 12;
  }

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  lastPage.drawText(`Generated ${generatedAt} - Alln1 Business`, {
    x: MARGIN,
    y: MARGIN + 20,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const bytesBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pdfBytes))));
  const filename = `tax-summary-${year}.pdf`;
  const localPath = await writePdfToCache(bytesBase64, filename);

  return { uri: localPath, filename };
}
