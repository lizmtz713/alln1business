/**
 * Bill/receipt scanning with rich extraction.
 * Uses /api/scan-bill if SCAN_BILL_API_URL (or derived from SCAN_API_URL) is set, else OpenAI client.
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SCAN_API_URL = process.env.EXPO_PUBLIC_SCAN_API_URL ?? '';
let SCAN_BILL_API_URL = process.env.EXPO_PUBLIC_SCAN_BILL_API_URL ?? '';
if (!SCAN_BILL_API_URL && SCAN_API_URL) {
  SCAN_BILL_API_URL = SCAN_API_URL.replace(/\/api\/scan-document\/?$/, '') + '/api/scan-bill';
}

export type ScanBillDocumentType = 'bill' | 'receipt';

export type ScanBillLineItem = { description?: string; amount?: number };

export type ScanBillFields = {
  provider_name?: string | null;
  store_name?: string | null;
  bill_name?: string | null;
  amount?: number | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  total_amount?: number | null;
  due_date?: string | null;
  date?: string | null;
  account_number?: string | null;
  service_period_start?: string | null;
  service_period_end?: string | null;
  payment_url?: string | null;
  line_items?: ScanBillLineItem[] | null;
  items?: string[] | null;
  tax?: number | null;
  payment_method?: string | null;
  notes?: string | null;
};

export type ScanBillResult = {
  documentType: ScanBillDocumentType;
  fields: ScanBillFields;
};

const SYSTEM_PROMPT = `You are a bill and receipt scanner. Analyze the image and:
1. Detect document type: "bill" or "receipt".
2. Extract: provider_name, store_name, bill_name, amount, amount_due, amount_paid, total_amount, due_date, date, account_number, service_period_start, service_period_end, payment_url, line_items (array of {description, amount}), items (array of strings), tax, payment_method, notes.
Return ONLY valid JSON: {"documentType":"bill"|"receipt","fields":{...}} Use null for missing values. Dates as YYYY-MM-DD.`;

async function scanBillViaApi(imageBase64: string): Promise<ScanBillResult> {
  const res = await fetch(SCAN_BILL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Scan bill API error: ${res.status}`);
  }
  const data = (await res.json()) as ScanBillResult;
  if (!data.documentType || typeof data.fields !== 'object') throw new Error('Invalid scan bill response');
  return data;
}

async function scanBillWithOpenAI(imageBase64: string): Promise<ScanBillResult> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY or deploy scan-bill API.');
  const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all visible data from this bill or receipt. Return JSON only.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No scan response');
  const parsed = JSON.parse(raw) as ScanBillResult;
  const documentType = parsed.documentType === 'receipt' ? 'receipt' : 'bill';
  return { documentType, fields: parsed.fields ?? {} };
}

export async function scanBill(imageUri: string): Promise<ScanBillResult> {
  const FileSystem = await import('expo-file-system/legacy');
  const path = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
  const base64 = await FileSystem.readAsStringAsync(path, { encoding: 'base64' });
  if (SCAN_BILL_API_URL) return scanBillViaApi(base64);
  return scanBillWithOpenAI(base64);
}

/** Primary amount for display and bill creation (amount_due or amount or total_amount) */
export function getScanAmount(fields: ScanBillFields): number | null {
  const n = fields.amount_due ?? fields.amount ?? fields.total_amount ?? fields.amount_paid;
  if (n != null && typeof n === 'number' && !Number.isNaN(n)) return n;
  return null;
}

/** Primary date (due_date for bills, date for receipts) */
export function getScanDate(fields: ScanBillFields, docType: ScanBillDocumentType): string | null {
  const d = docType === 'bill' ? fields.due_date : fields.date ?? fields.due_date;
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return null;
}

/** Provider or store name for matching */
export function getScanProviderName(fields: ScanBillFields): string {
  const name = fields.provider_name ?? fields.store_name ?? fields.bill_name ?? '';
  return typeof name === 'string' ? name.trim() : '';
}

export const hasScanBillApi = Boolean(SCAN_BILL_API_URL) || Boolean(OPENAI_API_KEY);
