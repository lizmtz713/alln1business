const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const VOICE_API_URL = process.env.EXPO_PUBLIC_VOICE_API_URL ?? '';

export const VOICE_CATEGORIES = [
  'bill',
  'family_member',
  'vehicle',
  'pet',
  'appointment',
  'contact',
  'document',
  'reminder',
] as const;

export type VoiceCategory = (typeof VOICE_CATEGORIES)[number];

export type VoiceToDataResult = {
  category: VoiceCategory | string;
  fields: Record<string, unknown>;
};

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

/**
 * Call optional backend API for voice-to-data (keeps API key server-side).
 * POST body: { text: string } or { audio: base64 string }
 * Response: { category, fields }
 */
export async function voiceToDataViaApi(
  payload: { text?: string; audio?: string }
): Promise<VoiceToDataResult> {
  const res = await fetch(VOICE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Voice API error: ${res.status}`);
  }
  const data = (await res.json()) as VoiceToDataResult;
  if (!data.category || typeof data.fields !== 'object') {
    throw new Error('Invalid voice API response');
  }
  return data;
}

/**
 * Transcribe audio using OpenAI Whisper. Requires EXPO_PUBLIC_OPENAI_API_KEY.
 */
export async function transcribeWithWhisper(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY.');

  const formData = new FormData();
  // @ts-expect-error React Native FormData accepts { uri, name, type }
  formData.append('file', {
    uri: audioUri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  });
  formData.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      // Let fetch set Content-Type for FormData with boundary
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Whisper error: ${res.status}`);
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? '').trim() || 'No speech detected.';
}

/**
 * Parse household entry text with GPT-4o-mini. Returns category and extracted fields.
 */
export async function parseHouseholdEntry(text: string): Promise<VoiceToDataResult> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not set. Add EXPO_PUBLIC_OPENAI_API_KEY.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `OpenAI error: ${res.status}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('No response from parser');

  try {
    const parsed = JSON.parse(raw) as VoiceToDataResult;
    if (!parsed.category || typeof parsed.fields !== 'object') {
      throw new Error('Invalid parser output');
    }
    return {
      category: parsed.category,
      fields: parsed.fields ?? {},
    };
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error('Parser returned invalid JSON');
    throw e;
  }
}

/**
 * Convert audio URI to text (Whisper) then parse (GPT). Uses backend API if EXPO_PUBLIC_VOICE_API_URL is set.
 */
export async function voiceToDataFromAudio(audioUri: string): Promise<VoiceToDataResult> {
  if (VOICE_API_URL) {
    const base64 = await fileUriToBase64(audioUri);
    return voiceToDataViaApi({ audio: base64 });
  }
  const text = await transcribeWithWhisper(audioUri);
  return parseHouseholdEntry(text);
}

/**
 * Parse text only. Uses backend API if VOICE_API_URL is set and we have no audio.
 */
export async function voiceToDataFromText(text: string): Promise<VoiceToDataResult> {
  if (VOICE_API_URL) {
    return voiceToDataViaApi({ text });
  }
  return parseHouseholdEntry(text);
}

async function fileUriToBase64(uri: string): Promise<string> {
  const { readAsStringAsync } = await import('expo-file-system');
  const path = uri.startsWith('file://') ? uri : `file://${uri}`;
  const base64 = await readAsStringAsync(path, { encoding: 'base64' });
  return base64;
}

export const hasVoiceApi = Boolean(OPENAI_API_KEY) || Boolean(VOICE_API_URL);
