/**
 * Serverless API: POST /api/scan-document
 * Body: { image: base64 string }
 * Returns: { documentType: string, fields: Record<string, unknown> }
 * Env: OPENAI_API_KEY
 */
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

async function scanWithVision(apiKey, imageBase64) {
  const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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

  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No scanner response');

  const parsed = JSON.parse(raw);
  if (!parsed.documentType || typeof parsed.fields !== 'object') throw new Error('Invalid scanner output');
  return { documentType: parsed.documentType, fields: parsed.fields || {} };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const imageBase64 = body.image;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Provide "image" (base64 string) in the request body' });
    }

    const result = await scanWithVision(apiKey, imageBase64);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
