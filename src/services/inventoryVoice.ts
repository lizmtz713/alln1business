/**
 * Parse voice or typed home inventory transcript into structured items.
 * E.g. "Living room: 65 inch Samsung TV 2022 $800, leather couch Rooms To Go $1500..."
 */
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type ParsedInventoryItem = {
  room: string;
  item_name: string;
  brand: string | null;
  purchase_year: number | null;
  value: number;
  category: string | null;
};

const CATEGORIES = [
  'electronics',
  'furniture',
  'appliances',
  'decor',
  'kitchen',
  'bedroom',
  'bathroom',
  'outdoor',
  'tools',
  'other',
] as const;

const SYSTEM_PROMPT = `You are a home inventory parser for insurance. The user speaks or types a room-by-room list of items.

Rules:
- Detect room names from phrases like "Living room:", "Kitchen:", "Bedroom:", "Master bath:", etc.
- For each item extract: item name, brand (if mentioned), purchase year (if mentioned, 4 digits), value in dollars (number only).
- If multiple items are in one phrase (e.g. "couch $1500, coffee table $200"), split into separate items.
- Assign one category per item from: ${CATEGORIES.join(', ')}. Use "other" if unclear.
- Return ONLY a valid JSON array of objects. Each object: {"room":"...","item_name":"...","brand":null|"...","purchase_year":null|number,"value":number,"category":"..."}
- room must be a short label (e.g. "Living room", "Kitchen"). Normalize "master bedroom" to "Master bedroom".
- value must be a number (no $ or commas). If no price given, use 0.
- Do not include markdown, explanation, or text outside the JSON array.`;

export async function parseInventoryTranscript(transcript: string): Promise<ParsedInventoryItem[]> {
  const text = transcript.trim();
  if (!text) return [];

  if (!OPENAI_API_KEY) {
    return fallbackParse(text);
  }

  try {
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
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) return fallbackParse(text);

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return fallbackParse(text);

    const parsed = JSON.parse(raw) as { items?: ParsedInventoryItem[] } | ParsedInventoryItem[];
    const items = Array.isArray(parsed) ? parsed : parsed?.items ?? [];
    return items
      .filter(
        (x) =>
          x &&
          typeof x.room === 'string' &&
          typeof x.item_name === 'string' &&
          typeof x.value === 'number'
      )
      .map((x) => ({
        room: String(x.room).trim() || 'Other',
        item_name: String(x.item_name).trim(),
        brand: x.brand != null ? String(x.brand).trim() || null : null,
        purchase_year:
          typeof x.purchase_year === 'number' && x.purchase_year >= 1900 && x.purchase_year <= 2100
            ? x.purchase_year
            : null,
        value: Number(x.value) >= 0 ? Number(x.value) : 0,
        category:
          x.category && CATEGORIES.includes(x.category as (typeof CATEGORIES)[number])
            ? (x.category as (typeof CATEGORIES)[number])
            : 'other',
      }));
  } catch {
    return fallbackParse(text);
  }
}

/** Simple regex-based parse when no API key. */
function fallbackParse(text: string): ParsedInventoryItem[] {
  const items: ParsedInventoryItem[] = [];
  let currentRoom = 'Other';

  const roomPattern = /^\s*([A-Za-z][A-Za-z\s]+?)\s*:\s*/gm;
  const parts = text.split(roomPattern).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i].trim();
    if (!token) continue;
    if (i === 0 || (token.length < 25 && !/\d/.test(token) && !parts[i - 1]?.includes('$'))) {
      currentRoom = token.replace(/\s*:\s*$/, '');
      if (parts[i + 1] != null) continue;
    }

    const chunk = token;
    const dollarMatch = chunk.match(/\$\s*([\d,]+(?:\.\d{2})?)/g);
    const prices = dollarMatch
      ? dollarMatch.map((m) => parseFloat(m.replace(/[$,]/g, '')))
      : [0];
    const nameMatch = chunk.match(/^([^$]+?)(?:\s+\$\s*[\d,]+(?:\.\d{2})?)?\s*$/);
    const name = nameMatch ? nameMatch[1].replace(/,/g, ' ').trim() : chunk.split(',')[0].trim();
    const yearMatch = chunk.match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

    if (name && name.length > 1) {
      items.push({
        room: currentRoom,
        item_name: name,
        brand: null,
        purchase_year: year,
        value: prices[0] ?? 0,
        category: 'other',
      });
    }
  }

  if (items.length === 0 && text.length > 10) {
    items.push({
      room: 'Other',
      item_name: text.slice(0, 200),
      brand: null,
      purchase_year: null,
      value: 0,
      category: 'other',
    });
  }
  return items;
}
