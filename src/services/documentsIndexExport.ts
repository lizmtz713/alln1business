import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import type { Document } from '../types/documents';

function escapeCsvField(val: string | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportDocumentsIndexCsv(params: {
  docs: Document[];
  year: number;
}): Promise<{ uri: string; filename: string }> {
  const { docs, year } = params;

  const header = [
    'Name',
    'DocType',
    'Category',
    'CustomerId',
    'VendorId',
    'CreatedAt',
    'ExpirationDate',
    'Signed',
    'Tags',
    'FileUrl',
    'PdfUrl',
    'TxtUrl',
  ].join(',');

  const rows = docs.map((d) => {
    const name = escapeCsvField(d.name);
    const docType = escapeCsvField(d.doc_type);
    const category = escapeCsvField(d.category);
    const customerId = escapeCsvField(d.related_customer_id);
    const vendorId = escapeCsvField(d.related_vendor_id);
    const createdAt = d.created_at ? escapeCsvField(d.created_at.split('T')[0]) : '';
    const expirationDate = d.expiration_date ? escapeCsvField(d.expiration_date.split('T')[0]) : '';
    const signed = d.is_signed ? 'Yes' : 'No';
    const tags = d.tags ? escapeCsvField(d.tags.join('; ')) : '';
    const fileUrl = escapeCsvField(d.file_url);
    const pdfUrl = escapeCsvField(d.pdf_url);
    const txtUrl = escapeCsvField(d.txt_file_url);
    return [name, docType, category, customerId, vendorId, createdAt, expirationDate, signed, tags, fileUrl, pdfUrl, txtUrl].join(',');
  });

  const csv = [header, ...rows].join('\r\n');
  const filename = `documents-index-${year}.csv`;
  const dir = cacheDirectory ?? documentDirectory ?? '';
  const path = `${dir}${filename}`;

  await writeAsStringAsync(path, csv, { encoding: 'utf8' });

  return { uri: path, filename };
}
