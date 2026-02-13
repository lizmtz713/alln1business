/**
 * POST /api/scan-bill
 * Body: { image: base64 string }
 * Returns: { documentType: "bill" | "receipt", fields: { ... } }
 * Dedicated extraction for bills and receipts: provider, amount, due date, account, service period, line items.
 * Env: OPENAI_API_KEY
 */

const SYSTEM_PROMPT = `You are a bill and receipt scanner for a household app. Analyze the image and:

1. Detect document type: "bill" (utility, subscription, insurance, mortgage, etc.) or "receipt" (store purchase, payment confirmation).

2. Extract ALL visible data using these exact field names when applicable:

For BILLS:
- provider_name (string): Company or payee name (e.g. TXU Energy, Chase, AT&T)
- store_name (string): Same as provider_name if not set; for display
- amount (number): Total amount due - primary amount on the bill
- amount_due (number): If different from total, the "amount due" or "pay this amount"
- amount_paid (number): If this is a paid confirmation, the amount paid
- due_date (YYYY-MM-DD): Payment due date
- account_number (string): Account or customer ID
- service_period_start (YYYY-MM-DD): Start of service period if shown
- service_period_end (YYYY-MM-DD): End of service period if shown
- bill_name (string): Short label e.g. "Electric", "Internet", "Mortgage"
- payment_url (string): Pay online URL if visible
- line_items (array of objects): Each { description: string, amount: number } for line breakdown
- notes (string): Any extra text (min balance, late fee, etc.)

For RECEIPTS:
- store_name (string): Store or vendor name
- provider_name (string): Same as store_name if not set
- total_amount (number): Total paid
- amount (number): Same as total_amount
- date (YYYY-MM-DD): Transaction date
- items (array of strings): Line item descriptions
- line_items (array of objects): Each { description: string, amount: number } if amounts visible
- tax (number): Tax amount if shown
- payment_method (string): Card, cash, etc.
- account_number (string): Last 4 of card or reference if visible

Return ONLY valid JSON with no markdown: {"documentType":"bill"|"receipt","fields":{...}}
Use null for missing values. Normalize dates to YYYY-MM-DD. For "due on the 15th" use current or next month.`;

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

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No scanner response');

  const parsed = JSON.parse(raw);
  const docType = parsed.documentType === 'receipt' ? 'receipt' : 'bill';
  if (typeof parsed.fields !== 'object') throw new Error('Invalid scanner output');
  return { documentType: docType, fields: parsed.fields || {} };
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
