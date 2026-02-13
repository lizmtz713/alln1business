const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const SCAN_API_URL = process.env.EXPO_PUBLIC_SCAN_API_URL ?? '';

export const SCAN_DOCUMENT_TYPES = [
  'bill',
  'id_document',
  'insurance_card',
  'receipt',
  'vet_record',
  'report_card',
  'other',
] as const;

export type ScanDocumentType = (typeof SCAN_DOCUMENT_TYPES)[number];

export type ScanDocumentResult = {
  documentType: ScanDocumentType | string;
  fields: Record<string, unknown>;
};

const SYSTEM_PROMPT = `You are a document scanner for a household app. Analyze the image and:

1. Detect the document type. Types: bill, id_document (ID card, passport, driver's license), insurance_card, receipt, vet_record (pet vaccination/health), report_card, other.

2. Extract ALL visible text and structure it into fields. Use these field names when applicable:

bill: provider_name, amount (number), due_date (YYYY-MM-DD), account_number, bill_name, payment_url, notes
id_document: full_name, date_of_birth (YYYY-MM-DD), expiry_date (YYYY-MM-DD), document_number, document_type (passport, license, id), address
insurance_card: provider, policy_number, group_number, member_id, phone, plan_name, coverage_dates
receipt: store_name, total_amount (number), date (YYYY-MM-DD), items (array of strings), tax, payment_method
vet_record: pet_name, vet_name, vet_phone, vet_clinic, vaccines (array: name and date), visit_date, notes
report_card: student_name, school, grade_level, grades (array or object), teacher_comments, term, gpa

Return ONLY valid JSON with no markdown: {"documentType":"<type>","fields":{...}}
Use null for missing values. Normalize dates to YYYY-MM-DD when possible.`;

import * as FileSystem from 'expo-file-system/legacy';

function readImageAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

/**
 * Call optional backend for scan (keeps API key server-side).
 * POST body: { image: base64 }
 */
export async function scanDocumentViaApi(imageBase64: string): Promise<ScanDocumentResult> {
  const res = await fetch(SCAN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Scan API error: ${res.status}`);
  }
  const data = (await res.json()) as ScanDocumentResult;
  if (!data.documentType || typeof data.fields !== 'object') {
    throw new Error('Invalid scan API response');
  }
  return data;
}

/**
 * Scan image with GPT-4o Vision. Uses backend if EXPO_PUBLIC_SCAN_API_URL is set.
 */
export async function scanDocument(imageUri: string): Promise<ScanDocumentResult> {
  const base64 = await readImageAsBase64(imageUri);
  if (SCAN_API_URL) {
    return scanDocumentViaApi(base64);
  }
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY or deploy scan API.');
  }

  const dataUrl = `data:image/jpeg;base64,${base64}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all visible data from this document image. Return JSON only.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `OpenAI Vision error: ${res.status}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No response from document scanner');

  try {
    const parsed = JSON.parse(raw) as ScanDocumentResult;
    if (!parsed.documentType || typeof parsed.fields !== 'object') {
      throw new Error('Invalid scanner output');
    }
    return {
      documentType: parsed.documentType,
      fields: parsed.fields ?? {},
    };
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error('Scanner returned invalid JSON');
    throw e;
  }
}

export const hasScanApi = Boolean(OPENAI_API_KEY) || Boolean(SCAN_API_URL);
