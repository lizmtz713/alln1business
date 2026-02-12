import {
  cacheDirectory,
  documentDirectory,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { TaxSummary } from '../types/tax';
import type { Transaction } from '../types/transactions';

function escapeCsvField(val: string | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function exportTaxCsv(params: {
  summary: TaxSummary;
  transactions: Transaction[];
}): Promise<{ uri: string; filename: string }> {
  const { summary, transactions } = params;
  const header = [
    'Date',
    'Type',
    'Vendor',
    'Description',
    'Category',
    'Amount',
    'TaxDeductible',
    'ReceiptUrl',
    'Notes',
  ].join(',');

  const rows = transactions.map((t) => {
    const date = (t.date ?? '').split('T')[0];
    const type = t.type ?? 'expense';
    const vendor = escapeCsvField(t.vendor);
    const desc = escapeCsvField(t.description);
    const cat = escapeCsvField(t.category);
    const amt = Math.abs(Number(t.amount)).toFixed(2);
    const taxDed = t.tax_deductible ? 'Yes' : 'No';
    const receipt = escapeCsvField(t.receipt_url);
    const notes = escapeCsvField(t.notes);
    return [date, type, vendor, desc, cat, amt, taxDed, receipt, notes].join(',');
  });

  const csv = [header, ...rows].join('\r\n');
  const filename = `tax-summary-${summary.period.start}-${summary.period.end}.csv`.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dir = cacheDirectory ?? documentDirectory ?? '';
  const path = `${dir}${filename}`;

  await writeAsStringAsync(path, csv, {
    encoding: 'utf8',
  });

  return { uri: path, filename };
}

export async function shareTaxCsv(params: {
  summary: TaxSummary;
  transactions: Transaction[];
}): Promise<void> {
  const { uri } = await exportTaxCsv(params);
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Tax Summary',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
