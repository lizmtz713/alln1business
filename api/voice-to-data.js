/**
 * Serverless API: POST /api/voice-to-data
 * Body: { text?: string, audio?: string } (audio = base64)
 * Returns: { category: string, fields: Record<string, unknown> }
 * Env: OPENAI_API_KEY
 */
const SYSTEM_PROMPT = `You are a household data parser for Life OS. Parse the user's spoken or typed household data entry.

Categories: bill, family_member, vehicle, pet, appointment, contact, document, reminder.

For each category, extract every relevant field the user mentioned. Use these field names when applicable:

bill: bill_name, provider_name, amount (number), due_date (YYYY-MM-DD), due_day_of_month (1-31), auto_pay (boolean), payment_url, notes
family_member: name, relationship, age (number), shoe_size, shirt_size, allergies (string or array), notes
vehicle: year (number), make, model, color, license_plate, registration_expiry (YYYY-MM-DD or month YYYY), vin, notes
pet: name, type (e.g. dog, cat), breed, age (number or string), vet_name, vet_phone, notes
appointment: title, appointment_date (YYYY-MM-DD), appointment_time (HH:MM 24h), location, notes
contact: name, service_type (plumber, electrician, hvac, lawn, other), phone, email, notes
document: name, doc_type (bill, contract, form), description, notes
reminder: title, reminder_date (YYYY-MM-DD), reminder_time, notes

Return ONLY valid JSON with no markdown or explanation: {"category":"<category>","fields":{...}}
Use null for missing values. For dates like "due on the 15th" use current/next month and day 15. For "March 2025" use the last day of that month or first day.`;

async function transcribe(apiKey, audioBase64) {
  const buffer = Buffer.from(audioBase64, 'base64');
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: 'audio/m4a' }), 'audio.m4a');
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.text || '').trim() || 'No speech detected.';
}

async function parseWithGpt(apiKey, text) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No parser response');
  const parsed = JSON.parse(raw);
  if (!parsed.category || typeof parsed.fields !== 'object') throw new Error('Invalid parser output');
  return { category: parsed.category, fields: parsed.fields || {} };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { text, audio: audioBase64 } = body;

    let inputText = text;
    if (inputText == null && audioBase64) {
      inputText = await transcribe(apiKey, audioBase64);
    }
    if (!inputText || typeof inputText !== 'string') {
      return res.status(400).json({ error: 'Provide "text" or "audio" (base64) in the request body' });
    }

    const result = await parseWithGpt(apiKey, inputText);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
