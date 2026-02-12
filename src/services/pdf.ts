import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type InvoiceData = {
  invoice: {
    id: string;
    user_id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number | null;
    discount_amount: number | null;
    total: number;
    amount_paid: number | null;
    balance_due: number | null;
    notes: string | null;
    terms: string | null;
  };
  customers: { company_name: string | null; contact_name: string | null; email: string | null; address: string | null; city: string | null; state: string | null; zip: string | null } | null;
  invoice_items: { description: string; quantity: number; unit_price: number; amount: number }[];
  profile: { business_name: string | null; full_name: string | null } | null;
};

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

function wrapLines(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  for (const p of paragraphs) {
    const softLines = p.split('\n');
    for (const sl of softLines) {
      const wrapped = wrapText(sl, maxCharsPerLine * 6, 6);
      lines.push(...wrapped);
    }
    lines.push('');
  }
  return lines.filter((l, i) => l || i === 0);
}

export async function createInvoicePdf(
  invoiceId: string,
  userId: string
): Promise<{ localPath: string; bytesBase64: string; filename: string }> {
  const { data: invData, error: invErr } = await supabase
    .from('invoices')
    .select('*, customers(company_name, contact_name, email, address, city, state, zip)')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single();

  if (invErr || !invData) throw new Error('Invoice not found');

  const { data: itemsData } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true });

  const { data: profileData } = await supabase
    .from('profiles')
    .select('business_name, full_name')
    .eq('id', userId)
    .single();

  const data: InvoiceData = {
    invoice: invData as InvoiceData['invoice'],
    customers: (invData as { customers?: InvoiceData['customers'] }).customers ?? null,
    invoice_items: (itemsData ?? []) as InvoiceData['invoice_items'],
    profile: profileData as InvoiceData['profile'],
  };

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const businessName = data.profile?.business_name || data.profile?.full_name || 'Your Business';
  page.drawText(businessName, { x: MARGIN, y, size: 18, font: fontBold });
  y -= 24;

  page.drawText('INVOICE', { x: MARGIN, y, size: 24, font: fontBold });
  y -= 30;

  page.drawText(data.invoice.invoice_number, { x: MARGIN, y, size: 14, font: font });
  y -= 24;

  const customer = data.customers;
  const customerName = customer?.company_name || customer?.contact_name || 'Customer';
  const customerAddr = [customer?.address, [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(', ');

  page.drawText('Bill To:', { x: MARGIN, y, size: 10, font: fontBold });
  y -= 14;
  page.drawText(customerName, { x: MARGIN, y, size: 11, font: font });
  y -= 14;
  if (customerAddr) {
    page.drawText(customerAddr, { x: MARGIN, y, size: 10, font: font });
    y -= 12;
  }
  if (customer?.email) {
    page.drawText(customer.email, { x: MARGIN, y, size: 10, font: font });
    y -= 12;
  }
  y -= 12;

  const invDate = new Date(data.invoice.invoice_date).toLocaleDateString('en-US');
  const dueDate = new Date(data.invoice.due_date).toLocaleDateString('en-US');
  page.drawText(`Invoice Date: ${invDate}`, { x: MARGIN, y, size: 10, font: font });
  page.drawText(`Due Date: ${dueDate}`, { x: PAGE_WIDTH - MARGIN - 120, y, size: 10, font: font });
  y -= 24;

  page.drawText('Description', { x: MARGIN, y, size: 10, font: fontBold });
  page.drawText('Qty', { x: 380, y, size: 10, font: fontBold });
  page.drawText('Rate', { x: 430, y, size: 10, font: fontBold });
  page.drawText('Amount', { x: 510, y, size: 10, font: fontBold });
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.5,
  });
  y -= 16;

  for (const item of data.invoice_items) {
    page.drawText(item.description.slice(0, 45), { x: MARGIN, y, size: 10, font: font });
    page.drawText(String(item.quantity), { x: 390, y, size: 10, font: font });
    page.drawText(`$${Number(item.unit_price).toFixed(2)}`, { x: 430, y, size: 10, font: font });
    page.drawText(`$${Number(item.amount).toFixed(2)}`, { x: 510, y, size: 10, font: font });
    y -= 16;
  }
  y -= 12;

  page.drawText('Subtotal:', { x: 460, y, size: 10, font: font });
  page.drawText(`$${Number(data.invoice.subtotal).toFixed(2)}`, { x: 510, y, size: 10, font: font });
  y -= 14;
  if (Number(data.invoice.tax_amount) > 0) {
    page.drawText('Tax:', { x: 460, y, size: 10, font: font });
    page.drawText(`$${Number(data.invoice.tax_amount).toFixed(2)}`, { x: 510, y, size: 10, font: font });
    y -= 14;
  }
  if (Number(data.invoice.discount_amount) > 0) {
    page.drawText('Discount:', { x: 460, y, size: 10, font: font });
    page.drawText(`-$${Number(data.invoice.discount_amount).toFixed(2)}`, { x: 510, y, size: 10, font: font });
    y -= 14;
  }
  page.drawText('Total:', { x: 460, y, size: 12, font: fontBold });
  page.drawText(`$${Number(data.invoice.total).toFixed(2)}`, { x: 510, y, size: 12, font: fontBold });
  y -= 16;
  if (Number(data.invoice.balance_due) > 0) {
    page.drawText('Balance Due:', { x: 460, y, size: 10, font: fontBold });
    page.drawText(`$${Number(data.invoice.balance_due).toFixed(2)}`, { x: 510, y, size: 10, font: fontBold });
    y -= 14;
  }
  y -= 16;

  if (data.invoice.notes) {
    page.drawText('Notes:', { x: MARGIN, y, size: 10, font: fontBold });
    y -= 12;
    const noteLines = wrapLines(data.invoice.notes, 85);
    for (const line of noteLines.slice(0, 5)) {
      if (y < MARGIN + 60) break;
      page.drawText(line || ' ', { x: MARGIN, y, size: 9, font: font });
      y -= 12;
    }
    y -= 8;
  }
  if (data.invoice.terms) {
    page.drawText('Terms:', { x: MARGIN, y, size: 10, font: fontBold });
    y -= 12;
    const termLines = wrapLines(data.invoice.terms, 85);
    for (const line of termLines.slice(0, 3)) {
      if (y < MARGIN + 60) break;
      page.drawText(line || ' ', { x: MARGIN, y, size: 9, font: font });
      y -= 12;
    }
    y -= 8;
  }

  y = MARGIN + 20;
  page.drawText('Generated by Alln1 Business', {
    x: MARGIN,
    y,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const bytesBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pdfBytes))));
  const filename = `invoice-${data.invoice.invoice_number.replace(/\s+/g, '-')}.pdf`;
  const localPath = await writePdfToCache(bytesBase64, filename);

  return { localPath, bytesBase64, filename };
}

export type CreateTextDocumentPdfParams = {
  title: string;
  contentText: string;
  meta?: { doc_type?: string; category?: string };
  businessName?: string;
};

export async function createTextDocumentPdf(
  params: CreateTextDocumentPdfParams
): Promise<{ localPath: string; bytesBase64: string; filename: string }> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const lineHeight = 14;
  const titleSize = 16;
  const bodySize = 10;
  const maxCharsPerLine = Math.floor(CONTENT_WIDTH / 6);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  if (params.businessName) {
    page.drawText(params.businessName, { x: MARGIN, y, size: 11, font: font });
    y -= 16;
  }

  page.drawText(params.title, { x: MARGIN, y, size: titleSize, font: fontBold });
  y -= 24;

  if (params.meta?.doc_type || params.meta?.category) {
    const metaStr = [params.meta.doc_type, params.meta.category].filter(Boolean).join(' · ');
    page.drawText(metaStr, { x: MARGIN, y, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
    y -= 16;
  }

  const lines = wrapLines(params.contentText, maxCharsPerLine);

  for (const line of lines) {
    if (y < MARGIN + 50) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(line || ' ', { x: MARGIN, y, size: bodySize, font: font });
    y -= lineHeight;
  }

  y = MARGIN + 20;
  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
  lastPage.drawText('Not legal advice. Generated by Alln1 Business.', {
    x: MARGIN,
    y,
    size: 8,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const bytesBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pdfBytes))));
  const slug = params.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40) || 'document';
  const filename = `${slug}.pdf`;
  const localPath = await writePdfToCache(bytesBase64, filename);

  return { localPath, bytesBase64, filename };
}

export async function writePdfToCache(
  bytesBase64: string,
  filename: string
): Promise<string> {
  const dir = `${FileSystem.cacheDirectory}pdf/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const path = `${dir}${Date.now()}-${filename}`;
  await FileSystem.writeAsStringAsync(path, bytesBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}
